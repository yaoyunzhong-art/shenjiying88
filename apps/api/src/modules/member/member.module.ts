import { Module } from '@nestjs/common';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { MemberApprovalOutcomeRecorder } from './member-approval-recorder';
import { GovernanceApprovalModule } from '../foundation/governance-approval/governance-approval.module';

@Module({
  imports: [GovernanceApprovalModule],
  controllers: [MemberController],
  providers: [MemberService, MemberApprovalOutcomeRecorder],
  exports: [MemberService, MemberApprovalOutcomeRecorder]
})
export class MemberModule {}
