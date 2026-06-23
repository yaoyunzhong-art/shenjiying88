import { Module } from '@nestjs/common'
import { CashierModule } from '../cashier/cashier.module'
import { LoyaltyModule } from '../loyalty/loyalty.module'
import { PrismaModule } from '../../prisma/prisma.module'
import { TransactionsController } from './transactions.controller'
import { TransactionsService } from './transactions.service'

@Module({
  imports: [CashierModule, LoyaltyModule, PrismaModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService]
})
export class TransactionsModule {}
