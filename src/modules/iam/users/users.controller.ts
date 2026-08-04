import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { RequestContext } from '../../../common/interfaces/request-context.interface';
import { SuccessResponseDto } from '../../../common/dto/api-response.dto';
import { CreateUserDto, UpdateUserDto } from './dto/users.dto';
import { UserStatus } from '@prisma/client';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  private getContext(req: Request): RequestContext {
    return {
      userId: (req.headers['x-user-id'] as string) || 'system',
      ip: req.ip || '',
      userAgent: req.get('user-agent') || '',
      correlationId: (req.headers['x-correlation-id'] as string) || '',
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user with default preferences' })
  @ApiResponse({ type: SuccessResponseDto })
  async create(@Body() dto: CreateUserDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.usersService.create(dto, context);
    return { message: 'User created successfully', data };
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ type: SuccessResponseDto })
  async getMany() {
    const data = await this.usersService.getMany();
    return { message: 'Users retrieved successfully', data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific user profile with preferences and relationships' })
  @ApiResponse({ type: SuccessResponseDto })
  async getById(@Param('id') id: string) {
    const data = await this.usersService.getById(id);
    return { message: 'User retrieved successfully', data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user profile details and preferences' })
  @ApiResponse({ type: SuccessResponseDto })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.usersService.update(id, dto, context);
    return { message: 'User updated successfully', data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a user' })
  @ApiResponse({ type: SuccessResponseDto })
  async delete(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    await this.usersService.delete(id, context);
    return { message: 'User soft-deleted successfully' };
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted user' })
  @ApiResponse({ type: SuccessResponseDto })
  async restore(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.usersService.restore(id, context);
    return { message: 'User restored successfully', data };
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate a user profile' })
  @ApiResponse({ type: SuccessResponseDto })
  async activate(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.usersService.setStatus(id, UserStatus.ACTIVE, context);
    return { message: 'User activated successfully', data };
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate a user profile' })
  @ApiResponse({ type: SuccessResponseDto })
  async deactivate(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.usersService.setStatus(id, UserStatus.INACTIVE, context);
    return { message: 'User deactivated successfully', data };
  }

  @Patch(':id/lock')
  @ApiOperation({ summary: 'Lock a user profile' })
  @ApiResponse({ type: SuccessResponseDto })
  async lock(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.usersService.setStatus(id, UserStatus.LOCKED, context);
    return { message: 'User profile locked successfully', data };
  }

  @Patch(':id/suspend')
  @ApiOperation({ summary: 'Suspend a user profile' })
  @ApiResponse({ type: SuccessResponseDto })
  async suspend(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.usersService.setStatus(id, UserStatus.SUSPENDED, context);
    return { message: 'User profile suspended successfully', data };
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive a user profile' })
  @ApiResponse({ type: SuccessResponseDto })
  async archive(@Param('id') id: string, @Req() req: Request) {
    const context = this.getContext(req);
    const data = await this.usersService.setStatus(id, UserStatus.ARCHIVED, context);
    return { message: 'User profile archived successfully', data };
  }

  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload avatar for a user (Multipart form upload)' })
  @ApiResponse({ type: SuccessResponseDto })
  async uploadAvatar(
    @Param('id') id: string,
    @UploadedFile() file: any,
    @Req() req: Request
  ) {
    const context = this.getContext(req);
    const fileBuffer = file?.buffer || Buffer.alloc(0);
    const fileName = file?.originalname || 'avatar.png';
    const data = await this.usersService.uploadAvatar(id, fileBuffer, fileName, context);
    return { message: 'Avatar uploaded successfully', data };
  }
}
