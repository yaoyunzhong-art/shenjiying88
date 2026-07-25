import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  ContractQueryDto,
  CreateContractDto,
  CreateClauseDto,
  UpdateContractDto,
  UpdateContractStatusDto,
  UpdateClauseDto,
  BulkCreateClausesDto,
} from './contract-manager.dto'
import { ContractManagerService } from './contract-manager.service'
import { TenantGuard } from '../agent/tenant.guard'
import {
  RequirePermissions,
  RequireTenantScope
} from '../foundation/identity-access/identity-access.decorator'

const CONTRACTS_READ_PERMISSION = 'contracts:read'
const CONTRACT_CREATE_PERMISSION = 'contract:create'
const CONTRACT_UPDATE_PERMISSION = 'contract:update'
const CONTRACT_CLAUSE_MANAGE_PERMISSION = 'contract:clause:manage'
const CONTRACT_TERMINATE_PERMISSION = 'contract:terminate'

@Controller('contracts')
@UseGuards(TenantGuard)
@RequireTenantScope()
@RequirePermissions(CONTRACTS_READ_PERMISSION)
export class ContractManagerController {
  constructor(private readonly contractService: ContractManagerService) {}

  // ── Contract CRUD ──

  @Post()
  @RequirePermissions(CONTRACT_CREATE_PERMISSION)
  createContract(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateContractDto,
  ) {
    return this.contractService.createContract({
      tenantId: tenantContext.tenantId,
      name: body.name,
      type: body.type,
      partyA: body.partyA,
      partyB: body.partyB,
      amount: body.amount,
      startDate: body.startDate,
      endDate: body.endDate,
      signedDate: body.signedDate,
      fileName: body.fileName,
      remark: body.remark,
    })
  }

  @Get()
  listContracts(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: ContractQueryDto,
  ) {
    return this.contractService.listContracts(tenantContext.tenantId, {
      status: query.status,
      type: query.type,
      search: query.search,
    })
  }

  @Get(':contractId')
  getContract(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('contractId') contractId: string,
  ) {
    const contract = this.contractService.getContract(contractId, tenantContext.tenantId)
    if (!contract) {
      throw new Error(`Contract not found: ${contractId}`)
    }
    return contract
  }

  @Patch(':contractId')
  @RequirePermissions(CONTRACT_UPDATE_PERMISSION)
  updateContract(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('contractId') contractId: string,
    @Body() body: UpdateContractDto,
  ) {
    return this.contractService.updateContract(contractId, tenantContext.tenantId, body)
  }

  @Patch(':contractId/status')
  @RequirePermissions(CONTRACT_TERMINATE_PERMISSION)
  updateContractStatus(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('contractId') contractId: string,
    @Body() body: UpdateContractStatusDto,
  ) {
    return this.contractService.updateContractStatus(
      contractId,
      body.status,
      tenantContext.tenantId,
    )
  }

  // ── Expiry / Expired ──

  @Get('analysis/expiring')
  getExpiringContracts(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query('withinDays') withinDays?: string,
  ) {
    const days = withinDays ? parseInt(withinDays, 10) : 30
    return this.contractService.getExpiringContracts(tenantContext.tenantId, days)
  }

  @Get('analysis/expired')
  getExpiredContracts(@TenantContext() tenantContext: RequestTenantContext) {
    return this.contractService.getExpiredContracts(tenantContext.tenantId)
  }

  // ── Clause CRUD ──

  @Post(':contractId/clauses')
  @RequirePermissions(CONTRACT_CLAUSE_MANAGE_PERMISSION)
  addClause(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('contractId') contractId: string,
    @Body() body: CreateClauseDto,
  ) {
    const contract = this.contractService.getContract(contractId, tenantContext.tenantId)
    if (!contract) {
      throw new Error(`Contract not found: ${contractId}`)
    }
    return this.contractService.addClause({
      contractId,
      title: body.title,
      content: body.content,
      sortOrder: body.sortOrder,
    })
  }

  @Post(':contractId/clauses/bulk')
  @RequirePermissions(CONTRACT_CLAUSE_MANAGE_PERMISSION)
  bulkAddClauses(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('contractId') contractId: string,
    @Body() body: BulkCreateClausesDto,
  ) {
    const contract = this.contractService.getContract(contractId, tenantContext.tenantId)
    if (!contract) {
      throw new Error(`Contract not found: ${contractId}`)
    }
    return body.clauses.map((clause) =>
      this.contractService.addClause({
        contractId,
        title: clause.title,
        content: clause.content,
        sortOrder: clause.sortOrder,
      }),
    )
  }

  @Get(':contractId/clauses')
  listClauses(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('contractId') contractId: string,
  ) {
    const contract = this.contractService.getContract(contractId, tenantContext.tenantId)
    if (!contract) {
      throw new Error(`Contract not found: ${contractId}`)
    }
    return this.contractService.listClauses(contractId)
  }

  @Patch('clauses/:clauseId')
  @RequirePermissions(CONTRACT_CLAUSE_MANAGE_PERMISSION)
  updateClause(
    @Param('clauseId') clauseId: string,
    @Body() body: UpdateClauseDto,
  ) {
    return this.contractService.updateClause(clauseId, body)
  }

  @Delete('clauses/:clauseId')
  @RequirePermissions(CONTRACT_CLAUSE_MANAGE_PERMISSION)
  deleteClause(@Param('clauseId') clauseId: string) {
    return this.contractService.deleteClause(clauseId)
  }

  // ── Mock Seed ──

  @Post('seed')
  @RequirePermissions(CONTRACT_CREATE_PERMISSION)
  seedMockData(@TenantContext() tenantContext: RequestTenantContext) {
    this.contractService.seedMockData(tenantContext.tenantId)
    return { message: 'Mock contract data seeded' }
  }
}
