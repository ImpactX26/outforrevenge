import { Module, Global } from '@nestjs/common';
import { LocalStorageService } from './local-storage.service';
import { CloudinaryStorageService } from './cloudinary-storage.service';
import { StorageController } from './storage.controller';
import { STORAGE_SERVICE_TOKEN } from './storage.interface';

@Global()
@Module({
  controllers: [StorageController],
  providers: [
    LocalStorageService,
    CloudinaryStorageService,
    {
      provide: STORAGE_SERVICE_TOKEN,
      useFactory: (cloudinaryService: CloudinaryStorageService, localService: LocalStorageService) => {
        const provider = (process.env.STORAGE_PROVIDER || '').toLowerCase();
        const hasCloudinary = Boolean(process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_URL);
        if (provider === 'cloudinary' || (provider !== 'local' && hasCloudinary)) {
          return cloudinaryService;
        }
        return localService;
      },
      inject: [CloudinaryStorageService, LocalStorageService],
    },
  ],
  exports: [LocalStorageService, CloudinaryStorageService, STORAGE_SERVICE_TOKEN],
})
export class StorageModule {}
