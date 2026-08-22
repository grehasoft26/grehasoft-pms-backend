import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClientsModule } from '../clients/clients.module';
import { StorageModule } from '../../shared/storage/storage.module';

import { ProjectsController } from './projects/projects.controller';
import { ProjectsService } from './projects/projects.service';
import { ProjectsRepository } from './projects/projects.repository';

import { ProjectTemplatesController } from './project-templates/project-templates.controller';
import { ProjectTemplatesService } from './project-templates/project-templates.service';
import { ProjectTemplatesRepository } from './project-templates/project-templates.repository';

import { ProjectCategoriesController } from './project-categories/project-categories.controller';
import { ProjectCategoriesService } from './project-categories/project-categories.service';
import { ProjectCategoriesRepository } from './project-categories/project-categories.repository';

import { ProjectPhasesController } from './project-phases/project-phases.controller';
import { ProjectPhasesService } from './project-phases/project-phases.service';
import { ProjectPhasesRepository } from './project-phases/project-phases.repository';

import { ProjectMilestonesController } from './project-milestones/project-milestones.controller';
import { ProjectMilestonesService } from './project-milestones/project-milestones.service';
import { ProjectMilestonesRepository } from './project-milestones/project-milestones.repository';

import { ProjectMembersController } from './project-members/project-members.controller';
import { ProjectMembersService } from './project-members/project-members.service';
import { ProjectMembersRepository } from './project-members/project-members.repository';

import { ProjectResourcesController } from './project-resources/project-resources.controller';
import { ProjectResourcesService } from './project-resources/project-resources.service';
import { ProjectResourcesRepository } from './project-resources/project-resources.repository';

import { ProjectRisksController } from './project-risks/project-risks.controller';
import { ProjectRisksService } from './project-risks/project-risks.service';
import { ProjectRisksRepository } from './project-risks/project-risks.repository';

import { ProjectIssuesController } from './project-issues/project-issues.controller';
import { ProjectIssuesService } from './project-issues/project-issues.service';
import { ProjectIssuesRepository } from './project-issues/project-issues.repository';

import { ProjectDocumentsController } from './project-documents/project-documents.controller';
import { ProjectDocumentsService } from './project-documents/project-documents.service';
import { ProjectDocumentsRepository } from './project-documents/project-documents.repository';

import { ProjectDashboardController } from './project-dashboard/project-dashboard.controller';
import { ProjectDashboardService } from './project-dashboard/project-dashboard.service';

@Module({
  imports: [AuthModule, ClientsModule, StorageModule],
  controllers: [
    ProjectsController,
    ProjectTemplatesController,
    ProjectCategoriesController,
    ProjectPhasesController,
    ProjectMilestonesController,
    ProjectMembersController,
    ProjectResourcesController,
    ProjectRisksController,
    ProjectIssuesController,
    ProjectDocumentsController,
    ProjectDashboardController,
  ],
  providers: [
    ProjectsService,
    ProjectsRepository,
    ProjectTemplatesService,
    ProjectTemplatesRepository,
    ProjectCategoriesService,
    ProjectCategoriesRepository,
    ProjectPhasesService,
    ProjectPhasesRepository,
    ProjectMilestonesService,
    ProjectMilestonesRepository,
    ProjectMembersService,
    ProjectMembersRepository,
    ProjectResourcesService,
    ProjectResourcesRepository,
    ProjectRisksService,
    ProjectRisksRepository,
    ProjectIssuesService,
    ProjectIssuesRepository,
    ProjectDocumentsService,
    ProjectDocumentsRepository,
    ProjectDashboardService,
  ],
  exports: [
    ProjectsService,
    ProjectTemplatesService,
    ProjectCategoriesService,
    ProjectPhasesService,
    ProjectMilestonesService,
    ProjectMembersService,
    ProjectResourcesService,
    ProjectRisksService,
    ProjectIssuesService,
    ProjectDocumentsService,
    ProjectDashboardService,
  ],
})
export class ProjectsModule {}
