import { Module } from '@nestjs/common'
import { PrismaModule } from '../../../prisma/prisma.module'
import { GovernanceApprovalController } from './governance-approval.controller'

@Module({
  imports: [PrismaModule],
  controllers: [GovernanceApprovalController]
})
export class GovernanceApprovalModule {}
