import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query
} from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  ApproveRejectTeamDto,
  CreateTournamentDto,
  MatchQueryDto,
  MatchResultDto,
  RankingQueryDto,
  RegisterParticipantDto,
  RegisterTeamDto,
  TournamentQueryDto,
  UpdateTournamentDto,
  UpdateTournamentStatusDto
} from './tournament.dto'
import { TournamentService } from './tournament.service'

@Controller('tournaments')
export class TournamentController {
  constructor(private readonly tournamentService: TournamentService) {}

  // ── Tournament CRUD ──

  @Post()
  createTournament(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateTournamentDto
  ) {
    return this.tournamentService.createTournament({
      tenantId: tenantContext.tenantId,
      brandId: tenantContext.brandId,
      storeId: tenantContext.storeId,
      name: body.name,
      description: body.description,
      type: body.type,
      gameName: body.gameName,
      startDate: body.startDate,
      endDate: body.endDate,
      maxParticipants: body.maxParticipants,
      rules: body.rules,
      prizes: body.prizes,
      bannerImage: body.bannerImage
    })
  }

  @Get()
  listTournaments(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: TournamentQueryDto
  ) {
    return this.tournamentService.listTournaments(tenantContext.tenantId, {
      status: query.status,
      type: query.type,
      storeId: query.storeId,
      brandId: query.brandId
    })
  }

  @Get(':tournamentId')
  getTournament(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('tournamentId') tournamentId: string
  ) {
    const tournament = this.tournamentService.getTournament(tournamentId, tenantContext.tenantId)
    if (!tournament) {
      throw new Error(`Tournament not found: ${tournamentId}`)
    }
    return tournament
  }

  @Patch(':tournamentId')
  updateTournament(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('tournamentId') tournamentId: string,
    @Body() body: UpdateTournamentDto
  ) {
    return this.tournamentService.updateTournament(tournamentId, tenantContext.tenantId, body)
  }

  @Patch(':tournamentId/status')
  updateTournamentStatus(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('tournamentId') tournamentId: string,
    @Body() body: UpdateTournamentStatusDto
  ) {
    return this.tournamentService.updateTournamentStatus(
      tournamentId,
      body.status,
      tenantContext.tenantId
    )
  }

  // ── Registration ──

  @Post(':tournamentId/register')
  registerParticipant(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('tournamentId') tournamentId: string,
    @Body() body: RegisterParticipantDto
  ) {
    return this.tournamentService.registerParticipant(
      tournamentId,
      body.memberId,
      tenantContext.tenantId
    )
  }

  @Post(':tournamentId/teams')
  registerTeam(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('tournamentId') tournamentId: string,
    @Body() body: RegisterTeamDto
  ) {
    return this.tournamentService.registerTeam(
      { tournamentId, ...body },
      tenantContext.tenantId
    )
  }

  @Get(':tournamentId/teams')
  listTeamRegistrations(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('tournamentId') tournamentId: string
  ) {
    return this.tournamentService.listTeamRegistrations(
      tournamentId,
      tenantContext.tenantId
    )
  }

  @Patch(':tournamentId/teams/approve')
  approveTeam(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: ApproveRejectTeamDto
  ) {
    return this.tournamentService.approveTeam(body.teamRegId, tenantContext.tenantId)
  }

  @Patch(':tournamentId/teams/reject')
  rejectTeam(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: ApproveRejectTeamDto
  ) {
    return this.tournamentService.rejectTeam(body.teamRegId, tenantContext.tenantId)
  }

  // ── Bracket & Matches ──

  @Post(':tournamentId/bracket/generate')
  generateBracket(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('tournamentId') tournamentId: string
  ) {
    return this.tournamentService.generateBracket(tournamentId, tenantContext.tenantId)
  }

  @Get(':tournamentId/matches')
  listMatches(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('tournamentId') tournamentId: string,
    @Query() query: MatchQueryDto
  ) {
    return this.tournamentService.listMatches(tournamentId, tenantContext.tenantId, {
      round: query.round,
      status: query.status
    })
  }

  @Get('matches/:matchId')
  getMatch(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('matchId') matchId: string
  ) {
    return this.tournamentService.getMatch(matchId, tenantContext.tenantId)
  }

  @Patch('matches/:matchId/result')
  recordMatchResult(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('matchId') matchId: string,
    @Body() body: MatchResultDto
  ) {
    return this.tournamentService.recordMatchResult(
      matchId,
      body.score1,
      body.score2,
      tenantContext.tenantId
    )
  }

  @Patch('matches/:matchId/dispute')
  setDisputed(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('matchId') matchId: string
  ) {
    return this.tournamentService.setDisputed(matchId, tenantContext.tenantId)
  }

  // ── Rankings ──

  @Get(':tournamentId/rankings')
  getRankings(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('tournamentId') tournamentId: string,
    @Query() query: RankingQueryDto
  ) {
    const rankings = this.tournamentService.getRankings(
      tournamentId,
      tenantContext.tenantId
    )
    if (query.limit !== undefined) {
      return rankings.slice(0, query.limit)
    }
    return rankings
  }

  // ── Match push ──

  @Get('members/:memberId/upcoming')
  getUpcomingMatches(@Param('memberId') memberId: string) {
    return this.tournamentService.getUpcomingMatches(memberId)
  }

  @Get('stores/:storeId/live')
  getLiveMatches(@Param('storeId') storeId: string) {
    return this.tournamentService.getLiveMatches(storeId)
  }
}
