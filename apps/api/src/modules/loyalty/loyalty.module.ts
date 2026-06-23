import { Module } from '@nestjs/common'
import { MemberModule } from '../member/member.module'
import { LoyaltyController } from './loyalty.controller'
import { LoyaltyService } from './loyalty.service'

@Module({
  imports: [MemberModule],
  controllers: [LoyaltyController],
  providers: [LoyaltyService],
  exports: [LoyaltyService]
})
export class LoyaltyModule {}
