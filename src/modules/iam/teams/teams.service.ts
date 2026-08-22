import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { TeamsRepository } from './teams.repository';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { CreateTeamDto, UpdateTeamDto } from './dto/teams.dto';
import { Status } from '@prisma/client';

@Injectable()
export class TeamsService {
  constructor(
    private readonly repository: TeamsRepository,
    private readonly logger: LoggerService,
  ) {}

  async create(dto: CreateTeamDto, context: RequestContext) {
    const nameExists = await this.repository.findByName(dto.name);
    if (nameExists) {
      throw new ConflictException(
        `Team with name "${dto.name}" already exists`,
      );
    }

    const codeExists = await this.repository.findByCode(dto.code);
    if (codeExists) {
      throw new ConflictException(
        `Team with code "${dto.code}" already exists`,
      );
    }

    const data = {
      ...dto,
      createdBy: context.userId,
    };

    const team = await this.repository.create(data);
    this.logger.audit(context.userId, 'Create Team', 'team', team, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      after: team,
    });
    return team;
  }

  async getMany() {
    return this.repository.findMany();
  }

  async getById(id: string) {
    const team = await this.repository.findById(id);
    if (!team) throw new NotFoundException('Team not found');
    return team;
  }

  async update(id: string, dto: UpdateTeamDto, context: RequestContext) {
    const team = await this.getById(id);

    if (dto.name && dto.name !== team.name) {
      const exists = await this.repository.findByName(dto.name);
      if (exists) {
        throw new ConflictException(
          `Team with name "${dto.name}" already exists`,
        );
      }
    }

    if (dto.code && dto.code !== team.code) {
      const exists = await this.repository.findByCode(dto.code);
      if (exists) {
        throw new ConflictException(
          `Team with code "${dto.code}" already exists`,
        );
      }
    }

    const updateData = {
      ...dto,
      updatedBy: context.userId,
      version: { increment: 1 },
    };

    const updated = await this.repository.update(id, updateData);

    this.logger.audit(context.userId, 'Update Team', 'team', updated, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before: team,
      after: updated,
    });
    return updated;
  }

  async delete(id: string, context: RequestContext) {
    const team = await this.getById(id);
    await this.repository.delete(id, context.userId);
    this.logger.audit(
      context.userId,
      'Delete Team',
      'team',
      { id },
      {
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
        before: team,
      },
    );
  }

  async restore(id: string, context: RequestContext) {
    const restored = await this.repository.restore(id);
    this.logger.audit(context.userId, 'Restore Team', 'team', restored, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      after: restored,
    });
    return restored;
  }

  async setStatus(id: string, status: Status, context: RequestContext) {
    const team = await this.getById(id);
    const updated = await this.repository.update(id, {
      status,
      updatedBy: context.userId,
      version: { increment: 1 },
    });

    this.logger.audit(
      context.userId,
      `${status === Status.ACTIVE ? 'Activate' : 'Deactivate'} Team`,
      'team',
      updated,
      {
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
        before: team,
        after: updated,
      },
    );
    return updated;
  }

  async assignMembers(
    id: string,
    members: { userId: string; roleInTeam?: string }[],
    context: RequestContext,
  ) {
    const team = await this.getById(id);
    const updated = await this.repository.assignMembers(id, members);
    if (!updated) {
      throw new NotFoundException('Team not found after assigning members');
    }

    this.logger.audit(context.userId, 'Assign Team Members', 'team', updated, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before: team,
      after: updated,
    });
    return updated;
  }
}
