import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import {
  GovernanceApprovalCancelInput,
  GovernanceApprovalDecisionInput,
  GovernanceApprovalExecutionFailureInput,
  GovernanceApprovalExecutionInput,
  GovernanceApprovalQueryInput,
  GovernanceApprovalResubmitInput,
  GovernanceApprovalSnapshot,
  MaterializeGovernanceApprovalInput,
  cancelGovernanceApproval,
  decideGovernanceApproval,
  getGovernanceApprovalByTicket,
  listGovernanceApprovals,
  markGovernanceApprovalExecuted,
  markGovernanceApprovalExecutionFailed,
  materializeGovernanceApproval,
  resubmitGovernanceApproval,
  summarizeGovernanceApprovals
} from './governance-approval'

@Controller('foundation/governance-approval')
@UseGuards(TenantGuard)
export class GovernanceApprovalController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async listApprovals(@Query() query: GovernanceApprovalQueryInput): Promise<GovernanceApprovalSnapshot[]> {
    return listGovernanceApprovals(this.prisma, query)
  }

  @Get('summarize')
  async summarizeApprovals(@Query() query: GovernanceApprovalQueryInput): Promise<ReturnType<typeof summarizeGovernanceApprovals>> {
    return summarizeGovernanceApprovals(this.prisma, query)
  }

  @Get(':ticket')
  async getApproval(@Param('ticket') ticket: string): Promise<GovernanceApprovalSnapshot> {
    return getGovernanceApprovalByTicket(this.prisma, ticket)
  }

  @Post()
  async materializeApproval(@Body() input: MaterializeGovernanceApprovalInput): Promise<GovernanceApprovalSnapshot> {
    return materializeGovernanceApproval(this.prisma, input)
  }

  @Post('decide')
  async decideApproval(@Body() input: GovernanceApprovalDecisionInput): Promise<GovernanceApprovalSnapshot> {
    return decideGovernanceApproval(this.prisma, input)
  }

  @Post('cancel')
  async cancelApproval(@Body() input: GovernanceApprovalCancelInput): Promise<GovernanceApprovalSnapshot> {
    return cancelGovernanceApproval(this.prisma, input)
  }

  @Post('resubmit')
  async resubmitApproval(@Body() input: GovernanceApprovalResubmitInput): Promise<ReturnType<typeof resubmitGovernanceApproval>> {
    return resubmitGovernanceApproval(this.prisma, input)
  }

  @Post('execute')
  async markExecuted(@Body() input: GovernanceApprovalExecutionInput): Promise<GovernanceApprovalSnapshot> {
    return markGovernanceApprovalExecuted(this.prisma, input)
  }

  @Post('execute-failure')
  async markExecutionFailed(@Body() input: GovernanceApprovalExecutionFailureInput): Promise<GovernanceApprovalSnapshot> {
    return markGovernanceApprovalExecutionFailed(this.prisma, input)
  }
}
