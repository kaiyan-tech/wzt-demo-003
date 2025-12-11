import { Module } from '@nestjs/common';
import { MigrationController } from './migration.controller';
import { MigrationService } from './migration.service';
import { PrismaMigrationRunner } from './prisma-migration.runner';

@Module({
  controllers: [MigrationController],
  providers: [MigrationService, PrismaMigrationRunner],
})
export class MigrationModule {}
