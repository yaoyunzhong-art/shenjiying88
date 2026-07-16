import { Module } from '@nestjs/common'
import { CustomerSatisfactionController } from './customer-satisfaction.controller'
import { CustomerSatisfactionService } from './customer-satisfaction.service'

@Module({
  controllers: [CustomerSatisfactionController],
  providers: [CustomerSatisfactionService],
  exports: [CustomerSatisfactionService],
})
export class CustomerSatisfactionModule {}
