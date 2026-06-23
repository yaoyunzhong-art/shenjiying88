import { Module } from '@nestjs/common'
import { LoyaltyModule } from '../loyalty/loyalty.module'
import { MemberModule } from '../member/member.module'
import { CashierController } from './cashier.controller'
import { CashierService } from './cashier.service'

@Module({
  imports: [MemberModule, LoyaltyModule],
  controllers: [CashierController],
  providers: [CashierService],
  exports: [CashierService]
})
export class CashierModule {}
