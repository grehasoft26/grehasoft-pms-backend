import { Global, Module } from '@nestjs/common';
import { LocalStorageProvider } from './local-storage.provider';
import { STORAGE_PROVIDER_TOKEN } from './storage.interface';

@Global()
@Module({
  providers: [
    {
      provide: STORAGE_PROVIDER_TOKEN,
      useClass: LocalStorageProvider,
    },
  ],
  exports: [STORAGE_PROVIDER_TOKEN],
})
export class StorageModule {}
