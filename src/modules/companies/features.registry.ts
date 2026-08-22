export interface FeatureDefinition {
  key: string;
  label: string;
  parentKey?: string;
}

export interface CompanyFeatureView extends FeatureDefinition {
  isEnabled: boolean;
  isExplicitlySet: boolean;
}

export interface FeatureTreeNode {
  key: string;
  label: string;
  isEnabled: boolean;
  children: FeatureTreeNode[];
}

export const FEATURE_REGISTRY: Record<string, FeatureDefinition> = {
  DASHBOARD: { key: 'DASHBOARD', label: 'Dashboard' },

  DIRECTORY: { key: 'DIRECTORY', label: 'Directory' },
  DIRECTORY_USERS: {
    key: 'DIRECTORY_USERS',
    label: 'Users Management',
    parentKey: 'DIRECTORY',
  },

  CRM: { key: 'CRM', label: 'CRM' },
  CRM_DASHBOARD: {
    key: 'CRM_DASHBOARD',
    label: 'CRM Dashboard',
    parentKey: 'CRM',
  },
  CRM_LEADS: { key: 'CRM_LEADS', label: 'Leads & Deals', parentKey: 'CRM' },
  CRM_FOLLOWUPS: {
    key: 'CRM_FOLLOWUPS',
    label: 'Lead Follow-ups',
    parentKey: 'CRM',
  },
  CRM_CLIENTS: {
    key: 'CRM_CLIENTS',
    label: 'Clients Directory',
    parentKey: 'CRM',
  },
  CRM_PROPOSALS: {
    key: 'CRM_PROPOSALS',
    label: 'Proposals Quote',
    parentKey: 'CRM',
  },

  PROJECTS: { key: 'PROJECTS', label: 'Projects & Work Management' },
  PROJECTS_DASHBOARD: {
    key: 'PROJECTS_DASHBOARD',
    label: 'Projects Dashboard',
    parentKey: 'PROJECTS',
  },
  PROJECTS_LIST: {
    key: 'PROJECTS_LIST',
    label: 'Projects List',
    parentKey: 'PROJECTS',
  },
  PROJECTS_TASKS: {
    key: 'PROJECTS_TASKS',
    label: 'Tasks',
    parentKey: 'PROJECTS',
  },
  PROJECTS_TIMESHEETS: {
    key: 'PROJECTS_TIMESHEETS',
    label: 'Timesheets',
    parentKey: 'PROJECTS',
  },
  PROJECTS_MY_PRODUCTIVITY: {
    key: 'PROJECTS_MY_PRODUCTIVITY',
    label: 'My Productivity',
    parentKey: 'PROJECTS',
  },
  PROJECTS_TEAM_PRODUCTIVITY: {
    key: 'PROJECTS_TEAM_PRODUCTIVITY',
    label: 'Team Productivity',
    parentKey: 'PROJECTS',
  },

  FINANCE: { key: 'FINANCE', label: 'Finance' },
  FINANCE_DASHBOARD: {
    key: 'FINANCE_DASHBOARD',
    label: 'Finance Dashboard',
    parentKey: 'FINANCE',
  },
  FINANCE_INVOICES: {
    key: 'FINANCE_INVOICES',
    label: 'Invoices & Billing',
    parentKey: 'FINANCE',
  },
  FINANCE_EXPENSES: {
    key: 'FINANCE_EXPENSES',
    label: 'Expense Claims',
    parentKey: 'FINANCE',
  },

  HR: { key: 'HR', label: 'HR & Workforce' },
  HR_DASHBOARD: { key: 'HR_DASHBOARD', label: 'HR Dashboard', parentKey: 'HR' },
  HR_EMPLOYEES: {
    key: 'HR_EMPLOYEES',
    label: 'Staff Directory',
    parentKey: 'HR',
  },
  HR_LEAVE: { key: 'HR_LEAVE', label: 'Leaves Workflow', parentKey: 'HR' },
  HR_ATTENDANCE: {
    key: 'HR_ATTENDANCE',
    label: 'Attendance Management',
    parentKey: 'HR',
  },
  HR_SHIFTS: { key: 'HR_SHIFTS', label: 'Shift Scheduling', parentKey: 'HR' },
  HR_PERFORMANCE: {
    key: 'HR_PERFORMANCE',
    label: 'HR Performance Appraisal',
    parentKey: 'HR',
  },
  HR_TRAINING: {
    key: 'HR_TRAINING',
    label: 'HR Training & Courses',
    parentKey: 'HR',
  },
  HR_ASSETS: { key: 'HR_ASSETS', label: 'HR Handed Assets', parentKey: 'HR' },
  HR_DOCUMENTS: {
    key: 'HR_DOCUMENTS',
    label: 'HR Compliance Documents',
    parentKey: 'HR',
  },

  ASSETS: { key: 'ASSETS', label: 'Assets & Infrastructure' },
  ASSETS_DIRECTORY: {
    key: 'ASSETS_DIRECTORY',
    label: 'Asset Directory',
    parentKey: 'ASSETS',
  },
  ASSETS_INFRASTRUCTURE: {
    key: 'ASSETS_INFRASTRUCTURE',
    label: 'DevOps Servers',
    parentKey: 'ASSETS',
  },
  ASSETS_DOMAINS: {
    key: 'ASSETS_DOMAINS',
    label: 'Domains & DNS',
    parentKey: 'ASSETS',
  },
  ASSETS_LICENSES: {
    key: 'ASSETS_LICENSES',
    label: 'Licenses & Software',
    parentKey: 'ASSETS',
  },
  ASSETS_VENDORS: {
    key: 'ASSETS_VENDORS',
    label: 'Vendors',
    parentKey: 'ASSETS',
  },
  ASSETS_MAINTENANCE: {
    key: 'ASSETS_MAINTENANCE',
    label: 'Maintenance & Repairs',
    parentKey: 'ASSETS',
  },
  ASSETS_REPORTS: {
    key: 'ASSETS_REPORTS',
    label: 'Reports & Export',
    parentKey: 'ASSETS',
  },

  REPORTS: { key: 'REPORTS', label: 'Reports & Analytics' },
  REPORTS_BI: {
    key: 'REPORTS_BI',
    label: 'BI Dashboards',
    parentKey: 'REPORTS',
  },
  REPORTS_KPI: {
    key: 'REPORTS_KPI',
    label: 'KPI Definitions',
    parentKey: 'REPORTS',
  },
  REPORTS_ALERTS: {
    key: 'REPORTS_ALERTS',
    label: 'System Alert Logs',
    parentKey: 'REPORTS',
  },
  REPORTS_EXPORTS: {
    key: 'REPORTS_EXPORTS',
    label: 'Reports Export',
    parentKey: 'REPORTS',
  },

  AUTOMATION: { key: 'AUTOMATION', label: 'Automation & Notification Center' },
  AUTOMATION_HUB: {
    key: 'AUTOMATION_HUB',
    label: 'Automation Hub',
    parentKey: 'AUTOMATION',
  },
  AUTOMATION_NOTIFICATIONS: {
    key: 'AUTOMATION_NOTIFICATIONS',
    label: 'Notification Center',
    parentKey: 'AUTOMATION',
  },
  AUTOMATION_PREFERENCES: {
    key: 'AUTOMATION_PREFERENCES',
    label: 'Preferences',
    parentKey: 'AUTOMATION',
  },
  AUTOMATION_WORKFLOW_RULES: {
    key: 'AUTOMATION_WORKFLOW_RULES',
    label: 'Workflow Rules',
    parentKey: 'AUTOMATION',
  },
  AUTOMATION_SCHEDULED_JOBS: {
    key: 'AUTOMATION_SCHEDULED_JOBS',
    label: 'Scheduled Jobs & Reminders',
    parentKey: 'AUTOMATION',
  },
  AUTOMATION_EMAIL_TEMPLATES: {
    key: 'AUTOMATION_EMAIL_TEMPLATES',
    label: 'Email & Templates',
    parentKey: 'AUTOMATION',
  },
  AUTOMATION_SYSTEM_ALERTS: {
    key: 'AUTOMATION_SYSTEM_ALERTS',
    label: 'System Alerts Engine',
    parentKey: 'AUTOMATION',
  },
  AUTOMATION_QUEUE_HEALTH: {
    key: 'AUTOMATION_QUEUE_HEALTH',
    label: 'Queue & Telemetry',
    parentKey: 'AUTOMATION',
  },

  SEO: { key: 'SEO', label: 'SEO Management' },
  SEO_DASHBOARD: {
    key: 'SEO_DASHBOARD',
    label: 'SEO Dashboard',
    parentKey: 'SEO',
  },
  SEO_KEYWORDS: {
    key: 'SEO_KEYWORDS',
    label: 'Keywords Rank Check',
    parentKey: 'SEO',
  },
  SEO_BACKLINKS: {
    key: 'SEO_BACKLINKS',
    label: 'Backlinks Tracker',
    parentKey: 'SEO',
  },

  WORK_TELEMETRY: { key: 'WORK_TELEMETRY', label: 'Work Telemetry' },
  WORK_TELEMETRY_ACTIVITY: {
    key: 'WORK_TELEMETRY_ACTIVITY',
    label: 'Activity Logs',
    parentKey: 'WORK_TELEMETRY',
  },
  WORK_TELEMETRY_SCREENSHOTS: {
    key: 'WORK_TELEMETRY_SCREENSHOTS',
    label: 'Screenshot Captures',
    parentKey: 'WORK_TELEMETRY',
  },

  CLIENT_PORTAL: { key: 'CLIENT_PORTAL', label: 'Client Portal' },
  CLIENT_PORTAL_MAIN: {
    key: 'CLIENT_PORTAL_MAIN',
    label: 'Client Portal Main View',
    parentKey: 'CLIENT_PORTAL',
  },

  INTEGRATIONS: { key: 'INTEGRATIONS', label: 'Integrations Hub' },
  INTEGRATIONS_API_KEYS: {
    key: 'INTEGRATIONS_API_KEYS',
    label: 'Developer API Keys',
    parentKey: 'INTEGRATIONS',
  },
  INTEGRATIONS_WEBHOOKS: {
    key: 'INTEGRATIONS_WEBHOOKS',
    label: 'Webhook Triggers',
    parentKey: 'INTEGRATIONS',
  },
  INTEGRATIONS_VAULT: {
    key: 'INTEGRATIONS_VAULT',
    label: 'Secure Vault',
    parentKey: 'INTEGRATIONS',
  },
  INTEGRATIONS_DEVELOPER: {
    key: 'INTEGRATIONS_DEVELOPER',
    label: 'Developer Portal',
    parentKey: 'INTEGRATIONS',
  },
};
