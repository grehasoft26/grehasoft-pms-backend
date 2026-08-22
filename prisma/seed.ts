import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcryptjs';

// Load .env manually if process.env.DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
      const match = line.match(/^\s*([^#\s=]+)\s*=\s*(.*)$/);
      if (match) {
        const key = match[1];
        let val = match[2].trim();
        if (val.startsWith('"') && val.endsWith('"')) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    }
  }
}

function parseDatabaseUrl(url: string) {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port, 10) : 3306,
      user: parsed.username,
      password: decodeURIComponent(parsed.password),
      database: parsed.pathname.replace(/^\//, ''),
    };
  } catch (e) {
    const regex = /^mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
    const match = url.match(regex);
    if (!match) throw new Error('Invalid DATABASE_URL format');
    return {
      user: match[1],
      password: decodeURIComponent(match[2]),
      host: match[3],
      port: parseInt(match[4], 10),
      database: match[5],
    };
  }
}

const dbUrl = process.env.DATABASE_URL || '';
const dbConfig = parseDatabaseUrl(dbUrl);

const adapter = new PrismaMariaDb({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting Database Seeding...');

  // 0. Default Company
  console.log('Seeding Default Company...');
  const defaultCompany = await prisma.company.upsert({
    where: { id: '00000000-0000-0000-0000-000000000000' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'Default Company',
      status: 'ACTIVE',
    },
  });

  // 1. Roles
  console.log('Seeding Roles...');
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'Super Admin' },
    update: {},
    create: {
      name: 'Super Admin',
      description: 'Full system administrative access',
      isSystem: true,
    },
  });

  const companyAdminRole = await prisma.role.upsert({
    where: { name: 'Company Admin' },
    update: {},
    create: {
      name: 'Company Admin',
      description: 'Company-level administration access',
      isSystem: true,
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'Manager' },
    update: {},
    create: {
      name: 'Manager',
      description: 'Departmental management access',
      isSystem: false,
    },
  });

  const employeeRole = await prisma.role.upsert({
    where: { name: 'Employee' },
    update: {},
    create: {
      name: 'Employee',
      description: 'Standard employee access',
      isSystem: false,
    },
  });

  // 2. Permission Group, Categories, and Permissions
  console.log('Seeding Permissions...');
  const group = await prisma.permissionGroup.upsert({
    where: { name: 'Identity & Access Management (IAM)' },
    update: {},
    create: {
      name: 'Identity & Access Management (IAM)',
      description: 'Manages users, roles, and permissions',
    },
  });

  const categories = [
    {
      name: 'Users',
      permissions: [
        { name: 'Create User', code: 'users.create' },
        { name: 'Read User', code: 'users.read' },
        { name: 'Update User', code: 'users.update' },
        { name: 'Delete User', code: 'users.delete' },
        { name: 'Restore User', code: 'users.restore' },
      ],
    },
    {
      name: 'Roles',
      permissions: [
        { name: 'Create Role', code: 'roles.create' },
        { name: 'Read Role', code: 'roles.read' },
        { name: 'Update Role', code: 'roles.update' },
        { name: 'Delete Role', code: 'roles.delete' },
        { name: 'Clone Role', code: 'roles.clone' },
        { name: 'Assign Permissions', code: 'roles.assign' },
      ],
    },
    {
      name: 'Departments',
      permissions: [
        { name: 'Create Department', code: 'departments.create' },
        { name: 'Read Department', code: 'departments.read' },
        { name: 'Update Department', code: 'departments.update' },
        { name: 'Delete Department', code: 'departments.delete' },
        { name: 'Change Department Status', code: 'departments.status' },
      ],
    },
    {
      name: 'Teams',
      permissions: [
        { name: 'Create Team', code: 'teams.create' },
        { name: 'Read Team', code: 'teams.read' },
        { name: 'Update Team', code: 'teams.update' },
        { name: 'Delete Team', code: 'teams.delete' },
        { name: 'Change Team Status', code: 'teams.status' },
        { name: 'Assign Team Members', code: 'teams.members' },
      ],
    },
    {
      name: 'Designations',
      permissions: [
        { name: 'Create Designation', code: 'designations.create' },
        { name: 'Read Designation', code: 'designations.read' },
        { name: 'Update Designation', code: 'designations.update' },
        { name: 'Delete Designation', code: 'designations.delete' },
        { name: 'Change Designation Status', code: 'designations.status' },
      ],
    },
  ];

  const allPermissionIds: string[] = [];

  for (const cat of categories) {
    const category = await prisma.permissionCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: {
        name: cat.name,
        description: `${cat.name} administration category`,
        groupId: group.id,
      },
    });

    for (const perm of cat.permissions) {
      const dbPerm = await prisma.permission.upsert({
        where: { code: perm.code },
        update: {},
        create: {
          name: perm.name,
          code: perm.code,
          categoryId: category.id,
        },
      });
      allPermissionIds.push(dbPerm.id);
    }
  }

  // Seeding Client Management Permissions
  console.log('Seeding Client Management Permissions...');
  const clientGroup = await prisma.permissionGroup.upsert({
    where: { name: 'Client Management' },
    update: {},
    create: {
      name: 'Client Management',
      description: 'Manages enterprise clients, contacts, addresses, contracts, and documents',
    },
  });

  const clientPermissionCategories = [
    {
      name: 'Clients',
      permissions: [
        { name: 'Create Client', code: 'clients.create' },
        { name: 'Read Client', code: 'clients.read' },
        { name: 'Update Client', code: 'clients.update' },
        { name: 'Delete Client', code: 'clients.delete' },
        { name: 'Restore Client', code: 'clients.restore' },
        { name: 'Archive Client', code: 'clients.archive' },
      ],
    },
    {
      name: 'Client Categories',
      permissions: [
        { name: 'Create Client Category', code: 'client-categories.create' },
        { name: 'Read Client Category', code: 'client-categories.read' },
        { name: 'Update Client Category', code: 'client-categories.update' },
        { name: 'Delete Client Category', code: 'client-categories.delete' },
      ],
    },
    {
      name: 'Client Contacts',
      permissions: [
        { name: 'Create Client Contact', code: 'client-contacts.create' },
        { name: 'Read Client Contact', code: 'client-contacts.read' },
        { name: 'Update Client Contact', code: 'client-contacts.update' },
        { name: 'Delete Client Contact', code: 'client-contacts.delete' },
      ],
    },
    {
      name: 'Client Addresses',
      permissions: [
        { name: 'Create Client Address', code: 'client-addresses.create' },
        { name: 'Read Client Address', code: 'client-addresses.read' },
        { name: 'Update Client Address', code: 'client-addresses.update' },
        { name: 'Delete Client Address', code: 'client-addresses.delete' },
      ],
    },
    {
      name: 'Client Documents',
      permissions: [
        { name: 'Create Client Document', code: 'client-documents.create' },
        { name: 'Read Client Document', code: 'client-documents.read' },
        { name: 'Update Client Document', code: 'client-documents.update' },
        { name: 'Delete Client Document', code: 'client-documents.delete' },
      ],
    },
    {
      name: 'Client Contracts',
      permissions: [
        { name: 'Create Client Contract', code: 'client-contracts.create' },
        { name: 'Read Client Contract', code: 'client-contracts.read' },
        { name: 'Update Client Contract', code: 'client-contracts.update' },
        { name: 'Delete Client Contract', code: 'client-contracts.delete' },
      ],
    },
    {
      name: 'Client Notes',
      permissions: [
        { name: 'Create Client Note', code: 'client-notes.create' },
        { name: 'Read Client Note', code: 'client-notes.read' },
        { name: 'Update Client Note', code: 'client-notes.update' },
        { name: 'Delete Client Note', code: 'client-notes.delete' },
      ],
    },
  ];

  for (const cat of clientPermissionCategories) {
    const category = await prisma.permissionCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: {
        name: cat.name,
        description: `${cat.name} administration category`,
        groupId: clientGroup.id,
      },
    });

    for (const perm of cat.permissions) {
      const dbPerm = await prisma.permission.upsert({
        where: { code: perm.code },
        update: {},
        create: {
          name: perm.name,
          code: perm.code,
          categoryId: category.id,
        },
      });
      allPermissionIds.push(dbPerm.id);
    }
  }

  // Seeding CRM Permissions
  console.log('Seeding CRM Permissions...');
  const crmGroup = await prisma.permissionGroup.upsert({
    where: { name: 'Customer Relationship Management (CRM)' },
    update: {},
    create: {
      name: 'Customer Relationship Management (CRM)',
      description: 'Manages leads, opportunities, proposals, and customer lifecycle conversions',
    },
  });

  const crmPermissionCategories = [
    {
      name: 'Leads',
      permissions: [
        { name: 'Create Lead', code: 'leads.create' },
        { name: 'Read Lead', code: 'leads.read' },
        { name: 'Update Lead', code: 'leads.update' },
        { name: 'Delete Lead', code: 'leads.delete' },
        { name: 'Restore Lead', code: 'leads.restore' },
        { name: 'Merge Leads', code: 'leads.merge' },
        { name: 'Assign Lead', code: 'leads.assign' },
      ],
    },
    {
      name: 'Opportunities',
      permissions: [
        { name: 'Create Opportunity', code: 'opportunities.create' },
        { name: 'Read Opportunity', code: 'opportunities.read' },
        { name: 'Update Opportunity', code: 'opportunities.update' },
        { name: 'Delete Opportunity', code: 'opportunities.delete' },
        { name: 'Restore Opportunity', code: 'opportunities.restore' },
        { name: 'Convert Lead', code: 'opportunities.convert' },
      ],
    },
    {
      name: 'Proposals',
      permissions: [
        { name: 'Create Proposal', code: 'proposals.create' },
        { name: 'Read Proposal', code: 'proposals.read' },
        { name: 'Update Proposal', code: 'proposals.update' },
        { name: 'Delete Proposal', code: 'proposals.delete' },
        { name: 'Approve Proposal', code: 'proposals.approve' },
        { name: 'Generate Proposal PDF', code: 'proposals.pdf' },
      ],
    },
    {
      name: 'Proposal Templates',
      permissions: [
        { name: 'Create Proposal Template', code: 'proposal-templates.create' },
        { name: 'Read Proposal Template', code: 'proposal-templates.read' },
        { name: 'Update Proposal Template', code: 'proposal-templates.update' },
        { name: 'Delete Proposal Template', code: 'proposal-templates.delete' },
      ],
    },
  ];

  for (const cat of crmPermissionCategories) {
    const category = await prisma.permissionCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: {
        name: cat.name,
        description: `${cat.name} administration category`,
        groupId: crmGroup.id,
      },
    });

    for (const perm of cat.permissions) {
      const dbPerm = await prisma.permission.upsert({
        where: { code: perm.code },
        update: {},
        create: {
          name: perm.name,
          code: perm.code,
          categoryId: category.id,
        },
      });
      allPermissionIds.push(dbPerm.id);
    }
  }

  // Seeding Project Permissions
  console.log('Seeding Project Permissions...');
  const projectGroup = await prisma.permissionGroup.upsert({
    where: { name: 'Project Management' },
    update: {},
    create: {
      name: 'Project Management',
      description: 'Manages projects, templates, phases, milestones, members, resources, risks, issues, and documents',
    },
  });

  const projectPermissionCategories = [
    {
      name: 'Projects',
      permissions: [
        { name: 'Create Project', code: 'projects.create' },
        { name: 'Read Project', code: 'projects.read' },
        { name: 'Update Project', code: 'projects.update' },
        { name: 'Delete Project', code: 'projects.delete' },
        { name: 'Restore Project', code: 'projects.restore' },
        { name: 'Permanent Delete Project', code: 'projects.permanent-delete' },
        { name: 'Clone Project', code: 'projects.clone' },
      ],
    },
    {
      name: 'Project Templates',
      permissions: [
        { name: 'Create Template', code: 'project-templates.create' },
        { name: 'Read Template', code: 'project-templates.read' },
        { name: 'Update Template', code: 'project-templates.update' },
        { name: 'Delete Template', code: 'project-templates.delete' },
      ],
    },
    {
      name: 'Project Categories',
      permissions: [
        { name: 'Create Category', code: 'project-categories.create' },
        { name: 'Read Category', code: 'project-categories.read' },
        { name: 'Update Category', code: 'project-categories.update' },
        { name: 'Delete Category', code: 'project-categories.delete' },
      ],
    },
    {
      name: 'Project Phases',
      permissions: [
        { name: 'Create Phase', code: 'project-phases.create' },
        { name: 'Read Phase', code: 'project-phases.read' },
        { name: 'Update Phase', code: 'project-phases.update' },
        { name: 'Delete Phase', code: 'project-phases.delete' },
      ],
    },
    {
      name: 'Project Milestones',
      permissions: [
        { name: 'Create Milestone', code: 'project-milestones.create' },
        { name: 'Read Milestone', code: 'project-milestones.read' },
        { name: 'Update Milestone', code: 'project-milestones.update' },
        { name: 'Delete Milestone', code: 'project-milestones.delete' },
      ],
    },
    {
      name: 'Project Members',
      permissions: [
        { name: 'Manage Members', code: 'project-members.manage' },
        { name: 'Read Members', code: 'project-members.read' },
      ],
    },
    {
      name: 'Project Resources',
      permissions: [
        { name: 'Manage Resources', code: 'project-resources.manage' },
        { name: 'Read Resources', code: 'project-resources.read' },
      ],
    },
    {
      name: 'Project Risks',
      permissions: [
        { name: 'Create Risk', code: 'project-risks.create' },
        { name: 'Read Risk', code: 'project-risks.read' },
        { name: 'Update Risk', code: 'project-risks.update' },
        { name: 'Delete Risk', code: 'project-risks.delete' },
      ],
    },
    {
      name: 'Project Issues',
      permissions: [
        { name: 'Create Issue', code: 'project-issues.create' },
        { name: 'Read Issue', code: 'project-issues.read' },
        { name: 'Update Issue', code: 'project-issues.update' },
        { name: 'Delete Issue', code: 'project-issues.delete' },
      ],
    },
    {
      name: 'Project Documents',
      permissions: [
        { name: 'Upload Document', code: 'project-documents.upload' },
        { name: 'Read Document', code: 'project-documents.read' },
        { name: 'Delete Document', code: 'project-documents.delete' },
      ],
    },
  ];

  for (const cat of projectPermissionCategories) {
    const category = await prisma.permissionCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: {
        name: cat.name,
        description: `${cat.name} administration category`,
        groupId: projectGroup.id,
      },
    });

    for (const perm of cat.permissions) {
      const dbPerm = await prisma.permission.upsert({
        where: { code: perm.code },
        update: {},
        create: {
          name: perm.name,
          code: perm.code,
          categoryId: category.id,
        },
      });
      allPermissionIds.push(dbPerm.id);
    }
  }

  // Seeding Task Permissions
  console.log('Seeding Task Permissions...');
  const taskGroup = await prisma.permissionGroup.upsert({
    where: { name: 'Task & Work Management' },
    update: {},
    create: {
      name: 'Task & Work Management',
      description: 'Manages sprints, tasks, checklists, comments, attachments, watchers, and dependencies',
    },
  });

  const taskPermissionCategories = [
    {
      name: 'Tasks',
      permissions: [
        { name: 'Create Task', code: 'tasks.create' },
        { name: 'Read Task', code: 'tasks.read' },
        { name: 'Update Task', code: 'tasks.update' },
        { name: 'Delete Task', code: 'tasks.delete' },
        { name: 'Restore Task', code: 'tasks.restore' },
        { name: 'Permanent Delete Task', code: 'tasks.permanent-delete' },
        { name: 'Clone Task', code: 'tasks.clone' },
      ],
    },
    {
      name: 'Sprints',
      permissions: [
        { name: 'Create Sprint', code: 'sprints.create' },
        { name: 'Read Sprint', code: 'sprints.read' },
        { name: 'Update Sprint', code: 'sprints.update' },
        { name: 'Delete Sprint', code: 'sprints.delete' },
      ],
    },
    {
      name: 'Task Configuration',
      permissions: [
        { name: 'Manage Configurations', code: 'task-configs.manage' },
        { name: 'Read Configurations', code: 'task-configs.read' },
      ],
    },
  ];

  for (const cat of taskPermissionCategories) {
    const category = await prisma.permissionCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: {
        name: cat.name,
        description: `${cat.name} administration category`,
        groupId: taskGroup.id,
      },
    });

    for (const perm of cat.permissions) {
      const dbPerm = await prisma.permission.upsert({
        where: { code: perm.code },
        update: {},
        create: {
          name: perm.name,
          code: perm.code,
          categoryId: category.id,
        },
      });
      allPermissionIds.push(dbPerm.id);
    }
  }

  // Seeding Time Tracking & Productivity Permissions
  console.log('Seeding Time Tracking Permissions...');
  const timeTrackingGroup = await prisma.permissionGroup.upsert({
    where: { name: 'Time Tracking & Productivity' },
    update: {},
    create: {
      name: 'Time Tracking & Productivity',
      description: 'Manages work sessions, timers, break logs, timesheets, approvals, activity scores, application website usage',
    },
  });

  const timeTrackingPermissionCategories = [
    {
      name: 'Time Tracking',
      permissions: [
        { name: 'Manage Timers & Sessions', code: 'timetracking.manage' },
        { name: 'Read Timers & Sessions', code: 'timetracking.read' },
      ],
    },
    {
      name: 'Timesheets',
      permissions: [
        { name: 'Submit Timesheet', code: 'timesheets.submit' },
        { name: 'Approve Timesheet', code: 'timesheets.approve' },
      ],
    },
  ];

  for (const cat of timeTrackingPermissionCategories) {
    const category = await prisma.permissionCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: {
        name: cat.name,
        description: `${cat.name} administration category`,
        groupId: timeTrackingGroup.id,
      },
    });

    for (const perm of cat.permissions) {
      const dbPerm = await prisma.permission.upsert({
        where: { code: perm.code },
        update: {},
        create: {
          name: perm.name,
          code: perm.code,
          categoryId: category.id,
        },
      });
      allPermissionIds.push(dbPerm.id);
    }
  }

  // Seeding Finance & Billing Permissions
  console.log('Seeding Finance Permissions...');
  const financeGroup = await prisma.permissionGroup.upsert({
    where: { name: 'Finance & Billing' },
    update: {},
    create: {
      name: 'Finance & Billing',
      description: 'Manages invoices, estimates, accounting journals, ledgers, expenses, and billable rates',
    },
  });

  const financePermissionCategories = [
    {
      name: 'Finance Settings',
      permissions: [
        { name: 'Manage Finance Settings', code: 'finance.manage' },
        { name: 'Read Finance Records', code: 'finance.read' },
        { name: 'Manage Billable Rates', code: 'billing.rates' },
        { name: 'Approve Employee Expenses', code: 'expenses.approve' },
      ],
    },
  ];

  for (const cat of financePermissionCategories) {
    const category = await prisma.permissionCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: {
        name: cat.name,
        description: `${cat.name} category`,
        groupId: financeGroup.id,
      },
    });

    for (const perm of cat.permissions) {
      const dbPerm = await prisma.permission.upsert({
        where: { code: perm.code },
        update: {},
        create: {
          name: perm.name,
          code: perm.code,
          categoryId: category.id,
        },
      });
      allPermissionIds.push(dbPerm.id);
    }
  }

  // Seeding HR & Workforce Management Permissions
  console.log('Seeding HR Permissions...');
  const hrGroup = await prisma.permissionGroup.upsert({
    where: { name: 'HR & Workforce Management' },
    update: {},
    create: {
      name: 'HR & Workforce Management',
      description: 'Manages employee lifecycle, attendance, shifts, leaves, performance, training, and assets',
    },
  });

  const hrPermissionCategories = [
    {
      name: 'HR Management',
      permissions: [
        { name: 'Manage HR Profiles', code: 'hr.manage' },
        { name: 'Read HR Records', code: 'hr.read' },
        { name: 'Manage Attendance Settings', code: 'attendance.manage' },
        { name: 'Read Attendance Records', code: 'attendance.read' },
        { name: 'Manage Leaves Settings', code: 'leave.manage' },
        { name: 'Approve Leave Requests', code: 'leave.approve' },
        { name: 'Manage Performance Appraisals', code: 'performance.manage' },
        { name: 'Manage Training Courses', code: 'training.manage' },
        { name: 'Manage Hardware Assets', code: 'assets.manage' },
      ],
    },
  ];

  for (const cat of hrPermissionCategories) {
    const category = await prisma.permissionCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: {
        name: cat.name,
        description: `${cat.name} category`,
        groupId: hrGroup.id,
      },
    });

    for (const perm of cat.permissions) {
      const dbPerm = await prisma.permission.upsert({
        where: { code: perm.code },
        update: {},
        create: {
          name: perm.name,
          code: perm.code,
          categoryId: category.id,
        },
      });
      allPermissionIds.push(dbPerm.id);
    }
  }

  // Seeding DevOps / Infrastructure Permissions
  console.log('Seeding DevOps / Infrastructure Permissions...');
  const devopsGroup = await prisma.permissionGroup.upsert({
    where: { name: 'Infrastructure & DevOps Management' },
    update: {},
    create: {
      name: 'Infrastructure & DevOps Management',
      description: 'Manages project infrastructure resources, hosting plans, servers, deployments, domain DNS, and monitoring checks',
    },
  });

  const devopsPermissionCategories = [
    {
      name: 'DevOps Settings',
      permissions: [
        { name: 'Manage Infrastructure Settings', code: 'infrastructure.manage' },
        { name: 'Read Infrastructure Records', code: 'infrastructure.read' },
        { name: 'Execute Deployments', code: 'deployments.manage' },
        { name: 'Manage Backup Roster', code: 'backups.manage' },
        { name: 'Read Uptime & System Monitoring', code: 'monitoring.read' },
        { name: 'Manage Domains & DNS', code: 'domains.manage' },
      ],
    },
  ];

  for (const cat of devopsPermissionCategories) {
    const category = await prisma.permissionCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: {
        name: cat.name,
        description: `${cat.name} category`,
        groupId: devopsGroup.id,
      },
    });

    for (const perm of cat.permissions) {
      const dbPerm = await prisma.permission.upsert({
        where: { code: perm.code },
        update: {},
        create: {
          name: perm.name,
          code: perm.code,
          categoryId: category.id,
        },
      });
      allPermissionIds.push(dbPerm.id);
    }
  }

  // Seeding Reports / Business Intelligence Permissions
  console.log('Seeding Reports / Business Intelligence Permissions...');
  const reportsGroup = await prisma.permissionGroup.upsert({
    where: { name: 'Reports & Business Intelligence' },
    update: {},
    create: {
      name: 'Reports & Business Intelligence',
      description: 'Manages dynamic reports definitions, widgets, dashboard sharing, custom templates, scheduled runs, and custom KPIs target scorecards',
    },
  });

  const reportsPermissionCategories = [
    {
      name: 'Analytics Settings',
      permissions: [
        { name: 'Configure Report Definitions', code: 'reports.manage' },
        { name: 'View Custom Reports', code: 'reports.read' },
        { name: 'Manage and Share Dashboards', code: 'dashboards.manage' },
        { name: 'View Executive KPIs scorecards', code: 'analytics.read' },
        { name: 'Extract Dynamic PDF/Excel exports', code: 'exports.manage' },
      ],
    },
  ];

  for (const cat of reportsPermissionCategories) {
    const category = await prisma.permissionCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: {
        name: cat.name,
        description: `${cat.name} category`,
        groupId: reportsGroup.id,
      },
    });

    for (const perm of cat.permissions) {
      const dbPerm = await prisma.permission.upsert({
        where: { code: perm.code },
        update: {},
        create: {
          name: perm.name,
          code: perm.code,
          categoryId: category.id,
        },
      });
      allPermissionIds.push(dbPerm.id);
    }
  }

  // Seeding Notifications & Workflow Permissions
  console.log('Seeding Notifications & Workflow Permissions...');
  const notifGroup = await prisma.permissionGroup.upsert({
    where: { name: 'Notifications & Workflow' },
    update: {},
    create: {
      name: 'Notifications & Workflow',
      description: 'Manages dynamic notifications preferences, template rendering, approval workflows, automated trigger rules, and reminders log',
    },
  });

  const notifPermissionCategories = [
    {
      name: 'Notification Settings',
      permissions: [
        { name: 'Configure Notifications Templates', code: 'notifications.manage' },
        { name: 'View System Notices and Announcements', code: 'notifications.read' },
        { name: 'Manage Approval Workflows', code: 'workflow.manage' },
        { name: 'View Active Workflow Approvals', code: 'workflow.read' },
        { name: 'Configure Automation Rules', code: 'automation.manage' },
        { name: 'View Rule Execution History', code: 'automation.read' },
        { name: 'Broadcast Group Announcements', code: 'announcements.manage' },
        { name: 'Manage Scheduler Reminders', code: 'reminders.manage' },
      ],
    },
  ];

  for (const cat of notifPermissionCategories) {
    const category = await prisma.permissionCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: {
        name: cat.name,
        description: `${cat.name} category`,
        groupId: notifGroup.id,
      },
    });

    for (const perm of cat.permissions) {
      const dbPerm = await prisma.permission.upsert({
        where: { code: perm.code },
        update: {},
        create: {
          name: perm.name,
          code: perm.code,
          categoryId: category.id,
        },
      });
      allPermissionIds.push(dbPerm.id);
    }
  }

  // Seeding SEO & Digital Marketing Permissions
  console.log('Seeding SEO & Digital Marketing Permissions...');
  const seoGroup = await prisma.permissionGroup.upsert({
    where: { name: 'SEO & Digital Marketing' },
    update: {},
    create: {
      name: 'SEO & Digital Marketing',
      description: 'Manages dynamic search engine optimization projects, content optimization, rank tracking, technical crawls and competitor analysis',
    },
  });

  const seoPermissionCategories = [
    {
      name: 'SEO & Marketing Settings',
      permissions: [
        { name: 'Manage SEO Project crawls', code: 'seo.manage' },
        { name: 'View SEO Performance Dashboards', code: 'seo.read' },
        { name: 'Manage Keyword Silos', code: 'keywords.manage' },
        { name: 'Track Search Engine Rankings', code: 'rankings.manage' },
        { name: 'Trigger Technical Crawler Audits', code: 'audits.manage' },
        { name: 'Log Referring Domain Backlinks', code: 'backlinks.manage' },
        { name: 'Generate executive SEO reports', code: 'reports.manage' },
      ],
    },
  ];

  for (const cat of seoPermissionCategories) {
    const category = await prisma.permissionCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: {
        name: cat.name,
        description: `${cat.name} category`,
        groupId: seoGroup.id,
      },
    });

    for (const perm of cat.permissions) {
      const dbPerm = await prisma.permission.upsert({
        where: { code: perm.code },
        update: {},
        create: {
          name: perm.name,
          code: perm.code,
          categoryId: category.id,
        },
      });
      allPermissionIds.push(dbPerm.id);
    }
  }

  // Seeding API Gateway & Integrations Permissions
  console.log('Seeding API Gateway & Integrations Permissions...');
  const apiGroup = await prisma.permissionGroup.upsert({
    where: { name: 'API Gateway & Integrations' },
    update: {},
    create: {
      name: 'API Gateway & Integrations',
      description: 'Manages API keys, OAuth applications, third-party integrations, rate limit thresholds and developer platform settings',
    },
  });

  const apiPermissionCategories = [
    {
      name: 'API Gateway Settings',
      permissions: [
        { name: 'Manage API gateway configurations', code: 'api.manage' },
        { name: 'View API analytics reports', code: 'api.read' },
        { name: 'Manage developer API Keys', code: 'apikeys.manage' },
        { name: 'Manage OAuth Applications', code: 'oauth.manage' },
        { name: 'Manage webhook registration targets', code: 'webhooks.manage' },
        { name: 'Manage third-party integrations credentials', code: 'integrations.manage' },
        { name: 'View API analytics metrics', code: 'analytics.manage' },
        { name: 'Manage developer portal applications', code: 'developer.manage' },
      ],
    },
  ];

  for (const cat of apiPermissionCategories) {
    const category = await prisma.permissionCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: {
        name: cat.name,
        description: `${cat.name} category`,
        groupId: apiGroup.id,
      },
    });

    for (const perm of cat.permissions) {
      const dbPerm = await prisma.permission.upsert({
        where: { code: perm.code },
        update: {},
        create: {
          name: perm.name,
          code: perm.code,
          categoryId: category.id,
        },
      });
      allPermissionIds.push(dbPerm.id);
    }
  }

  // Connect all permissions to Super Admin role
  await prisma.role.update({
    where: { id: superAdminRole.id },
    data: {
      permissions: {
        connect: allPermissionIds.map((id) => ({ id })),
      },
    },
  });

  // 3. Root Department
  console.log('Seeding Root Department...');
  const rootDept = await prisma.department.upsert({
    where: { code: 'CORP' },
    update: {},
    create: {
      name: 'Grehasoft Corporate',
      code: 'CORP',
      isRoot: true,
      displayOrder: 0,
      status: 'ACTIVE',
    },
  });

  // 4. Default Designations
  console.log('Seeding Designations...');
  const ceoDesig = await prisma.designation.upsert({
    where: { code: 'CEO' },
    update: {},
    create: {
      name: 'Chief Executive Officer',
      code: 'CEO',
      sortOrder: 0,
      status: 'ACTIVE',
      departmentId: rootDept.id,
    },
  });

  await prisma.designation.upsert({
    where: { code: 'PSA' },
    update: {},
    create: {
      name: 'Principal Solutions Architect',
      code: 'PSA',
      sortOrder: 1,
      status: 'ACTIVE',
      departmentId: rootDept.id,
    },
  });

  await prisma.designation.upsert({
    where: { code: 'SSE' },
    update: {},
    create: {
      name: 'Senior Software Engineer',
      code: 'SSE',
      sortOrder: 2,
      status: 'ACTIVE',
      departmentId: rootDept.id,
    },
  });

  // 5. Default Teams
  console.log('Seeding Teams...');
  const archTeam = await prisma.team.upsert({
    where: { code: 'ARCH' },
    update: {},
    create: {
      name: 'Architects Council',
      code: 'ARCH',
      description: 'Technical standards and architectural reviews',
      status: 'ACTIVE',
    },
  });

  await prisma.team.upsert({
    where: { code: 'ENG' },
    update: {},
    create: {
      name: 'Core Engineering Team',
      code: 'ENG',
      description: 'Core product implementation team',
      status: 'ACTIVE',
    },
  });

  // 6. Super Admin User (Idempotent Check)
  console.log('Seeding Super Admin User...');
  let superAdminUser = await prisma.user.findFirst({
    where: { email: 'superadmin@grehasoft.com' },
  });

  if (!superAdminUser) {
    superAdminUser = await prisma.user.create({
      data: {
        email: 'superadmin@grehasoft.com',
        firstName: 'Super',
        lastName: 'Admin',
        password: bcrypt.hashSync('SuperAdminPassword123', 10), // Cryptographically hashed password
        status: 'ACTIVE',
        roleId: superAdminRole.id,
        departmentId: rootDept.id,
        designationId: ceoDesig.id,
        companyId: '00000000-0000-0000-0000-000000000000',
        preferences: {
          create: {
            theme: 'dark',
            language: 'en',
            timezone: 'Asia/Kolkata',
            notificationsEnabled: true,
          },
        },
      },
    });
  } else {
    // Ensure existing user has hashed password
    await prisma.user.update({
      where: { id: superAdminUser.id },
      data: {
        password: bcrypt.hashSync('SuperAdminPassword123', 10),
      },
    });
  }

  // Update relations
  await prisma.department.update({
    where: { id: rootDept.id },
    data: { managerId: superAdminUser.id },
  });

  await prisma.team.update({
    where: { id: archTeam.id },
    data: { leadId: superAdminUser.id },
  });

  // Seeding CRM Pipelines and Stages
  console.log('Seeding CRM Pipelines and Stages...');
  const salesPipeline = await prisma.pipeline.upsert({
    where: { id: 'default-sales-pipeline-id' },
    update: {},
    create: {
      id: 'default-sales-pipeline-id',
      name: 'Sales Pipeline',
      description: 'Standard sales opportunities pipeline',
    },
  });

  const stagesData = [
    { id: 'stage-new-prospect', name: 'New Prospect', code: 'NEW_PROSPECT', sortOrder: 1 },
    { id: 'stage-contacted', name: 'Contacted / Warm', code: 'CONTACTED', sortOrder: 2 },
    { id: 'stage-proposal-sent', name: 'Proposal Sent', code: 'PROPOSAL_SENT', sortOrder: 3 },
    { id: 'stage-negotiation', name: 'Negotiation', code: 'NEGOTIATION', sortOrder: 4 },
    { id: 'stage-closed-won', name: 'Closed Won', code: 'CLOSED_WON', sortOrder: 5 },
    { id: 'stage-closed-lost', name: 'Closed Lost', code: 'CLOSED_LOST', sortOrder: 6 },
  ];

  for (const stg of stagesData) {
    await prisma.pipelineStage.upsert({
      where: { id: stg.id },
      update: {},
      create: {
        id: stg.id,
        pipelineId: salesPipeline.id,
        name: stg.name,
        code: stg.code,
        sortOrder: stg.sortOrder,
      },
    });
  }

  // Seeding Client Categories
  console.log('Seeding Client Categories...');
  const clientCategories = [
    { name: 'Corporate', code: 'CORPORATE', description: 'Corporate clients and private limited companies', isSystem: true },
    { name: 'Government', code: 'GOVERNMENT', description: 'Government departments and public sector undertakings', isSystem: true },
    { name: 'Educational', code: 'EDUCATIONAL', description: 'Schools, colleges, universities and educational organizations', isSystem: true },
    { name: 'Healthcare', code: 'HEALTHCARE', description: 'Hospitals, clinics, and healthcare providers', isSystem: true },
    { name: 'NGO', code: 'NGO', description: 'Non-governmental and non-profit organizations', isSystem: true },
    { name: 'Startup', code: 'STARTUP', description: 'Early stage startups and venture-backed companies', isSystem: true },
    { name: 'SME', code: 'SME', description: 'Small and medium-sized enterprises', isSystem: true },
    { name: 'Enterprise', code: 'ENTERPRISE', description: 'Large-scale multinational enterprises', isSystem: true },
  ];

  for (const cat of clientCategories) {
    await prisma.clientCategory.upsert({
      where: { code: cat.code },
      update: {},
      create: {
        name: cat.name,
        code: cat.code,
        description: cat.description,
        isSystem: cat.isSystem,
      },
    });
  }

  // Seeding Lead Sources
  console.log('Seeding Lead Sources...');
  const leadSources = [
    { name: 'Website', code: 'WEBSITE', description: 'Leads from official website contact form', isSystem: true },
    { name: 'Google Ads', code: 'GOOGLE_ADS', description: 'Leads from Google Search & Display advertising campaigns', isSystem: true },
    { name: 'Meta Ads', code: 'META_ADS', description: 'Leads from Meta (Facebook/Instagram) advertising', isSystem: true },
    { name: 'Referral', code: 'REFERRAL', description: 'Leads from partner or existing customer referrals', isSystem: true },
    { name: 'Cold Call', code: 'COLD_CALL', description: 'Leads from cold calling campaigns', isSystem: true },
    { name: 'Walk-in', code: 'WALK_IN', description: 'In-person walk-in leads', isSystem: true },
    { name: 'Email Campaign', code: 'EMAIL_CAMPAIGN', description: 'Leads from outbound email campaigns', isSystem: true },
    { name: 'WhatsApp', code: 'WHATSAPP', description: 'Leads initiating via official WhatsApp Business channel', isSystem: true },
    { name: 'LinkedIn', code: 'LINKEDIN', description: 'Leads from LinkedIn outreach and campaigns', isSystem: true },
    { name: 'Trade Show', code: 'TRADE_SHOW', description: 'Leads collected at conferences and events', isSystem: true },
    { name: 'Other', code: 'OTHER', description: 'Miscellaneous other lead sources', isSystem: true },
  ];

  for (const src of leadSources) {
    await prisma.leadSource.upsert({
      where: { code: src.code },
      update: {},
      create: src,
    });
  }

  // Seeding Lead Statuses
  console.log('Seeding Lead Statuses...');
  const leadStatuses = [
    { name: 'New', code: 'NEW', description: 'Newly acquired lead, not yet contacted', isSystem: true },
    { name: 'Contacted', code: 'CONTACTED', description: 'Outreach initiated or first response received', isSystem: true },
    { name: 'Qualified', code: 'QUALIFIED', description: 'Lead meets qualifications and is ready for opportunity creation', isSystem: true },
    { name: 'Proposal Sent', code: 'PROPOSAL_SENT', description: 'Proposal document has been generated and shared', isSystem: true },
    { name: 'Negotiation', code: 'NEGOTIATION', description: 'Pricing or terms are currently being negotiated', isSystem: true },
    { name: 'Won', code: 'WON', description: 'Lead successfully closed and converted', isSystem: true },
    { name: 'Lost', code: 'LOST', description: 'Lead marked as lost/unresponsive', isSystem: true },
    { name: 'Hold', code: 'HOLD', description: 'Deal temporarily on hold', isSystem: true },
  ];

  for (const st of leadStatuses) {
    await prisma.leadStatus.upsert({
      where: { code: st.code },
      update: {},
      create: st,
    });
  }

  // Seeding Pipelines & Stages
  console.log('Seeding Default Pipeline & Stages...');
  const defaultPipeline = await prisma.pipeline.upsert({
    where: { name: 'Default Sales Pipeline' },
    update: {},
    create: {
      name: 'Default Sales Pipeline',
      description: 'Standard enterprise sales lifecycle',
    },
  });

  const pipelineStages = [
    { name: 'Qualification', code: 'QUALIFICATION', probability: 10, sortOrder: 1 },
    { name: 'Discovery', code: 'DISCOVERY', probability: 30, sortOrder: 2 },
    { name: 'Proposal', code: 'PROPOSAL', probability: 50, sortOrder: 3 },
    { name: 'Negotiation', code: 'NEGOTIATION', probability: 70, sortOrder: 4 },
    { name: 'Closed Won', code: 'CLOSED_WON', probability: 100, sortOrder: 5 },
    { name: 'Closed Lost', code: 'CLOSED_LOST', probability: 0, sortOrder: 6 },
  ];

  for (const stg of pipelineStages) {
    await prisma.pipelineStage.upsert({
      where: {
        pipelineId_code: {
          pipelineId: defaultPipeline.id,
          code: stg.code,
        },
      },
      update: {},
      create: {
        pipelineId: defaultPipeline.id,
        name: stg.name,
        code: stg.code,
        probability: stg.probability,
        sortOrder: stg.sortOrder,
      },
    });
  }

  // Seeding Proposal Templates
  console.log('Seeding Proposal Templates...');
  await prisma.proposalTemplate.upsert({
    where: { name: 'Standard Service Proposal' },
    update: {},
    create: {
      name: 'Standard Service Proposal',
      subject: 'Proposal for Enterprise Software & Services',
      content: 'We are pleased to submit this proposal. We look forward to partnering with you.',
    },
  });

  // Seeding Project Categories
  console.log('Seeding Project Categories...');
  const projectCategories = [
    { name: 'Software', code: 'SOFTWARE', description: 'Software engineering and development' },
    { name: 'Marketing', code: 'MARKETING', description: 'Marketing and advertising campaigns' },
    { name: 'SEO', code: 'SEO', description: 'Search engine optimization' },
    { name: 'Infrastructure', code: 'INFRASTRUCTURE', description: 'Server and hardware setups' },
    { name: 'Consulting', code: 'CONSULTING', description: 'Consulting and advisory services' },
    { name: 'Maintenance', code: 'MAINTENANCE', description: 'System support and maintenance' },
    { name: 'Training', code: 'TRAINING', description: 'Staff training and onboarding' },
  ];

  for (const cat of projectCategories) {
    await prisma.projectCategory.upsert({
      where: { code: cat.code },
      update: {},
      create: cat,
    });
  }

  // Seeding Project Templates
  console.log('Seeding Project Templates...');
  await prisma.projectTemplate.upsert({
    where: { name: 'Standard Software Development Template' },
    update: {},
    create: {
      name: 'Standard Software Development Template',
      description: 'Default software engineering template with milestones and phases',
      type: 'FIXED_PRICE',
      estimatedHours: 320,
      estimatedTimelineDays: 90,
      config: {
        phases: [
          { name: 'Requirement Gathering', code: 'REQ_GATHERING', sortOrder: 1 },
          { name: 'Design & Architecture', code: 'DESIGN', sortOrder: 2 },
          { name: 'Implementation', code: 'DEV', sortOrder: 3 },
          { name: 'Testing & QA', code: 'QA', sortOrder: 4 },
          { name: 'Deployment', code: 'DEPLOYMENT', sortOrder: 5 },
        ],
        milestones: [
          { title: 'BRD Signoff', description: 'Business requirements finalized', estimatedHours: 40, timelineOffsetDays: 15 },
          { title: 'Architecture Approved', description: 'Design signoff', estimatedHours: 40, timelineOffsetDays: 30 },
          { title: 'Alpha Release', description: 'Development complete', estimatedHours: 160, timelineOffsetDays: 65 },
          { title: 'UAT Signoff', description: 'QA testing signoff', estimatedHours: 60, timelineOffsetDays: 80 },
          { title: 'Production Go-Live', description: 'Deployment complete', estimatedHours: 20, timelineOffsetDays: 90 },
        ],
      },
    },
  });

  // Seeding Task Types
  console.log('Seeding Task Types...');
  const taskTypes = [
    { name: 'Story', code: 'STORY', icon: 'book', color: '#3B82F6' },
    { name: 'Task', code: 'TASK', icon: 'check-square', color: '#6B7280' },
    { name: 'Bug', code: 'BUG', icon: 'bug', color: '#EF4444' },
    { name: 'Epic', code: 'EPIC', icon: 'zap', color: '#8B5CF6' },
    { name: 'Feature', code: 'FEATURE', icon: 'star', color: '#10B981' },
    { name: 'Improvement', code: 'IMPROVEMENT', icon: 'trending-up', color: '#F59E0B' },
    { name: 'Research', code: 'RESEARCH', icon: 'search', color: '#6366F1' },
    { name: 'Spike', code: 'SPIKE', icon: 'activity', color: '#EC4899' },
    { name: 'Documentation', code: 'DOCUMENTATION', icon: 'file-text', color: '#14B8A6' },
    { name: 'Hotfix', code: 'HOTFIX', icon: 'flame', color: '#F97316' },
  ];
  for (const type of taskTypes) {
    await prisma.taskType.upsert({
      where: { code: type.code },
      update: {},
      create: type,
    });
  }

  // Seeding Task Statuses
  console.log('Seeding Task Statuses...');
  const taskStatuses = [
    { name: 'To Do', code: 'TODO', color: '#6B7280', sortOrder: 1 },
    { name: 'In Progress', code: 'IN_PROGRESS', color: '#3B82F6', sortOrder: 2 },
    { name: 'In Review', code: 'IN_REVIEW', color: '#F59E0B', sortOrder: 3 },
    { name: 'Done', code: 'DONE', color: '#10B981', sortOrder: 4 },
    { name: 'Blocked', code: 'BLOCKED', color: '#EF4444', sortOrder: 5 },
  ];
  for (const status of taskStatuses) {
    await prisma.taskStatus.upsert({
      where: { code: status.code },
      update: {},
      create: status,
    });
  }

  // Seeding Task Priorities
  console.log('Seeding Task Priorities...');
  const taskPriorities = [
    { name: 'Low', code: 'LOW', color: '#10B981', sortOrder: 1 },
    { name: 'Medium', code: 'MEDIUM', color: '#F59E0B', sortOrder: 2 },
    { name: 'High', code: 'HIGH', color: '#EF4444', sortOrder: 3 },
    { name: 'Critical', code: 'CRITICAL', color: '#7F1D1D', sortOrder: 4 },
  ];
  for (const priority of taskPriorities) {
    await prisma.taskPriority.upsert({
      where: { code: priority.code },
      update: {},
      create: priority,
    });
  }

  // Seeding Default Currencies
  console.log('Seeding Currencies...');
  const currencies = [
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', exchangeRate: 1.0, isBase: true, conversionDate: new Date() },
    { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 83.5, isBase: false, conversionDate: new Date() },
    { code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 90.0, isBase: false, conversionDate: new Date() },
  ];
  for (const c of currencies) {
    await prisma.currency.upsert({
      where: { code: c.code },
      update: { exchangeRate: c.exchangeRate, isBase: c.isBase, conversionDate: c.conversionDate },
      create: c,
    });
  }

  // Seeding Default Taxes
  console.log('Seeding Taxes...');
  const taxes = [
    { name: 'CGST', rate: 9.0, type: 'CGST', code: 'CGST_9', isDefault: false },
    { name: 'SGST', rate: 9.0, type: 'SGST', code: 'SGST_9', isDefault: false },
    { name: 'IGST', rate: 18.0, type: 'IGST', code: 'IGST_18', isDefault: false },
    { name: 'VAT 5%', rate: 5.0, type: 'VAT', code: 'VAT_5', isDefault: false },
  ];
  for (const t of taxes) {
    await prisma.tax.upsert({
      where: { code: t.code },
      update: { rate: t.rate, type: t.type as any },
      create: { ...t, type: t.type as any },
    });
  }

  // Seeding Payment Methods
  console.log('Seeding Payment Methods...');
  const paymentMethods = [
    { name: 'Cash', code: 'CASH', isSystem: true },
    { name: 'Bank Transfer', code: 'BANK_TRANSFER', isSystem: true },
    { name: 'UPI', code: 'UPI', isSystem: true },
    { name: 'Card', code: 'CARD', isSystem: true },
    { name: 'Stripe', code: 'STRIPE', isSystem: true },
    { name: 'Razorpay', code: 'RAZORPAY', isSystem: true },
    { name: 'Manual', code: 'MANUAL', isSystem: true },
  ];
  for (const pm of paymentMethods) {
    await prisma.paymentMethod.upsert({
      where: { code: pm.code },
      update: {},
      create: pm,
    });
  }

  // Seeding Accounting Ledger Accounts
  console.log('Seeding Ledger Accounts...');
  const ledgerAccounts = [
    { name: 'Cash Account', code: '1010', type: 'ASSET', balance: 0.00 },
    { name: 'Bank Account', code: '1020', type: 'ASSET', balance: 0.00 },
    { name: 'Accounts Receivable', code: '1200', type: 'ASSET', balance: 0.00 },
    { name: 'Accounts Payable', code: '2100', type: 'LIABILITY', balance: 0.00 },
    { name: 'Revenue', code: '4000', type: 'REVENUE', balance: 0.00 },
    { name: 'Operating Expense', code: '5000', type: 'EXPENSE', balance: 0.00 },
  ];
  for (const la of ledgerAccounts) {
    await prisma.ledgerAccount.upsert({
      where: { code: la.code },
      update: {},
      create: la,
    });
  }

  // Expense Categories
  console.log('Seeding Expense Categories...');
  const expenseCategories = [
    { name: 'Travel & Lodging', code: 'TRAVEL' },
    { name: 'Software Licenses', code: 'SOFTWARE' },
    { name: 'Office Supplies', code: 'OFFICE' },
    { name: 'Consulting Fees', code: 'CONSULTING' },
    { name: 'Marketing', code: 'MARKETING' },
  ];
  for (const c of expenseCategories) {
    await prisma.expenseCategory.upsert({
      where: { code: c.code },
      update: {},
      create: c,
    });
  }

  // Seeding Leave Types
  console.log('Seeding Leave Types...');
  const leaveTypes = [
    { name: 'Casual Leave', code: 'CASUAL', daysAllowed: 12.0, allowHalfDay: true, allowHourly: true, carryForward: true, allowEncashment: false, allowNegative: true },
    { name: 'Sick Leave', code: 'SICK', daysAllowed: 10.0, allowHalfDay: true, allowHourly: true, carryForward: false, allowEncashment: false, allowNegative: false },
    { name: 'Earned Leave', code: 'EARNED', daysAllowed: 15.0, allowHalfDay: false, allowHourly: false, carryForward: true, allowEncashment: true, allowNegative: false },
    { name: 'Maternity Leave', code: 'MATERNITY', daysAllowed: 90.0, allowHalfDay: false, allowHourly: false, carryForward: false, allowEncashment: false, allowNegative: false },
    { name: 'Paternity Leave', code: 'PATERNITY', daysAllowed: 15.0, allowHalfDay: false, allowHourly: false, carryForward: false, allowEncashment: false, allowNegative: false },
    { name: 'Comp Off', code: 'COMP_OFF', daysAllowed: 0.0, allowHalfDay: true, allowHourly: true, carryForward: false, allowEncashment: false, allowNegative: false },
    { name: 'Loss of Pay', code: 'LOSS_OF_PAY', daysAllowed: 365.0, allowHalfDay: true, allowHourly: true, carryForward: false, allowEncashment: false, allowNegative: true },
  ];
  for (const lt of leaveTypes) {
    await prisma.leaveType.upsert({
      where: { code: lt.code as any },
      update: {
        name: lt.name,
        daysAllowed: lt.daysAllowed,
        allowHalfDay: lt.allowHalfDay,
        allowHourly: lt.allowHourly,
        carryForward: lt.carryForward,
        allowEncashment: lt.allowEncashment,
        allowNegative: lt.allowNegative,
      },
      create: lt as any,
    });
  }

  // Seeding Default Shifts
  console.log('Seeding Shifts...');
  const shifts = [
    { name: 'General Shift', type: 'GENERAL', startTime: '09:00', endTime: '18:00', gracePeriod: 15, nightShiftAllowance: 0.00 },
    { name: 'Morning Shift', type: 'MORNING', startTime: '06:00', endTime: '14:00', gracePeriod: 10, nightShiftAllowance: 0.00 },
    { name: 'Evening Shift', type: 'EVENING', startTime: '14:00', endTime: '22:00', gracePeriod: 10, nightShiftAllowance: 100.00 },
    { name: 'Night Shift', type: 'NIGHT', startTime: '22:00', endTime: '06:00', gracePeriod: 15, nightShiftAllowance: 250.00 },
  ];
  for (const s of shifts) {
    await prisma.shift.create({
      data: s as any,
    });
  }

  // Seeding Default Holidays
  console.log('Seeding Holidays...');
  const holidays = [
    { name: 'Republic Day', date: new Date('2026-01-26'), type: 'NATIONAL' },
    { name: 'Independence Day', date: new Date('2026-08-15'), type: 'NATIONAL' },
    { name: 'Gandhi Jayanti', date: new Date('2026-10-02'), type: 'NATIONAL' },
    { name: 'Christmas Day', date: new Date('2026-12-25'), type: 'COMPANY' },
  ];
  for (const h of holidays) {
    await prisma.holiday.upsert({
      where: { date: h.date },
      update: { name: h.name, type: h.type },
      create: h,
    });
  }

  // Seeding Training Courses
  console.log('Seeding Training Courses...');
  const courses = [
    { title: 'Security Awareness Training', description: 'Mandatory information security and privacy compliance training', durationHours: 2, isMandatory: true, isExternal: false },
    { title: 'Project Management Professional (PMP)', description: 'Optional project leadership certificate course', durationHours: 40, isMandatory: false, isExternal: true },
    { title: 'Advanced NestJS Development', description: 'Internal corporate backend engineering workshop', durationHours: 12, isMandatory: false, isExternal: false },
  ];
  for (const course of courses) {
    const existing = await prisma.trainingCourse.findFirst({ where: { title: course.title } });
    if (!existing) {
      await prisma.trainingCourse.create({ data: course });
    }
  }

  // Seeding Infrastructure Providers
  console.log('Seeding Infrastructure Providers...');
  const providers = [
    { name: 'Hostinger', code: 'HOSTINGER', apiEndpoint: 'https://api.hostinger.com' },
    { name: 'Amazon Web Services', code: 'AWS', apiEndpoint: 'https://api.aws.amazon.com' },
    { name: 'Google Cloud Platform', code: 'GCP', apiEndpoint: 'https://api.googlecloud.com' },
    { name: 'Microsoft Azure', code: 'AZURE', apiEndpoint: 'https://api.azure.com' },
    { name: 'DigitalOcean', code: 'DIGITALOCEAN', apiEndpoint: 'https://api.digitalocean.com/v2' },
    { name: 'Cloudflare', code: 'CLOUDFLARE', apiEndpoint: 'https://api.cloudflare.com/client/v4' },
    { name: 'GoDaddy', code: 'GODADDY', apiEndpoint: 'https://api.godaddy.com/v1' },
    { name: 'Namecheap', code: 'NAMECHEAP', apiEndpoint: 'https://api.namecheap.com' },
    { name: 'GitHub', code: 'GITHUB', apiEndpoint: 'https://api.github.com' },
    { name: 'GitLab', code: 'GITLAB', apiEndpoint: 'https://gitlab.com/api/v4' },
    { name: 'Bitbucket', code: 'BITBUCKET', apiEndpoint: 'https://api.bitbucket.org/2.0' },
    { name: 'Vercel', code: 'VERCEL', apiEndpoint: 'https://api.vercel.com' },
    { name: 'Netlify', code: 'NETLIFY', apiEndpoint: 'https://api.netlify.com/api/v1' },
    { name: 'Railway', code: 'RAILWAY', apiEndpoint: 'https://backboard.railway.app/graphql' },
    { name: 'Render', code: 'RENDER', apiEndpoint: 'https://api.render.com/v1' },
  ];
  for (const p of providers) {
    await prisma.infrastructureProvider.upsert({
      where: { code: p.code },
      update: { name: p.name, apiEndpoint: p.apiEndpoint },
      create: { name: p.name, code: p.code, apiEndpoint: p.apiEndpoint },
    });
  }

  // Seeding Widgets Library
  console.log('Seeding Widgets Library...');
  const defaultTenantId = '00000000-0000-0000-0000-000000000000';
  const widgetsData = [
    { name: 'KPI Summary Card', code: 'WIDGET_KPI_CARD', type: 'KPI_CARD', configJson: JSON.stringify({ display: 'card', color: '#4f46e5' }) },
    { name: 'Data Grid Table', code: 'WIDGET_TABLE', type: 'TABLE', configJson: JSON.stringify({ display: 'table', pageSize: 10 }) },
    { name: 'Performance Line Chart', code: 'WIDGET_LINE_CHART', type: 'LINE_CHART', configJson: JSON.stringify({ display: 'line', smooth: true }) },
    { name: 'Distribution Bar Chart', code: 'WIDGET_BAR_CHART', type: 'BAR_CHART', configJson: JSON.stringify({ display: 'bar', horizontal: false }) },
    { name: 'Cumulative Area Chart', code: 'WIDGET_AREA_CHART', type: 'AREA_CHART', configJson: JSON.stringify({ display: 'area' }) },
    { name: 'Proportion Pie Chart', code: 'WIDGET_PIE_CHART', type: 'PIE_CHART', configJson: JSON.stringify({ display: 'pie' }) },
    { name: 'Segments Donut Chart', code: 'WIDGET_DONUT_CHART', type: 'DONUT_CHART', configJson: JSON.stringify({ display: 'donut' }) },
    { name: 'Pipeline Funnel Chart', code: 'WIDGET_FUNNEL', type: 'FUNNEL', configJson: JSON.stringify({ display: 'funnel' }) },
    { name: 'Radial Speedometer Gauge', code: 'WIDGET_GAUGE', type: 'GAUGE', configJson: JSON.stringify({ display: 'gauge', min: 0, max: 100 }) },
    { name: 'Event Calendar Schedule', code: 'WIDGET_CALENDAR', type: 'CALENDAR', configJson: JSON.stringify({ display: 'calendar' }) },
    { name: 'Density Heatmap Matrix', code: 'WIDGET_HEATMAP', type: 'HEATMAP', configJson: JSON.stringify({ display: 'heatmap' }) },
    { name: 'Performance Progress Bar', code: 'WIDGET_PROGRESS_BAR', type: 'PROGRESS_BAR', configJson: JSON.stringify({ display: 'progress' }) },
    { name: 'Auditing Timeline Log', code: 'WIDGET_TIMELINE', type: 'TIMELINE', configJson: JSON.stringify({ display: 'timeline' }) },
  ];

  const dbWidgets: any = {};
  for (const w of widgetsData) {
    const dbW = await prisma.widget.upsert({
      where: { code: w.code },
      update: { name: w.name, type: w.type as any, configJson: w.configJson },
      create: { tenantId: defaultTenantId, name: w.name, code: w.code, type: w.type as any, configJson: w.configJson },
    });
    dbWidgets[w.code] = dbW;
  }

  // Seeding Dashboard Templates
  console.log('Seeding Dashboard Templates...');
  const templatesData = [
    { name: 'Executive Suite Template', code: 'TEMPLATE_EXECUTIVE', description: 'Cross-module executive board summary containing financial cashflow, CRM pipeline, and infrastructure health panels', layoutJson: JSON.stringify([{ widgetCode: 'WIDGET_KPI_CARD', title: 'Revenue summary', x: 0, y: 0, w: 4, h: 3 }]) },
    { name: 'CRM Pipeline Template', code: 'TEMPLATE_CRM', description: 'Deals conversion speed and opportunities funnel tracker', layoutJson: JSON.stringify([{ widgetCode: 'WIDGET_FUNNEL', title: 'Sales Funnel', x: 0, y: 0, w: 6, h: 4 }]) },
    { name: 'Corporate Finance Template', code: 'TEMPLATE_FINANCE', description: 'Outstanding invoices, monthly gross billing margins, cashflows balances', layoutJson: JSON.stringify([{ widgetCode: 'WIDGET_LINE_CHART', title: 'Monthly Revenue vs Expenses', x: 0, y: 0, w: 8, h: 4 }]) },
    { name: 'Workforce Appraisals Template', code: 'TEMPLATE_HR', description: 'Attendance logs, employee turnover, pending leaves, training certificates reminders', layoutJson: JSON.stringify([{ widgetCode: 'WIDGET_BAR_CHART', title: 'Leaves summary by department', x: 0, y: 0, w: 6, h: 4 }]) },
    { name: 'Projects Performance Template', code: 'TEMPLATE_PROJECT', description: 'Projects delivery timelines, resource capacity charts, burndown/velocity stats', layoutJson: JSON.stringify([{ widgetCode: 'WIDGET_AREA_CHART', title: 'Velocity trends', x: 0, y: 0, w: 6, h: 4 }]) },
    { name: 'DevOps Infrastructure Template', code: 'TEMPLATE_DEVOPS', description: 'Server CPU/RAM alerts, backup histories, deployments speed and failure logs', layoutJson: JSON.stringify([{ widgetCode: 'WIDGET_GAUGE', title: 'Average server uptime', x: 0, y: 0, w: 4, h: 3 }]) },
    { name: 'Productivity Logs Template', code: 'TEMPLATE_PRODUCTIVITY', description: 'Active timers details, non-billable vs billable hours, context switches and idle times logs', layoutJson: JSON.stringify([{ widgetCode: 'WIDGET_TIMELINE', title: 'Recent logs activities', x: 0, y: 0, w: 8, h: 4 }]) },
  ];

  const dbTemplates: any = {};
  for (const t of templatesData) {
    const dbT = await prisma.dashboardTemplate.upsert({
      where: { code: t.code },
      update: { name: t.name, description: t.description, layoutJson: t.layoutJson },
      create: { name: t.name, code: t.code, description: t.description, layoutJson: t.layoutJson },
    });
    dbTemplates[t.code] = dbT;
  }

  // Seeding KPI Definitions
  console.log('Seeding KPI Definitions...');
  const kpisData = [
    { name: 'Gross Revenue Growth', code: 'REV_GROWTH', description: 'Monthly revenue growth rate', formula: '((REVENUE - REVENUE_PREV) / REVENUE_PREV) * 100', targetValue: 15.00, warningThreshold: 5.00, criticalThreshold: 0.00, trendDirection: 'HIGHER_IS_BETTER' },
    { name: 'Sales Pipeline Win Rate', code: 'SALES_WIN_RATE', description: 'CRM closed won opportunities percentage', formula: '(WON_OPPS / TOTAL_OPPS) * 100', targetValue: 35.00, warningThreshold: 20.00, criticalThreshold: 10.00, trendDirection: 'HIGHER_IS_BETTER' },
    { name: 'Employee Utilization Rate', code: 'EMP_UTILIZATION', description: 'Billable hours vs total capacity percentage', formula: '(BILLABLE_HOURS / TOTAL_CAPACITY_HOURS) * 100', targetValue: 80.00, warningThreshold: 70.00, criticalThreshold: 50.00, trendDirection: 'HIGHER_IS_BETTER' },
    { name: 'Uptime Server Availability', code: 'SERVER_AVAILABILITY', description: 'Average server uptime check logs', formula: '(UPTIME_HOURS / TOTAL_HOURS) * 100', targetValue: 99.95, warningThreshold: 99.90, criticalThreshold: 99.00, trendDirection: 'HIGHER_IS_BETTER' },
    { name: 'Deployment Success Rate', code: 'DEPLOY_SUCCESS_RATE', description: 'Successful deployments percentage', formula: '(SUCCESS_DEPLOYS / TOTAL_DEPLOYS) * 100', targetValue: 98.00, warningThreshold: 90.00, criticalThreshold: 80.00, trendDirection: 'HIGHER_IS_BETTER' },
    { name: 'Mean Time To Resolution (MTTR)', code: 'MTTR', description: 'Average incident resolution speed in minutes', formula: 'TOTAL_RESOLUTION_MINUTES / INCIDENTS_COUNT', targetValue: 30.00, warningThreshold: 60.00, criticalThreshold: 120.00, trendDirection: 'LOWER_IS_BETTER' },
    { name: 'Invoice Collection Days', code: 'INV_COLLECTION_DAYS', description: 'Average days outstanding to collect payment', formula: 'TOTAL_PAYMENT_DAYS / INVOICES_COUNT', targetValue: 15.00, warningThreshold: 30.00, criticalThreshold: 45.00, trendDirection: 'LOWER_IS_BETTER' },
    { name: 'Employee Annual Turnover', code: 'EMP_TURNOVER', description: 'Workforce attrition percentage rate', formula: '(DEPARTED_COUNT / AVERAGE_HEADCOUNT) * 100', targetValue: 10.00, warningThreshold: 15.00, criticalThreshold: 25.00, trendDirection: 'LOWER_IS_BETTER' },
  ];

  for (const k of kpisData) {
    await prisma.kpiDefinition.upsert({
      where: { code: k.code },
      update: { name: k.name, description: k.description, formula: k.formula, targetValue: k.targetValue, warningThreshold: k.warningThreshold, criticalThreshold: k.criticalThreshold, trendDirection: k.trendDirection as any },
      create: { tenantId: defaultTenantId, name: k.name, code: k.code, description: k.description, formula: k.formula, targetValue: k.targetValue, warningThreshold: k.warningThreshold, criticalThreshold: k.criticalThreshold, trendDirection: k.trendDirection as any },
    });
  }

  // Seed Default Executive Dashboard
  console.log('Seeding Default Executive Dashboard...');
  const superUser = await prisma.user.findFirst({
    where: { email: 'superadmin@grehasoft.com' },
  });

  if (superUser) {
    const dashboardCode = 'DASHBOARD_EXECUTIVE_DEFAULT';
    let execDashboard = await prisma.dashboard.findFirst({
      where: {
        name: 'Executive Dashboard Boardroom',
        ownerId: superUser.id,
      },
    });

    if (!execDashboard) {
      execDashboard = await prisma.dashboard.create({
        data: {
          tenantId: defaultTenantId,
          templateId: dbTemplates['TEMPLATE_EXECUTIVE'].id,
          name: 'Executive Dashboard Boardroom',
          description: 'Seeded default enterprise-wide business dashboard.',
          type: 'EXECUTIVE',
          ownerId: superUser.id,
          isPinned: true,
          refreshInterval: '5M',
        },
      });

      // Add default widgets referencing widgets library
      await prisma.dashboardWidget.create({
        data: {
          tenantId: defaultTenantId,
          dashboardId: execDashboard.id,
          widgetId: dbWidgets['WIDGET_KPI_CARD'].id,
          title: 'Financial Revenue Summary',
          xPos: 0,
          yPos: 0,
          width: 4,
          height: 3,
          drillDownMetadata: JSON.stringify({ route: '/finance/invoices' }),
        },
      });

      await prisma.dashboardWidget.create({
        data: {
          tenantId: defaultTenantId,
          dashboardId: execDashboard.id,
          widgetId: dbWidgets['WIDGET_FUNNEL'].id,
          title: 'Sales Funnel Pipeline',
          xPos: 4,
          yPos: 0,
          width: 4,
          height: 3,
          drillDownMetadata: JSON.stringify({ route: '/crm/leads' }),
        },
      });

      await prisma.dashboardWidget.create({
        data: {
          tenantId: defaultTenantId,
          dashboardId: execDashboard.id,
          widgetId: dbWidgets['WIDGET_LINE_CHART'].id,
          title: 'Resource Productivity Trends',
          xPos: 0,
          yPos: 3,
          width: 8,
          height: 4,
          drillDownMetadata: JSON.stringify({ route: '/projects/tasks' }),
        },
      });
    }
  }

  // Seeding Default Notification Templates
  console.log('Seeding Default Notification Templates...');
  const templates = [
    {
      name: 'Task Assigned Notification',
      code: 'TEMPLATE_TASK_ASSIGNED',
      subject: 'New Task Assigned: {{taskName}}',
      body: '<p>Hello {{userName}},</p><p>You have been assigned to task <b>{{taskName}}</b> under project <b>{{projectName}}</b>. The due date is {{dueDate}}.</p>',
      type: 'EMAIL',
    },
    {
      name: 'Invoice Paid Confirmation',
      code: 'TEMPLATE_INVOICE_PAID',
      subject: 'Invoice Paid Confirm',
      body: 'Hello, your invoice {{invoiceNumber}} for the amount of {{amount}} has been successfully paid.',
      type: 'SMS',
    },
    {
      name: 'Leave Approval Workflow Step',
      code: 'TEMPLATE_LEAVE_APPROVAL',
      subject: 'Approval Needed for Leave Request',
      body: '<p>Hello,</p><p>A leave request from <b>{{userName}}</b> requires your approval step decision.</p>',
      type: 'EMAIL',
    },
  ];

  for (const t of templates) {
    await prisma.notificationTemplate.upsert({
      where: { code: t.code },
      update: { name: t.name, subject: t.subject, body: t.body, type: t.type as any },
      create: { tenantId: defaultTenantId, name: t.name, code: t.code, subject: t.subject, body: t.body, type: t.type as any },
    });
  }

  // Seeding Default Workflow Definition
  console.log('Seeding Leave Approval Workflow Definition...');
  const workflowCode = 'WORKFLOW_LEAVE_APPROVAL';
  let workflow = await prisma.workflowDefinition.findFirst({
    where: { name: 'Leave Approval Workflow' },
  });

  if (!workflow) {
    workflow = await prisma.workflowDefinition.create({
      data: {
        tenantId: defaultTenantId,
        name: 'Leave Approval Workflow',
        description: 'Multi-stage leaves request validation workflow.',
        status: 'ACTIVE',
        steps: {
          create: [
            {
              tenantId: defaultTenantId,
              name: 'Manager Approval Level 1',
              stepOrder: 1,
            },
            {
              tenantId: defaultTenantId,
              name: 'HR Director Approval Level 2',
              stepOrder: 2,
            },
          ],
        },
      },
    });
  }

  // Seeding Default Reminder Rules
  console.log('Seeding Default Reminder Rules...');
  await prisma.reminder.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      tenantId: defaultTenantId,
      title: 'Outstanding Invoice Collections Reminder',
      description: 'Check for unpaid invoice balances every monday',
      frequency: 'WEEKLY',
      targetDate: new Date(),
    },
  });

  // Seeding Default SEO Project and Keyword Groups
  console.log('Seeding Default SEO Project and Keyword Groups...');
  const firstClient = await prisma.client.findFirst();
  const firstProj = await prisma.project.findFirst();
  const firstUser = await prisma.user.findFirst({ where: { email: 'superadmin@grehasoft.com' } });

  if (firstClient && firstProj && firstUser) {
    const defaultSeoProject = await prisma.sEOProject.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        tenantId: defaultTenantId,
        clientId: firstClient.id,
        projectId: firstProj.id,
        ownerId: firstUser.id,
        domain: 'grehasoft.com',
        status: 'ACTIVE',
      },
    });

    const groups = ['General', 'Services', 'Local SEO', 'Technical SEO'];
    for (const gName of groups) {
      await prisma.keywordGroup.create({
        data: {
          tenantId: defaultTenantId,
          seoProjectId: defaultSeoProject.id,
          name: gName,
        },
      });
    }

    // Seeding default Schema Templates
    const schemaTemplates = [
      { type: 'ORGANIZATION', jsonLdContent: '{"@context":"https://schema.org","@type":"Organization","name":"Grehasoft"}' },
      { type: 'FAQ', jsonLdContent: '{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[]}' },
      { type: 'PRODUCT', jsonLdContent: '{"@context":"https://schema.org","@type":"Product","name":"PMS Software"}' },
      { type: 'LOCAL_BUSINESS', jsonLdContent: '{"@context":"https://schema.org","@type":"LocalBusiness","name":"Grehasoft India"}' },
    ];
    for (const sTemp of schemaTemplates) {
      await prisma.schemaMarkup.create({
        data: {
          tenantId: defaultTenantId,
          seoProjectId: defaultSeoProject.id,
          urlPath: '/',
          type: sTemp.type as any,
          jsonLdContent: sTemp.jsonLdContent,
        },
      });
    }

    // Seeding default Audit Recommendations
    const recommendations = [
      { title: 'Fix Missing Meta Descriptions', description: 'Detect and add missing search descriptions across target landing pages.', priority: 'HIGH', impactScore: 85 },
      { title: 'Resolve 404 Broken Internal Links', description: 'Audit crawler links mapping to resolve broken pages.', priority: 'HIGH', impactScore: 90 },
      { title: 'Optimize Heading Structure Hierarchy', description: 'Ensure pages have exactly one H1 tag and logical H2-H4 flow.', priority: 'MEDIUM', impactScore: 60 },
      { title: 'Compress Large Images', description: 'Resize media page loads to speed up Core Web Vitals checks.', priority: 'LOW', impactScore: 40 },
    ];
    for (const rec of recommendations) {
      await prisma.sEORecommendation.create({
        data: {
          tenantId: defaultTenantId,
          seoProjectId: defaultSeoProject.id,
          title: rec.title,
          description: rec.description,
          priority: rec.priority,
          impactScore: rec.impactScore,
          isCompleted: false,
        },
      });
    }
    // Seeding default Integrations
    console.log('Seeding default Integrations providers...');
    const integrationProviders = [
      'GOOGLE', 'MICROSOFT', 'GITHUB', 'GITLAB', 'SLACK', 'ZOOM', 'STRIPE', 'RAZORPAY', 'PAYPAL', 'TWILIO', 'WHATSAPP', 'CUSTOM'
    ];
    for (const prov of integrationProviders) {
      await prisma.integration.create({
        data: {
          tenantId: defaultTenantId,
          clientId: firstClient.id,
          projectId: firstProj.id,
          provider: prov as any,
          status: 'CONNECTED',
        },
      });
    }

    // Seeding API Versions
    console.log('Seeding API Versions...');
    const versions = ['v1', 'v2'];
    for (const vStr of versions) {
      await prisma.apiVersion.upsert({
        where: { versionString: vStr },
        update: {},
        create: {
          tenantId: defaultTenantId,
          versionString: vStr,
          status: 'ACTIVE',
        },
      });
    }
  }

  // Seeding P0 RBAC Roles and Permissions Mappings
    console.log('Seeding P0 RBAC Roles and Permissions Mappings...');

    const seoManagerRole = await prisma.role.upsert({
      where: { name: 'SEO Manager' },
      update: {},
      create: {
        name: 'SEO Manager',
        description: 'SEO Manager role with full target setting and review access',
        isSystem: false,
      },
    });

    const seoExecRole = await prisma.role.upsert({
      where: { name: 'SEO Executive' },
      update: {},
      create: {
        name: 'SEO Executive',
        description: 'SEO Executive role for logging daily work and tracking tasks',
        isSystem: false,
      },
    });

    const salesManagerRole = await prisma.role.upsert({
      where: { name: 'Sales Manager' },
      update: {},
      create: {
        name: 'Sales Manager',
        description: 'Sales Manager role with full proposal and lead access',
        isSystem: false,
      },
    });

    const salesExecRole = await prisma.role.upsert({
      where: { name: 'Sales Executive' },
      update: {},
      create: {
        name: 'Sales Executive',
        description: 'Sales Executive role for creating proposals and managing assigned leads',
        isSystem: false,
      },
    });

    const clientRole = await prisma.role.upsert({
      where: { name: 'Client' },
      update: {},
      create: {
        name: 'Client',
        description: 'Client Portal access role',
        isSystem: false,
      },
    });

    const allPermissionsInDb = await prisma.permission.findMany();

    async function assignPermissionsToRole(roleName: string, permissionCodes: string[]) {
      const role = await prisma.role.findFirst({
        where: { name: roleName },
      });
      if (!role) {
        console.warn(`Role "${roleName}" not found. Skipping.`);
        return;
      }
      
      const dbPermissions = allPermissionsInDb.filter(p => permissionCodes.includes(p.code));

      const foundCodes = dbPermissions.map(p => p.code);
      const missingCodes = permissionCodes.filter(c => !foundCodes.includes(c));
      if (missingCodes.length > 0) {
        console.log(`Skipped missing codes for role "${roleName}":`, missingCodes);
      }

      await prisma.role.update({
        where: { id: role.id },
        data: {
          permissions: {
            connect: dbPermissions.map(p => ({ id: p.id })),
          },
        },
      });
      console.log(`Successfully mapped ${dbPermissions.length} permissions to role "${roleName}".`);
    }

    const employeeCodes = [
      'projects.read',
      'tasks.read',
      'tasks.update',
      'timetracking.read',
      'timesheets.submit',
      'attendance.read',
      'reports.read',
    ];

    const managerCodes = [
      ...employeeCodes,
      'projects.create',
      'projects.update',
      'tasks.create',
      'tasks.delete',
      'client-categories.read',
      'clients.read',
      'leave.approve',
      'timesheets.approve',
    ];

    const seoManagerCodes = [
      ...managerCodes,
      'seo.manage',
    ];

    const seoExecCodes = [
      ...employeeCodes,
      'seo.read',
    ];

    const salesManagerCodes = [
      'leads.create',
      'leads.read',
      'leads.update',
      'leads.delete',
      'leads.assign',
      'leads.merge',
      'leads.restore',
      'proposals.create',
      'proposals.read',
      'proposals.update',
      'proposals.delete',
      'proposals.approve',
      'proposals.pdf',
      'proposal-templates.create',
      'proposal-templates.read',
      'proposal-templates.update',
      'proposal-templates.delete',
      'clients.create',
      'clients.read',
      'clients.update',
      'opportunities.create',
      'opportunities.read',
      'opportunities.update',
      'opportunities.delete',
      'opportunities.convert',
      'reports.read',
    ];

    const salesExecCodes = [
      'leads.create',
      'leads.read',
      'leads.update',
      'proposals.create',
      'proposals.read',
      'proposals.update',
      'proposals.pdf',
      'proposal-templates.read',
      'clients.read',
      'opportunities.create',
      'opportunities.read',
      'opportunities.update',
      'opportunities.convert',
      'reports.read',
    ];

    const clientCodes = [
      'projects.read',
      'proposals.read',
      'invoices.read',
      'payments.read',
    ];

    const systemExcludedPrefixes = [
      'infrastructure',
      'servers',
      'domains',
      'api.',
      'apikeys',
      'oauth',
      'webhooks',
      'analytics.manage',
      'developer.manage',
    ];
    const companyAdminCodes = allPermissionsInDb
      .map(p => p.code)
      .filter(code => !systemExcludedPrefixes.some(prefix => code.startsWith(prefix)));

    // Apply mappings synchronously
    await assignPermissionsToRole('Employee', employeeCodes);
    await assignPermissionsToRole('Manager', managerCodes);
    await assignPermissionsToRole('SEO Manager', seoManagerCodes);
    await assignPermissionsToRole('SEO Executive', seoExecCodes);
    await assignPermissionsToRole('Sales Manager', salesManagerCodes);
    await assignPermissionsToRole('Sales Executive', salesExecCodes);
    await assignPermissionsToRole('Client', clientCodes);
    await assignPermissionsToRole('Company Admin', companyAdminCodes);

    // Auto-create missing EmployeeProfiles for existing non-client users
    console.log('Ensuring all non-client users have linked EmployeeProfiles...');
    const dbUsers = await prisma.user.findMany({
      include: {
        role: true,
        employeeProfile: true,
      },
    });

    const currentYear = new Date().getFullYear();
    let codeIndex = 1;
    for (const u of dbUsers) {
      const roleName = (u.role?.name || '').toUpperCase();
      if (roleName !== 'CLIENT' && !u.employeeProfile) {
        let empCode = '';
        while (true) {
          const checkCode = `EMP-${currentYear}-${String(codeIndex).padStart(6, '0')}`;
          const codeExists = await prisma.employeeProfile.findUnique({
            where: { employeeCode: checkCode },
          });
          if (!codeExists) {
            empCode = checkCode;
            break;
          }
          codeIndex++;
        }

        await prisma.employeeProfile.create({
          data: {
            userId: u.id,
            employeeCode: empCode,
            dateOfJoining: u.createdAt || new Date(),
            employmentStatus: 'ACTIVE',
          },
        });
        console.log(`Created missing EmployeeProfile for user ${u.email} (${empCode})`);
      }
  }

  // Ensure all existing/seeded users are assigned to the Default Company
  console.log('Mapping all unlinked users to the Default Company...');
  await prisma.user.updateMany({
    where: { companyId: null },
    data: { companyId: '00000000-0000-0000-0000-000000000000' },
  });

  console.log('🌿 Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
