/**
 * crm.module.ts — CRM客户关系管理 Module
 */
import { Module } from '@nestjs/common'
import { CrmService } from './crm.service'

@Module({
  providers: [CrmService],
  exports: [CrmService],
})
export class CrmModule {}
