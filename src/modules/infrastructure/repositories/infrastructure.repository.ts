import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import {
  Prisma,
  InfrastructureStatus,
  ServerType,
  Environment,
  DeploymentStatus,
  BackupStatus,
  MonitoringStatus,
} from '@prisma/client';

@Injectable()
export class InfrastructureRepository {
  constructor(public readonly prisma: PrismaService) {}

  // Providers
  async findProviders() {
    return this.prisma.infrastructureProvider.findMany({
      include: { hostingPlans: true },
    });
  }

  async findProviderByCode(code: string) {
    return this.prisma.infrastructureProvider.findUnique({ where: { code } });
  }

  // Hosting Plans
  async createHostingPlan(data: Prisma.HostingPlanUncheckedCreateInput) {
    return this.prisma.hostingPlan.create({ data });
  }

  async findHostingPlans() {
    return this.prisma.hostingPlan.findMany({ include: { provider: true } });
  }

  async findHostingPlanById(id: string) {
    return this.prisma.hostingPlan.findUnique({ where: { id } });
  }

  // Hosting Accounts
  async createHostingAccount(data: Prisma.HostingAccountUncheckedCreateInput) {
    return this.prisma.hostingAccount.create({ data });
  }

  async updateHostingAccount(
    id: string,
    data: Prisma.HostingAccountUncheckedUpdateInput,
  ) {
    return this.prisma.hostingAccount.update({ where: { id }, data });
  }

  async findHostingAccounts(filters: {
    clientId?: string;
    projectId?: string;
  }) {
    const where: Prisma.HostingAccountWhereInput = {};
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.projectId) where.projectId = filters.projectId;

