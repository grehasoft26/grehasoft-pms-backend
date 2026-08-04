import { Module } from '@nestjs/common';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';
import { UsersRepository } from './users/users.repository';
import { RolesController } from './roles/roles.controller';
import { RolesService } from './roles/roles.service';
import { RolesRepository } from './roles/roles.repository';
import { PermissionsController } from './permissions/permissions.controller';
import { PermissionsService } from './permissions/permissions.service';
import { PermissionsRepository } from './permissions/permissions.repository';
import { DepartmentsController } from './departments/departments.controller';
import { DepartmentsService } from './departments/departments.service';
import { DepartmentsRepository } from './departments/departments.repository';
import { TeamsController } from './teams/teams.controller';
import { TeamsService } from './teams/teams.service';
import { TeamsRepository } from './teams/teams.repository';
import { DesignationsController } from './designations/designations.controller';
import { DesignationsService } from './designations/designations.service';
import { DesignationsRepository } from './designations/designations.repository';

@Module({
  controllers: [
    UsersController,
    RolesController,
    PermissionsController,
    DepartmentsController,
    TeamsController,
    DesignationsController,
  ],
  providers: [
    UsersService,
    UsersRepository,
    RolesService,
    RolesRepository,
    PermissionsService,
    PermissionsRepository,
    DepartmentsService,
    DepartmentsRepository,
    TeamsService,
    TeamsRepository,
    DesignationsService,
    DesignationsRepository,
  ],
  exports: [
    UsersService,
    RolesService,
    PermissionsService,
    DepartmentsService,
    TeamsService,
    DesignationsService,
  ],
})
export class IamModule {}
