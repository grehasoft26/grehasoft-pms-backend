import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { LoggerService } from '../../../shared/logger/logger.service';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { CreateUserDto, UpdateUserDto } from './dto/users.dto';
import { UserStatus } from '@prisma/client';

import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    private readonly repository: UsersRepository,
    private readonly logger: LoggerService,
  ) {}

  async create(dto: CreateUserDto, context: RequestContext) {
    const exists = await this.repository.findByEmail(dto.email);
    if (exists) {
      throw new ConflictException(
        `User with email "${dto.email}" already exists`,
      );
    }

    const { preferences, password, joiningDate, ...userData } = dto;

    const hashedPassword = password
      ? bcrypt.hashSync(password, 10)
      : bcrypt.hashSync('hashed_default_pass', 10);

    const payload = {
      ...userData,
      departmentId: userData.departmentId === '' ? null : userData.departmentId,
      designationId:
        userData.designationId === '' ? null : userData.designationId,
      password: hashedPassword,
      joiningDate: joiningDate ? new Date(joiningDate) : null,
      createdBy: context.userId,
    };

    const user = await this.repository.create(payload, preferences || {});

    this.logger.audit(context.userId, 'Create User', 'user', user, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      after: user,
    });
    return user;
  }

  async getMany() {
    return this.repository.findMany();
  }

  async getById(id: string) {
    const user = await this.repository.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto, context: RequestContext) {
    const user = await this.getById(id);

    const { preferences, joiningDate, ...userData } = dto;

    const updatePayload = {
      ...userData,
      departmentId: userData.departmentId === '' ? null : userData.departmentId,
      designationId:
        userData.designationId === '' ? null : userData.designationId,
      joiningDate: joiningDate ? new Date(joiningDate) : undefined,
      updatedBy: context.userId,
      version: { increment: 1 },
    };

    const updatedUser = await this.repository.update(
      id,
      updatePayload,
      preferences,
    );

    this.logger.audit(context.userId, 'Update User', 'user', updatedUser, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before: user,
      after: updatedUser,
    });
    return updatedUser;
  }

  async delete(id: string, context: RequestContext) {
    const user = await this.getById(id);
    await this.repository.delete(id, context.userId);
    this.logger.audit(
      context.userId,
      'Delete User',
      'user',
      { id },
      {
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
        before: user,
      },
    );
  }

  async restore(id: string, context: RequestContext) {
    const restored = await this.repository.restore(id);
    this.logger.audit(context.userId, 'Restore User', 'user', restored, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      after: restored,
    });
    return restored;
  }

  async setStatus(id: string, status: UserStatus, context: RequestContext) {
    const user = await this.getById(id);
    const updated = await this.repository.update(id, {
      status,
      updatedBy: context.userId,
      version: { increment: 1 },
    });

    this.logger.audit(
      context.userId,
      `Set User Status: ${status}`,
      'user',
      updated,
      {
        ip: context.ip,
        userAgent: context.userAgent,
        correlationId: context.correlationId,
        before: user,
        after: updated,
      },
    );
    return updated;
  }

  async uploadAvatar(
    id: string,
    fileBuffer: Buffer,
    fileName: string,
    context: RequestContext,
  ) {
    const user = await this.getById(id);

    // Stub avatar upload interface
    const avatarUrl = `/uploads/avatars/${id}_${fileName}`;
    this.logger.log(
      `Uploaded avatar for user ${id} to ${avatarUrl}`,
      'UsersService',
    );

    const updated = await this.repository.update(id, {
      avatarUrl,
      updatedBy: context.userId,
      version: { increment: 1 },
    });

    this.logger.audit(context.userId, 'Upload Avatar', 'user', updated, {
      ip: context.ip,
      userAgent: context.userAgent,
      correlationId: context.correlationId,
      before: user,
      after: updated,
    });
    return updated;
  }
}
