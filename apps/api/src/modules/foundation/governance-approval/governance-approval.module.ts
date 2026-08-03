import { Module } from '@nestjs/common'
import { PrismaModule } from '../../../prisma/prisma.module'
import { AuditModule } from '../../audit/audit.module'
import { GovernanceApprovalController } from './governance-approval.controller'
import { GovernanceApprovalService } from './governance-approval.service'

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [GovernanceApprovalController],
  providers: [GovernanceApprovalService],
  exports: [GovernanceApprovalService]
})
export class GovernanceApprovalModule {}
