import { Injectable, NotFoundException } from '@nestjs/common';
import { TaskConfigsRepository } from './task-configs.repository';
import { CreateTaskTypeDto, CreateTaskStatusDto, CreateTaskPriorityDto, CreateTaskLabelDto } from './dto/task-configs.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';

@Injectable()
export class TaskConfigsService {
  constructor(
    private readonly repository: TaskConfigsRepository,
    private readonly logger: LoggerService
  ) {}

  // 1. Task Types
  async createType(dto: CreateTaskTypeDto, context: RequestContext) {
    const type = await this.repository.createType({
      ...dto,
      createdBy: context.userId,
    });
    this.logger.audit(context.userId, 'Create Task Type', 'taskType', type, { after: type });
    return type;
  }

  async getTypes() {
    return this.repository.findTypes();
  }

  async getTypeById(id: string) {
    const type = await this.repository.findTypeById(id);
    if (!type) throw new NotFoundException(`Task type with ID ${id} not found`);
    return type;
  }

  // 2. Task Statuses
  async createStatus(dto: CreateTaskStatusDto, context: RequestContext) {
    const status = await this.repository.createStatus({
      ...dto,
      createdBy: context.userId,
    });
    this.logger.audit(context.userId, 'Create Task Status', 'taskStatus', status, { after: status });
    return status;
  }

  async getStatuses() {
    return this.repository.findStatuses();
  }

  async getStatusById(id: string) {
    const status = await this.repository.findStatusById(id);
    if (!status) throw new NotFoundException(`Task status with ID ${id} not found`);
    return status;
  }

  // 3. Task Priorities
  async createPriority(dto: CreateTaskPriorityDto, context: RequestContext) {
    const priority = await this.repository.createPriority({
      ...dto,
      createdBy: context.userId,
    });
    this.logger.audit(context.userId, 'Create Task Priority', 'taskPriority', priority, { after: priority });
    return priority;
  }

  async getPriorities() {
    return this.repository.findPriorities();
  }

  async getPriorityById(id: string) {
    const priority = await this.repository.findPriorityById(id);
    if (!priority) throw new NotFoundException(`Task priority with ID ${id} not found`);
    return priority;
  }

  // 4. Task Labels
  async createLabel(dto: CreateTaskLabelDto) {
    return this.repository.createLabel(dto);
  }

  async getLabels() {
    return this.repository.findLabels();
  }
}
