/**
 * 薪资/薪酬管理 - Module (V23)
 */

import { Module, Global } from '@nestjs/common'
import { SalaryController } from './salary.controller'
import { SalaryService } from './salary.service'

@Global()
@Module({
  controllers: [SalaryController],
  providers: [SalaryService],
  exports: [SalaryService],
})
export class SalaryModule {}
