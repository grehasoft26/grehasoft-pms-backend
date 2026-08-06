import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ProjectsModule } from '../projects/projects.module';

import { TasksController } from './tasks/tasks.controller';
import { TasksService } from './tasks/tasks.service';
import { TasksRepository } from './tasks/tasks.repository';

import { SprintsController } from './sprints/sprints.controller';
import { SprintsService } from './sprints/sprints.service';
import { SprintsRepository } from './sprints/sprints.repository';

import { TaskConfigsController } from './task-configs/task-configs.controller';
import { TaskConfigsService } from './task-configs/task-configs.service';
import { TaskConfigsRepository } from './task-configs/task-configs.repository';

import { TaskInteractionsController } from './task-interactions/task-interactions.controller';
import { TaskInteractionsService } from './task-interactions/task-interactions.service';
import { TaskInteractionsRepository } from './task-interactions/task-interactions.repository';

import { TaskDashboardController } from './task-dashboard/task-dashboard.controller';
import { TaskDashboardService } from './task-dashboard/task-dashboard.service';

@Module({
  imports: [
    AuthModule,
    ProjectsModule,
  ],
  controllers: [
    TasksController,
    SprintsController,
    TaskConfigsController,
    TaskInteractionsController,
    TaskDashboardController,
  ],
  providers: [
    TasksService,
    TasksRepository,
    SprintsService,
    SprintsRepository,
    TaskConfigsService,
    TaskConfigsRepository,
    TaskInteractionsService,
    TaskInteractionsRepository,
    TaskDashboardService,
  ],
  exports: [
    TasksService,
    SprintsService,
    TaskConfigsService,
    TaskInteractionsService,
    TaskDashboardService,
  ],
})
export class TasksModule {}
