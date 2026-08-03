// employee-marketing.module.ts · WP-11 全员营销与绩效
// 日期: 2026-07-23
// 状态: IMPLEMENTED

import { Module } from '@nestjs/common';
import { EmployeeMarketingController } from './employee-marketing.controller';
import { EmployeeMarketingService } from './employee-marketing.service';

@Module({
  controllers: [EmployeeMarketingController],
  providers: [EmployeeMarketingService],
  exports: [EmployeeMarketingService],
})
export class EmployeeMarketingModule {}
