import { Module, Global } from '@nestjs/common';
import { LocalStorageService } from './local-storage.service';
import { StorageController } from './storage.controller';
import { STORAGE_SERVICE_TOKEN } from './storage.interface';

@Global()
@Module({
  controllers: [StorageController],
  providers: [
    LocalStorageService,
    {
      provide: STORAGE_SERVICE_TOKEN,
      useClass: LocalStorageService,
    },
  ],
  exports: [LocalStorageService, STORAGE_SERVICE_TOKEN],
})
export class StorageModule {}
