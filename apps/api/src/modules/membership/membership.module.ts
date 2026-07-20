/**
 * membership.module.ts — 会员管理模块
 */
import { Module } from '@nestjs/common'
import { MembershipController } from './membership.controller'
import { MembershipService } from './membership.service'

@Module({
  controllers: [MembershipController],
  providers: [MembershipService],
  exports: [MembershipService],
})
export class MembershipModule {}