    return this.prisma.hostingAccount.findMany({
      where,
      include: {
        provider: true,
        hostingPlan: true,
        client: true,
        project: true,
      },
    });
  }

  async findHostingAccountById(id: string) {
    return this.prisma.hostingAccount.findUnique({
      where: { id },
      include: {
        provider: true,
        hostingPlan: true,
        backups: true,
        credentials: true,
      },
    });
  }

  // Servers
  async createServer(data: Prisma.ServerUncheckedCreateInput) {
    return this.prisma.server.create({ data });
  }

  async updateServer(id: string, data: Prisma.ServerUncheckedUpdateInput) {
    return this.prisma.server.update({ where: { id }, data });
  }

  async findServers(filters: {
    status?: InfrastructureStatus;
    projectId?: string;
  }) {
    const where: Prisma.ServerWhereInput = {};
    if (filters.status) where.status = filters.status;
    if (filters.projectId) where.projectId = filters.projectId;

    return this.prisma.server.findMany({
      where,
      include: { provider: true, client: true, project: true },
    });
  }

  async findServerById(id: string) {
    return this.prisma.server.findUnique({
      where: { id },
      include: {
        provider: true,
        serverEnvironments: true,
        backups: true,
        backupSchedules: true,
        monitoringChecks: true,
        incidents: true,
        credentials: true,
      },
    });
  }

  // Server Environments
  async createServerEnvironment(
    data: Prisma.ServerEnvironmentUncheckedCreateInput,
  ) {
    return this.prisma.serverEnvironment.create({ data });
  }

  async findServerEnvironments(serverId: string) {
    return this.prisma.serverEnvironment.findMany({ where: { serverId } });
  }

  async findServerEnvironmentById(id: string) {
    return this.prisma.serverEnvironment.findUnique({
      where: { id },
      include: { server: true, project: true },
    });
  }

  // Repositories
  async createRepository(data: Prisma.RepositoryUncheckedCreateInput) {
    return this.prisma.repository.create({ data });
  }

  async findRepositories(projectId?: string) {
    return this.prisma.repository.findMany({
      where: projectId ? { projectId } : {},
      include: { branches: true },
    });
  }

  async findRepositoryById(id: string) {
    return this.prisma.repository.findUnique({
      where: { id },
      include: { branches: true },
    });
  }

  async addBranch(data: Prisma.RepositoryBranchUncheckedCreateInput) {
    return this.prisma.repositoryBranch.create({ data });
  }

  async findBranchById(id: string) {
    return this.prisma.repositoryBranch.findUnique({
      where: { id },
      include: { repository: true },
    });
  }

  // Deployments
  async createDeployment(data: Prisma.DeploymentUncheckedCreateInput) {
    return this.prisma.deployment.create({ data });
  }

  async updateDeployment(
    id: string,
    data: Prisma.DeploymentUncheckedUpdateInput,
  ) {
    return this.prisma.deployment.update({
      where: { id },
      data,
      include: { startedBy: true, serverEnvironment: true },
    });
  }

  async findDeployments(filters: {
    projectId?: string;
    status?: DeploymentStatus;
  }) {
    const where: Prisma.DeploymentWhereInput = {};
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.status) where.status = filters.status;

    return this.prisma.deployment.findMany({
      where,
      include: {
        project: true,
        serverEnvironment: { include: { server: true } },
        repositoryBranch: true,
        startedBy: true,
      },
      orderBy: { startedAt: 'desc' },
    });
  }

  async findDeploymentById(id: string) {
    return this.prisma.deployment.findUnique({
      where: { id },
      include: {
        project: true,
        serverEnvironment: { include: { server: true } },
        repositoryBranch: true,
        startedBy: true,
        historyLogs: true,
      },
    });
  }

  async createDeploymentHistory(
    data: Prisma.DeploymentHistoryUncheckedCreateInput,
  ) {
    return this.prisma.deploymentHistory.create({ data });
  }

  // Domains
  async createDomain(data: Prisma.DomainUncheckedCreateInput) {
    return this.prisma.domain.create({ data });
  }

  async updateDomain(id: string, data: Prisma.DomainUncheckedUpdateInput) {
    return this.prisma.domain.update({ where: { id }, data });
  }

  async findDomains(filters: {
    status?: InfrastructureStatus;
    clientId?: string;
  }) {
    const where: Prisma.DomainWhereInput = {};
    if (filters.status) where.status = filters.status;
    if (filters.clientId) where.clientId = filters.clientId;

    return this.prisma.domain.findMany({
      where,
      include: { client: true, project: true },
    });
  }

  async findDomainById(id: string) {
    return this.prisma.domain.findUnique({
      where: { id },
      include: {
        subDomains: true,
        dnsRecords: true,
        sslCertificates: true,
        monitoringChecks: true,
        credentials: true,
      },
    });
  }

  async findDomainByName(name: string) {
    return this.prisma.domain.findUnique({ where: { name } });
  }

  // SubDomains
  async createSubDomain(data: Prisma.SubDomainUncheckedCreateInput) {
    return this.prisma.subDomain.create({ data });
  }

  async findSubDomainById(id: string) {
    return this.prisma.subDomain.findUnique({ where: { id } });
  }

  // DNS
  async createDnsRecord(data: Prisma.DNSRecordUncheckedCreateInput) {
    return this.prisma.dNSRecord.create({ data });
  }

  async deleteDnsRecord(id: string) {
    return this.prisma.dNSRecord.delete({ where: { id } });
  }

  // SSL
  async createSSLCertificate(data: Prisma.SSLCertificateUncheckedCreateInput) {
    return this.prisma.sSLCertificate.create({ data });
  }

  async updateSSLCertificate(
    id: string,
    data: Prisma.SSLCertificateUncheckedUpdateInput,
  ) {
    return this.prisma.sSLCertificate.update({ where: { id }, data });
  }

  // Backup Schedules
  async createBackupSchedule(data: Prisma.BackupScheduleUncheckedCreateInput) {
    return this.prisma.backupSchedule.create({ data });
  }

  async findBackupSchedules(serverId?: string) {
    return this.prisma.backupSchedule.findMany({
      where: serverId ? { serverId } : {},
      include: { server: true, hostingAccount: true },
    });
  }

  async findBackupScheduleById(id: string) {
    return this.prisma.backupSchedule.findUnique({ where: { id } });
  }

  // Backups
  async createBackup(data: Prisma.BackupUncheckedCreateInput) {
    return this.prisma.backup.create({ data });
  }

  async updateBackup(id: string, data: Prisma.BackupUncheckedUpdateInput) {
    return this.prisma.backup.update({ where: { id }, data });
  }

  async findBackups(filters: { serverId?: string; hostingAccountId?: string }) {
    const where: Prisma.BackupWhereInput = {};
    if (filters.serverId) where.serverId = filters.serverId;
    if (filters.hostingAccountId)
      where.hostingAccountId = filters.hostingAccountId;

    return this.prisma.backup.findMany({
      where,
      include: { server: true, hostingAccount: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBackupById(id: string) {
    return this.prisma.backup.findUnique({ where: { id } });
  }

  // Monitoring
  async createMonitoringCheck(
    data: Prisma.MonitoringCheckUncheckedCreateInput,
  ) {
    return this.prisma.monitoringCheck.create({ data });
  }

  async updateMonitoringCheck(
    id: string,
    data: Prisma.MonitoringCheckUncheckedUpdateInput,
  ) {
    return this.prisma.monitoringCheck.update({ where: { id }, data });
  }

  async findMonitoringChecks(filters: {
    serverId?: string;
    domainId?: string;
  }) {
    const where: Prisma.MonitoringCheckWhereInput = {};
    if (filters.serverId) where.serverId = filters.serverId;
    if (filters.domainId) where.domainId = filters.domainId;

    return this.prisma.monitoringCheck.findMany({
      where,
      include: { server: true, domain: true },
    });
  }

  // Incidents
  async createIncident(data: Prisma.IncidentUncheckedCreateInput) {
    return this.prisma.incident.create({ data });
  }

  async updateIncident(id: string, data: Prisma.IncidentUncheckedUpdateInput) {
    return this.prisma.incident.update({ where: { id }, data });
  }

  async findIncidents(status?: string) {
    return this.prisma.incident.findMany({
      where: status ? { status } : {},
      include: { server: true, domain: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findIncidentById(id: string) {
    return this.prisma.incident.findUnique({ where: { id } });
  }

  // Maintenance Windows
  async createMaintenanceWindow(data: Prisma.MaintenanceWindowCreateInput) {
    return this.prisma.maintenanceWindow.create({ data });
  }

  async updateMaintenanceWindow(
    id: string,
    data: Prisma.MaintenanceWindowUpdateInput,
  ) {
    return this.prisma.maintenanceWindow.update({ where: { id }, data });
  }

  async findMaintenanceWindows() {
    return this.prisma.maintenanceWindow.findMany({
      orderBy: { scheduledStart: 'asc' },
    });
  }

  // Credentials
  async createCredential(
    data: Prisma.InfrastructureCredentialUncheckedCreateInput,
  ) {
    return this.prisma.infrastructureCredential.create({ data });
  }

  async updateCredential(
    id: string,
    data: Prisma.InfrastructureCredentialUncheckedUpdateInput,
  ) {
    return this.prisma.infrastructureCredential.update({ where: { id }, data });
  }

  async findCredentials(filters: {
    serverId?: string;
    domainId?: string;
    hostingAccountId?: string;
  }) {
    const where: Prisma.InfrastructureCredentialWhereInput = {};
    if (filters.serverId) where.serverId = filters.serverId;
    if (filters.domainId) where.domainId = filters.domainId;
    if (filters.hostingAccountId)
      where.hostingAccountId = filters.hostingAccountId;

    return this.prisma.infrastructureCredential.findMany({ where });
  }

  async findCredentialById(id: string) {
    return this.prisma.infrastructureCredential.findUnique({ where: { id } });
  }

  // Timeline
  async createTimelineEvent(
    resourceId: string,
    resourceType: string,
    event: string,
    description: string,
  ) {
    return this.prisma.infrastructureTimeline.create({
      data: { resourceId, resourceType, event, description },
    });
  }

  async findTimeline(resourceId: string) {
    return this.prisma.infrastructureTimeline.findMany({
      where: { resourceId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteServer(id: string) {
    return this.prisma.server.delete({ where: { id } });
  }

  async deleteDomain(id: string) {
    return this.prisma.domain.delete({ where: { id } });
  }

  async deleteCredential(id: string) {
    return this.prisma.infrastructureCredential.delete({ where: { id } });
  }
}
