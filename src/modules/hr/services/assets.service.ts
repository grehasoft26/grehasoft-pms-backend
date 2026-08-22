import { Injectable, NotFoundException } from '@nestjs/common';
import { HrRepository } from '../repositories/hr.repository';
import { CreateAssetAssignmentDto, ReturnAssetDto } from '../dto/assets.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';
import { AssetStatus, Prisma } from '@prisma/client';

@Injectable()
export class AssetsService {
  constructor(
    private readonly repository: HrRepository,
    private readonly logger: LoggerService,
  ) {}

  async assignAsset(
    employeeProfileId: string,
    dto: CreateAssetAssignmentDto,
    context: RequestContext,
  ) {
    const profile = await this.repository.findProfileById(employeeProfileId);
    if (!profile) throw new NotFoundException('Employee profile not found');

    const assignment = await this.repository.createAssetAssignment({
      employeeProfileId,
      assetType: dto.assetType,
      modelName: dto.modelName || '',
      serialNumber: dto.serialNumber,
      warrantyMonths: dto.warrantyMonths ?? 12,
      purchaseDate: new Date(dto.purchaseDate),
      vendor: dto.vendor,
      assignedDate: new Date(dto.assignedDate),
      status: AssetStatus.ASSIGNED,
    });

    this.logger.audit(
      context.userId,
      'Assign Asset to Employee',
      'assetAssignment',
      assignment,
      { after: assignment },
    );
    return assignment;
  }

  async updateAssetStatus(
    id: string,
    dto: ReturnAssetDto,
    context: RequestContext,
  ) {
    const before = await this.repository.findAssetAssignmentById(id);
    if (!before) throw new NotFoundException('Asset assignment not found');

    const updateData: Prisma.AssetAssignmentUncheckedUpdateInput = {
      status: dto.status,
    };
    if (dto.status === AssetStatus.RETURNED) {
      updateData.returnedDate = dto.returnedDate
        ? new Date(dto.returnedDate)
        : new Date();
    }

    const updated = await this.repository.updateAssetAssignment(id, updateData);
    this.logger.audit(
      context.userId,
      `Update Asset Status to ${dto.status}`,
      'assetAssignment',
      updated,
      { before, after: updated },
    );
    return updated;
  }

  async getAssetAssignments(employeeProfileId: string) {
    return this.repository.findAssetAssignments(employeeProfileId);
  }

  async getAllAssetAssignments() {
    return this.repository.findManyAssetAssignments();
  }

  async getAssetAssignmentById(id: string) {
    const asset = await this.repository.findAssetAssignmentById(id);
    if (!asset) throw new NotFoundException('Asset assignment not found');
    return asset;
  }
}
