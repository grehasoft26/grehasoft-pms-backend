import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClientsController } from './clients/clients.controller';
import { ClientsService } from './clients/clients.service';
import { ClientsRepository } from './clients/clients.repository';

import { ClientCategoriesController } from './client-categories/client-categories.controller';
import { ClientCategoriesService } from './client-categories/client-categories.service';
import { ClientCategoriesRepository } from './client-categories/client-categories.repository';

import { ClientContactsController } from './client-contacts/client-contacts.controller';
import { ClientContactsService } from './client-contacts/client-contacts.service';
import { ClientContactsRepository } from './client-contacts/client-contacts.repository';

import { ClientAddressesController } from './client-addresses/client-addresses.controller';
import { ClientAddressesService } from './client-addresses/client-addresses.service';
import { ClientAddressesRepository } from './client-addresses/client-addresses.repository';

import { ClientDocumentsController } from './client-documents/client-documents.controller';
import { ClientDocumentsService } from './client-documents/client-documents.service';
import { ClientDocumentsRepository } from './client-documents/client-documents.repository';

import { ClientContractsController } from './client-contracts/client-contracts.controller';
import { ClientContractsService } from './client-contracts/client-contracts.service';
import { ClientContractsRepository } from './client-contracts/client-contracts.repository';

import { ClientNotesController } from './client-notes/client-notes.controller';
import { ClientNotesService } from './client-notes/client-notes.service';
import { ClientNotesRepository } from './client-notes/client-notes.repository';

import { ClientTagsService } from './client-tags/client-tags.service';
import { ClientTagsRepository } from './client-tags/client-tags.repository';

import { ClientTimelinesService } from './client-timelines/client-timelines.service';
import { ClientTimelinesRepository } from './client-timelines/client-timelines.repository';

@Module({
  imports: [AuthModule],
  controllers: [
    ClientsController,
    ClientCategoriesController,
    ClientContactsController,
    ClientAddressesController,
    ClientDocumentsController,
    ClientContractsController,
    ClientNotesController,
  ],
  providers: [
    ClientsService,
    ClientsRepository,
    ClientCategoriesService,
    ClientCategoriesRepository,
    ClientContactsService,
    ClientContactsRepository,
    ClientAddressesService,
    ClientAddressesRepository,
    ClientDocumentsService,
    ClientDocumentsRepository,
    ClientContractsService,
    ClientContractsRepository,
    ClientNotesService,
    ClientNotesRepository,
    ClientTagsService,
    ClientTagsRepository,
    ClientTimelinesService,
    ClientTimelinesRepository,
  ],
  exports: [
    ClientsService,
    ClientCategoriesService,
    ClientContactsService,
    ClientAddressesService,
    ClientDocumentsService,
    ClientContractsService,
    ClientNotesService,
    ClientTagsService,
    ClientTimelinesService,
  ],
})
export class ClientsModule {}
