import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../prisma/prisma.service'
import {
  cancelGovernanceApproval,
  decideGovernanceApproval,
  getGovernanceApprovalByTicket,
  GovernanceApprovalCancelInput,
  GovernanceApprovalDecisionInput,
  GovernanceApprovalExecutionFailureInput,
  GovernanceApprovalExecutionInput,
  GovernanceApprovalQueryInput,
  GovernanceApprovalResubmitInput,
  GovernanceApprovalSnapshot,
  listGovernanceApprovals,
  markGovernanceApprovalExecuted,
  markGovernanceApprovalExecutionFailed,
  MaterializeGovernanceApprovalInput,
  materializeGovernanceApproval,
  resubmitGovernanceApproval,
  summarizeGovernanceApprovals
} from './governance-approval'

@Injectable()
export class GovernanceApprovalService {
  constructor(private readonly prisma: PrismaService) {}

  async listApprovals(query: GovernanceApprovalQueryInput): Promise<GovernanceApprovalSnapshot[]> {
    return listGovernanceApprovals(this.prisma, query)
  }

  async summarizeApprovals(query: GovernanceApprovalQueryInput): Promise<ReturnType<typeof summarizeGovernanceApprovals>> {
    return summarizeGovernanceApprovals(this.prisma, query)
  }

  async getApproval(ticket: string): Promise<GovernanceApprovalSnapshot> {
    return getGovernanceApprovalByTicket(this.prisma, ticket)
  }

  async materializeApproval(input: MaterializeGovernanceApprovalInput): Promise<GovernanceApprovalSnapshot> {
    return materializeGovernanceApproval(this.prisma, input)
  }

  async decideApproval(input: GovernanceApprovalDecisionInput): Promise<GovernanceApprovalSnapshot> {
    return decideGovernanceApproval(this.prisma, input)
  }

  async cancelApproval(input: GovernanceApprovalCancelInput): Promise<GovernanceApprovalSnapshot> {
    return cancelGovernanceApproval(this.prisma, input)
  }

  async resubmitApproval(input: GovernanceApprovalResubmitInput): Promise<ReturnType<typeof resubmitGovernanceApproval>> {
    return resubmitGovernanceApproval(this.prisma, input)
  }

  async markExecuted(input: GovernanceApprovalExecutionInput): Promise<GovernanceApprovalSnapshot> {
    return markGovernanceApprovalExecuted(this.prisma, input)
  }

  async markExecutionFailed(input: GovernanceApprovalExecutionFailureInput): Promise<GovernanceApprovalSnapshot> {
    return markGovernanceApprovalExecutionFailed(this.prisma, input)
  }
}
