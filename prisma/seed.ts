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
