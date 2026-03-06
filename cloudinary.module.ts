import { Module } from '@nestjs/common';
import { CloudinaryService } from 'cloudinary.services';

@Module({
  providers: [CloudinaryService],
  exports: [CloudinaryService], 
})
export class CloudinaryModule {}