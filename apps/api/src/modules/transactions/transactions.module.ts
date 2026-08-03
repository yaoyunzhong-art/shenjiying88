import { Module } from '@nestjs/common'
import { CashierModule } from '../cashier/cashier.module'
import { FinanceModule } from '../finance/finance.module'
import { LoyaltyModule } from '../loyalty/loyalty.module'
import { MemberModule } from '../member/member.module'
import { PrismaModule } from '../../prisma/prisma.module'
import { TransactionsController } from './transactions.controller'
import { TransactionsService } from './transactions.service'

@Module({
  imports: [CashierModule, FinanceModule, LoyaltyModule, MemberModule, PrismaModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService]
})
export class TransactionsModule {}
