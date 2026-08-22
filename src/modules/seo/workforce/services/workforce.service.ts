import {
  Inject,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../../core/database/prisma.service';
import { SecretVaultService } from '../../../integrations/secrets/secret-vault.service';
import { STORAGE_PROVIDER_TOKEN } from '../../../../shared/storage/storage.interface';
import type { IStorageProvider } from '../../../../shared/storage/storage.interface';
import {
  CreateSEOActivityTypeDto,
  UpdateSEOActivityTypeDto,
  CreateSEODailyWorkLogDto,
  UpdateSEODailyWorkLogDto,
  ReviewSEODailyWorkLogDto,
  CreateSEOMonthlyTargetDto,
  UpdateSEOMonthlyTargetDto,
  CreateSEOTaskDto,
  UpdateSEOTaskDto,
  ReviewSEOTaskDto,
  CreateSEOCredentialDto,
  UpdateSEOCredentialDto,
} from '../dto/workforce.dto';

@Injectable()
export class WorkforceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vaultService: SecretVaultService,
    @Inject(STORAGE_PROVIDER_TOKEN)
    private readonly storageProvider: IStorageProvider,
  ) {}

  // 1. Activity Types
  async createActivityType(tenantId: string, dto: CreateSEOActivityTypeDto) {
    return this.prisma.sEOActivityType.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description || '',
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        displayOrder: dto.displayOrder || 0,
      },
    });
  }

  async getActivityTypes(tenantId: string) {
    return this.prisma.sEOActivityType.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async getActivityType(tenantId: string, id: string) {
    const item = await this.prisma.sEOActivityType.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!item) throw new NotFoundException('SEO Activity Type not found');
    return item;
  }

  async updateActivityType(
    tenantId: string,
    id: string,
    dto: UpdateSEOActivityTypeDto,
  ) {
    await this.getActivityType(tenantId, id);
    return this.prisma.sEOActivityType.update({
      where: { id },
      data: {
        ...dto,
      },
    });
  }

  async deleteActivityType(tenantId: string, id: string) {
    await this.getActivityType(tenantId, id);
    return this.prisma.sEOActivityType.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // 2. Credentials (Vault Integrated)
  async createCredential(tenantId: string, dto: CreateSEOCredentialDto) {
    const cred = await this.prisma.sEOCredential.create({
      data: {
        tenantId,
        seoProjectId: dto.seoProjectId,
        platform: dto.platform,
        username: dto.username,
        notes: dto.notes || '',
      },
    });

    if (dto.password) {
      await this.vaultService.storeSecret(
        tenantId,
        `seo_credential_password_${cred.id}`,
        'CLIENT_SECRET',
        dto.password,
      );
    }

    return cred;
  }

  async getCredentials(tenantId: string, seoProjectId: string) {
    return this.prisma.sEOCredential.findMany({
      where: { tenantId, seoProjectId, deletedAt: null },
      orderBy: { platform: 'asc' },
    });
  }

  async getCredentialPassword(tenantId: string, id: string) {
    const cred = await this.prisma.sEOCredential.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!cred) throw new NotFoundException('SEO Credential record not found');
    try {
      return await this.vaultService.getSecret(
        tenantId,
        `seo_credential_password_${id}`,
        'CLIENT_SECRET',
      );
    } catch (err) {
      return '';
    }
  }

  async deleteCredential(tenantId: string, id: string) {
    const cred = await this.prisma.sEOCredential.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!cred) throw new NotFoundException('SEO Credential record not found');
    return this.prisma.sEOCredential.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // 3. Monthly Targets
  async createTarget(tenantId: string, dto: CreateSEOMonthlyTargetDto) {
    // Check if target already exists for this executive, campaign, month and activity type
    const existing = await this.prisma.sEOMonthlyTarget.findFirst({
      where: {
        tenantId,
        executiveId: dto.executiveId,
        seoProjectId: dto.seoProjectId || null,
        month: dto.month,
        activityTypeId: dto.activityTypeId,
        deletedAt: null,
      },
    });
    if (existing) {
      throw new BadRequestException(
        'A monthly target already exists for this category activity',
      );
    }

    return this.prisma.sEOMonthlyTarget.create({
      data: {
        tenantId,
        executiveId: dto.executiveId,
        seoProjectId: dto.seoProjectId || null,
        month: dto.month,
        activityTypeId: dto.activityTypeId,
        targetCount: dto.targetCount,
      },
    });
  }

  async getTargets(
    tenantId: string,
    query: { executiveId?: string; seoProjectId?: string; month?: string },
  ) {
    const whereClause: any = { tenantId, deletedAt: null };
    if (query.executiveId) whereClause.executiveId = query.executiveId;
    if (query.seoProjectId) whereClause.seoProjectId = query.seoProjectId;
    if (query.month) whereClause.month = query.month;

    const targets = await this.prisma.sEOMonthlyTarget.findMany({
      where: whereClause,
      include: {
        executive: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        seoProject: true,
        activityType: true,
      },
      orderBy: { month: 'desc' },
    });

    // Dynamically calculate achievement percentage from approved daily work logs
    const enhancedTargets = await Promise.all(
      targets.map(async (target: any) => {
        const approvedCount = await this.calculateApprovedCount(
          tenantId,
          target.executiveId,
          target.seoProjectId,
          target.month,
          target.activityTypeId,
        );

        const targetCount = target.targetCount || 1;
        const percent = Math.min(
          100,
          Math.round((approvedCount / targetCount) * 100),
        );

        return {
          ...target,
          achievedCount: approvedCount,
          remainingCount: Math.max(0, target.targetCount - approvedCount),
          achievementPercentage: percent,
        };
      }),
    );

    return enhancedTargets;
  }

  private async calculateApprovedCount(
    tenantId: string,
    executiveId: string,
    seoProjectId: string | null,
    monthStr: string, // YYYY-MM
    activityTypeId: string,
  ): Promise<number> {
    const startDate = new Date(`${monthStr}-01`);
    const nextMonth = new Date(startDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const matchWhere: any = {
      tenantId,
      status: 'APPROVED',
      executiveId,
      logDate: {
        gte: startDate,
        lt: nextMonth,
      },
    };

    if (seoProjectId) {
      matchWhere.seoProjectId = seoProjectId;
    }

    const logs = await this.prisma.sEODailyWorkLog.findMany({
      where: matchWhere,
      include: {
        items: {
          where: { activityTypeId },
        },
      },
    });

    let sum = 0;
    for (const log of logs) {
      for (const item of log.items) {
        sum += item.count || 1;
      }
    }
    return sum;
  }

  async updateTarget(
    tenantId: string,
    id: string,
    dto: UpdateSEOMonthlyTargetDto,
  ) {
    return this.prisma.sEOMonthlyTarget.update({
      where: { id },
      data: { targetCount: dto.targetCount },
    });
  }

  // 4. Tasks & Timelines
  async createTask(tenantId: string, creatorId: string, dto: CreateSEOTaskDto) {
    const task = await this.prisma.sEOTask.create({
      data: {
        tenantId,
        title: dto.title,
        description: dto.description,
        seoProjectId: dto.seoProjectId,
        assignedExecutiveId: dto.assignedExecutiveId,
        dueDate: new Date(dto.dueDate),
        priority: dto.priority || 'medium',
        status: 'pending',
        activityTypeId: dto.activityTypeId || null,
        createdById: creatorId,
      },
    });

    await this.prisma.sEOTaskTimeline.create({
      data: {
        tenantId,
        taskId: task.id,
        userId: creatorId,
        action: 'CREATED',
        remarks: 'Task launched and assigned to executive.',
      },
    });

    return task;
  }

  async getTasks(
    tenantId: string,
    query: {
      assignedExecutiveId?: string;
      seoProjectId?: string;
      status?: string;
    },
  ) {
    const whereClause: any = { tenantId, deletedAt: null };
    if (query.assignedExecutiveId)
      whereClause.assignedExecutiveId = query.assignedExecutiveId;
    if (query.seoProjectId) whereClause.seoProjectId = query.seoProjectId;
    if (query.status) whereClause.status = query.status;

    return this.prisma.sEOTask.findMany({
      where: whereClause,
      include: {
        seoProject: true,
        assignedExecutive: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        activityType: true,
        timelines: { orderBy: { eventTime: 'asc' } },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async getTask(tenantId: string, id: string) {
    const task = await this.prisma.sEOTask.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        seoProject: true,
        assignedExecutive: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        activityType: true,
        timelines: { orderBy: { eventTime: 'asc' } },
      },
    });
    if (!task) throw new NotFoundException('SEO Task not found');
    return task;
  }

  async updateTask(
    tenantId: string,
    userId: string,
    userName: string,
    id: string,
    dto: UpdateSEOTaskDto,
  ) {
    const task = await this.getTask(tenantId, id);
    const updated = await this.prisma.sEOTask.update({
      where: { id },
      data: {
        title: dto.title !== undefined ? dto.title : undefined,
        description:
          dto.description !== undefined ? dto.description : undefined,
        status: dto.status !== undefined ? dto.status : undefined,
        dueDate: dto.dueDate !== undefined ? new Date(dto.dueDate) : undefined,
        priority: dto.priority !== undefined ? dto.priority : undefined,
        activityTypeId:
          dto.activityTypeId !== undefined ? dto.activityTypeId : undefined,
      },
    });

    await this.prisma.sEOTaskTimeline.create({
      data: {
        tenantId,
        taskId: id,
        userId,
        userName,
        action: 'UPDATED',
        remarks: `Task details modified. Status: ${updated.status}`,
      },
    });

    return updated;
  }

  async reviewTask(
    tenantId: string,
    userId: string,
    userName: string,
    id: string,
    dto: ReviewSEOTaskDto,
  ) {
    await this.getTask(tenantId, id);
    const updated = await this.prisma.sEOTask.update({
      where: { id },
      data: {
        reviewStatus: dto.reviewStatus,
        managerRemarks: dto.managerRemarks || '',
        status: dto.reviewStatus === 'approved' ? 'completed' : 'pending',
      },
    });

    await this.prisma.sEOTaskTimeline.create({
      data: {
        tenantId,
        taskId: id,
        userId,
        userName,
        action: dto.reviewStatus === 'approved' ? 'APPROVED' : 'REJECTED',
        remarks:
          dto.managerRemarks || `Task review completed: ${dto.reviewStatus}`,
      },
    });

    return updated;
  }

  // 5. Daily Work Logs
  async createWorkLog(
    tenantId: string,
    executiveId: string,
    dto: CreateSEODailyWorkLogDto,
  ) {
    const logDate = new Date(dto.logDate);
    const totalCount = dto.items.reduce(
      (sum, item) => sum + (item.count || 1),
      0,
    );

    // Ensure only one log per executive, campaign, and date
    const existing = await this.prisma.sEODailyWorkLog.findFirst({
      where: {
        tenantId,
        executiveId,
        seoProjectId: dto.seoProjectId,
        logDate,
      },
    });
    if (existing) {
      throw new BadRequestException(
        'A work log has already been submitted for this campaign on this date',
      );
    }

    const log = await this.prisma.sEODailyWorkLog.create({
      data: {
        tenantId,
        seoProjectId: dto.seoProjectId,
        logDate,
        executiveId,
        remarks: dto.remarks || '',
        status: dto.isDraft ? 'DRAFT' : 'SUBMITTED',
        totalCount,
        seoTaskId: dto.seoTaskId || null,
        createdById: executiveId,
        submittedAt: dto.isDraft ? null : new Date(),
        items: {
          create: dto.items.map((item) => ({
            tenantId,
            activityTypeId: item.activityTypeId,
            count: item.count || 1,
            keyword: item.keyword || null,
            targetUrl: item.targetUrl || null,
            submissionUrl: item.submissionUrl || null,
            domainAuthority: item.domainAuthority || null,
            spamScore: item.spamScore || null,
            timeSpentMinutes: item.timeSpentMinutes || null,
            username: item.username || null,
            password: item.password || null,
            anchorText: item.anchorText || null,
            remarks: item.remarks || null,
            status: dto.isDraft ? 'DRAFT' : 'SUBMITTED',
          })),
        },
      },
      include: { items: true },
    });

    return log;
  }

  async getWorkLogs(
    tenantId: string,
    query: { executiveId?: string; seoProjectId?: string; status?: string },
  ) {
    const whereClause: any = { tenantId, deletedAt: null };
    if (query.executiveId) whereClause.executiveId = query.executiveId;
    if (query.seoProjectId) whereClause.seoProjectId = query.seoProjectId;
    if (query.status) whereClause.status = query.status;

    return this.prisma.sEODailyWorkLog.findMany({
      where: whereClause,
      include: {
        executive: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        seoProject: true,
        items: { include: { activityType: true } },
        proofs: true,
      },
      orderBy: { logDate: 'desc' },
    });
  }

  async getWorkLog(tenantId: string, id: string) {
    const log = await this.prisma.sEODailyWorkLog.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        executive: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        seoProject: true,
        items: { include: { activityType: true } },
        proofs: true,
      },
    });
    if (!log) throw new NotFoundException('SEO Daily Work Log not found');
    return log;
  }

  async updateWorkLog(
    tenantId: string,
    id: string,
    dto: UpdateSEODailyWorkLogDto,
  ) {
    const log = await this.prisma.sEODailyWorkLog.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!log) throw new NotFoundException('SEO Daily Work Log not found');
    if (log.status !== 'DRAFT' && log.status !== 'REVISION_REQUIRED') {
      throw new BadRequestException(
        'Only DRAFT or REVISION_REQUIRED work logs can be updated',
      );
    }

    const isSubmitted = dto.isDraft === false;
    const nextStatus = isSubmitted ? 'SUBMITTED' : log.status;

    // Delete existing items and recreate
    if (dto.items) {
      await this.prisma.sEODailyWorkLogItem.deleteMany({
        where: { workLogId: id },
      });
    }

    const totalCount = dto.items
      ? dto.items.reduce((sum, item) => sum + (item.count || 1), 0)
      : log.totalCount;

    return this.prisma.sEODailyWorkLog.update({
      where: { id },
      data: {
        remarks: dto.remarks !== undefined ? dto.remarks : undefined,
        status: nextStatus,
        totalCount,
        seoTaskId: dto.seoTaskId !== undefined ? dto.seoTaskId : undefined,
        submittedAt: isSubmitted ? new Date() : undefined,
        items: dto.items
          ? {
              create: dto.items.map((item) => ({
                tenantId,
                activityTypeId: item.activityTypeId,
                count: item.count || 1,
                keyword: item.keyword || null,
                targetUrl: item.targetUrl || null,
                submissionUrl: item.submissionUrl || null,
                domainAuthority: item.domainAuthority || null,
                spamScore: item.spamScore || null,
                timeSpentMinutes: item.timeSpentMinutes || null,
                username: item.username || null,
                password: item.password || null,
                anchorText: item.anchorText || null,
                remarks: item.remarks || null,
                status: nextStatus,
              })),
            }
          : undefined,
      },
      include: { items: true },
    });
  }

  async reviewWorkLog(
    tenantId: string,
    managerId: string,
    id: string,
    dto: ReviewSEODailyWorkLogDto,
  ) {
    const log = await this.prisma.sEODailyWorkLog.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!log) throw new NotFoundException('Daily Work Log not found');

    const updateData: any = {
      status: dto.status,
      remarksByManager: dto.remarksByManager || '',
      updatedById: managerId,
    };

    if (dto.status === 'APPROVED') {
      updateData.approvedById = managerId;
      updateData.approvedAt = new Date();
    } else if (dto.status === 'REJECTED') {
      updateData.rejectedById = managerId;
      updateData.rejectedAt = new Date();
    }

    const updated = await this.prisma.sEODailyWorkLog.update({
      where: { id },
      data: updateData,
    });

    // Update log items status
    await this.prisma.sEODailyWorkLogItem.updateMany({
      where: { workLogId: id },
      data: { status: dto.status },
    });

    return updated;
  }

  // Upload Work Proof Screenshots
  async uploadWorkProof(
    tenantId: string,
    workLogId: string,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
  ) {
    const fileKey = await this.storageProvider.uploadFile(
      fileBuffer,
      fileName,
      mimeType,
      `seo/proofs/${workLogId}`,
    );

    return this.prisma.sEODailyWorkProof.create({
      data: {
        tenantId,
        workLogId,
        proofFileUrl: fileKey,
        fileName,
      },
    });
  }
}
