import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectMembersRepository } from './project-members.repository';
import { AssignProjectMemberDto } from './dto/project-members.dto';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { LoggerService } from '../../../shared/logger/logger.service';

@Injectable()
export class ProjectMembersService {
  constructor(
    private readonly repository: ProjectMembersRepository,
    private readonly logger: LoggerService,
  ) {}

  async assign(dto: AssignProjectMemberDto, context: RequestContext) {
    const member = await this.repository.assign({
      projectId: dto.projectId,
      userId: dto.userId,
      role: dto.role,
    });

    // Write project timeline
    await this.repository.prisma.projectTimeline.create({
      data: {
        projectId: dto.projectId,
        event: 'MEMBER_ADDED',
        description: `User "${member.user.firstName} ${member.user.lastName}" assigned as ${dto.role} to the project.`,
        createdBy: context.userId,
      },
    });

    // Audit
    this.logger.audit(
      context.userId,
      'Assign Project Member',
      'projectMember',
      member,
      {
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
        after: member,
      },
    );

    return member;
  }

  async getMany(projectId: string) {
    return this.repository.findMany(projectId);
  }

  async remove(id: string, context: RequestContext) {
    const member = await this.repository.findById(id);
    if (!member) {
      throw new NotFoundException(`Project member with ID ${id} not found`);
    }

    await this.repository.remove(id);

    // Write timeline
    await this.repository.prisma.projectTimeline.create({
      data: {
        projectId: member.projectId,
        event: 'MEMBER_REMOVED',
        description: `User "${member.user.firstName} ${member.user.lastName}" removed from the project.`,
        createdBy: context.userId,
      },
    });

    // Audit
    this.logger.audit(
      context.userId,
      'Remove Project Member',
      'projectMember',
      { id },
      {
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
        before: member,
      },
    );
  }
}
