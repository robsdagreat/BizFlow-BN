import { Module } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { BusinessesController } from './businesses.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { QrService } from './qr.service';

@Module({
  imports: [PrismaModule],
  providers: [BusinessesService, QrService],
  controllers: [BusinessesController],
  exports: [BusinessesService],
})
export class BusinessesModule {}
