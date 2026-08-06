import { Injectable, NotFoundException } from '@nestjs/common';
import { SprintsRepository } from './sprints.repository';
import { CreateSprintDto, UpdateSprintDto } from './dto/sprints.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';

@Injectable()
export class SprintsService {
  constructor(
    private readonly repository: SprintsRepository,
    private readonly logger: LoggerService
  ) {}

  async create(dto: CreateSprintDto, context: RequestContext) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    const sprint = await this.repository.create({
      projectId: dto.projectId,
      name: dto.name,
      startDate,
      endDate,
      status: dto.status,
      createdBy: context.userId,
    });

    if (dto.goals && dto.goals.length > 0) {
      for (const goalText of dto.goals) {
        await this.repository.addGoal(sprint.id, goalText);
      }
    }

    this.logger.audit(context.userId, 'Create Sprint', 'sprint', sprint, { after: sprint });
    return this.getById(sprint.id);
  }

  async getMany(projectId: string) {
    return this.repository.findMany(projectId);
  }

  async getById(id: string) {
    const sprint = await this.repository.findById(id);
    if (!sprint) {
      throw new NotFoundException(`Sprint with ID ${id} not found`);
    }
    return sprint;
  }

  async update(id: string, dto: UpdateSprintDto, context: RequestContext) {
    const before = await this.getById(id);

    const startDate = dto.startDate ? new Date(dto.startDate) : undefined;
    const endDate = dto.endDate ? new Date(dto.endDate) : undefined;

    const updated = await this.repository.update(id, {
      name: dto.name,
      startDate,
      endDate,
      status: dto.status,
      updatedBy: context.userId,
    });

    this.logger.audit(context.userId, 'Update Sprint', 'sprint', updated, { before, after: updated });
    return this.getById(id);
  }

  async delete(id: string, context: RequestContext) {
    const before = await this.getById(id);
    await this.repository.delete(id, context.userId);
    this.logger.audit(context.userId, 'Delete Sprint', 'sprint', { id }, { before });
  }

  // Sprint Goals
  async addGoal(sprintId: string, goal: string) {
    await this.getById(sprintId);
    return this.repository.addGoal(sprintId, goal);
  }

  async updateGoal(goalId: string, isAchieved: boolean) {
    return this.repository.updateGoal(goalId, isAchieved);
  }
}
