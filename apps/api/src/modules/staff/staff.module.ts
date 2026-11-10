import { Module } from '@nestjs/common';

import { StaffController } from './staff.controller.js';
import { StaffService } from './staff.service.js';

/** Суперадминка (FR-S1–S3), тег контракта `staff`. Сотрудники заводятся командой `staff:create`. */
@Module({
  controllers: [StaffController],
  providers: [StaffService],
})
export class StaffModule {}
