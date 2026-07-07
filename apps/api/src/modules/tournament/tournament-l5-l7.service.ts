import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import {
  MatchStatus,
  TournamentStatus,
  TournamentType,
  type Match,
  type Ranking,
  type TeamRegistration,
  type Tournament,
  type TournamentPrizes,
  type TournamentRules
} from './tournament.entity'

// ── In-memory stores ──

const nationalTournamentStore = new Map<string, NationalTournament>()
const championshipStore = new Map<string, ChampionshipTournament>()
const worldCupStore = new Map<string, WorldCupTournament>()
const ticketStore = new Map<string, string>() // key: `${tournamentId}:${memberId}` -> ticketNumber
const matchStore = new Map<string, Match>()
const rankingStore = new Map<string, Ranking>()

// ── Types ──

export interface NationalTournament {
  id: string
  tenantId: string
  name: string
  status: TournamentStatus
  maxParticipants: number
  currentParticipants: number
  prizes: TournamentPrizes
  createdAt: string
  updatedAt: string
}

export interface ChampionshipTournament {
  id: string
  tenantId: string
  name: string
  status: TournamentStatus
  isInvitationOnly: boolean
  prizePool: number
  invitedMembers: string[]
  acceptedMembers: string[]
  rejectedMembers: string[]
  createdAt: string
  updatedAt: string
}

export interface WorldCupTournament {
  id: string
  tenantId: string
  name: string
  status: TournamentStatus
  nationalTeams: NationalTeam[]
  qualifiedTeams: NationalTeam[]
  championTeamId?: string
  createdAt: string
  updatedAt: string
}

export interface NationalTeam {
  id: string
  country: string
  playerIds: string[]
  captainId: string
  registeredAt: string
}

export interface Ticket {
  tournamentId: string
  memberId: string
  ticketNumber: string
  issuedAt: string
}

export interface WaitEstimate {
  memberId: string
  tournamentId: string
  estimatedWaitMinutes: number
  currentRound: number
  estimatedStartTime: string
  calculatedAt: string
}

export interface BusyIndex {
  tournamentId: string
  index: number // 0-100
  isHighLoad: boolean
  activeMatches: number
  pendingMatches: number
  calculatedAt: string
}

// ── NationalTournament：全国赛（L5） ──

@Injectable()
export class NationalTournamentService {
  createNational(input: {
    tenantId: string
    name: string
    maxParticipants: number
    prizes?: TournamentPrizes
  }): NationalTournament {
    const now = new Date().toISOString()
    const tournament: NationalTournament = {
      id: `national-${randomUUID()}`,
      tenantId: input.tenantId,
      name: input.name,
      status: TournamentStatus.Draft,
      maxParticipants: input.maxParticipants,
      currentParticipants: 0,
      prizes: input.prizes ?? {},
      createdAt: now,
      updatedAt: now
    }
    nationalTournamentStore.set(tournament.id, tournament)
    return tournament
  }

  register(memberId: string, tournamentId: string): NationalTournament {
    const tournament = this.requireNationalTournament(tournamentId)

    if (tournament.status !== TournamentStatus.Open) {
      throw new Error('Tournament is not open for registration')
    }
    if (tournament.currentParticipants >= tournament.maxParticipants) {
      throw new Error('Tournament has reached maximum participants')
    }

    // Check if already registered
    const existing = Array.from(rankingStore.values()).find(
      (r) => r.tournamentId === tournamentId && r.memberId === memberId
    )
    if (existing) {
      throw new Error('Member already registered')
    }

    tournament.currentParticipants += 1
    tournament.updatedAt = new Date().toISOString()
    nationalTournamentStore.set(tournamentId, tournament)

    const ranking: Ranking = {
      id: `ranking-${randomUUID()}`,
      tournamentId,
      memberId,
      rank: 0,
      points: 0,
      wins: 0,
      losses: 0,
      draws: 0,
      updatedAt: new Date().toISOString()
    }
    rankingStore.set(ranking.id, ranking)

    return tournament
  }

  seedPlayers(tournamentId: string): Ranking[] {
    const tournament = this.requireNationalTournament(tournamentId)

    const participants = Array.from(rankingStore.values())
      .filter((r) => r.tournamentId === tournamentId)
      .sort(() => Math.random() - 0.5)

    participants.forEach((p, index) => {
      p.rank = index + 1
      rankingStore.set(p.id, p)
    })

    return participants
  }

  runBracket(tournamentId: string): Match[] {
    const tournament = this.requireNationalTournament(tournamentId)

    if (tournament.status !== TournamentStatus.Open) {
      throw new Error('Tournament must be open to run bracket')
    }

    const participants = Array.from(rankingStore.values())
      .filter((r) => r.tournamentId === tournamentId)
      .map((r) => r.memberId)

    if (participants.length < 2) {
      throw new Error('Need at least 2 participants to run bracket')
    }

    const matches: Match[] = []
    const now = new Date().toISOString()
    const shuffled = this.shuffleArray([...participants])

    const totalRounds = Math.ceil(Math.log2(shuffled.length))
    let currentRound = 1
    let bracketSlot = 0

    for (let i = 0; i < shuffled.length; i += 2) {
      const match: Match = {
        id: `match-${randomUUID()}`,
        tournamentId,
        round: currentRound,
        bracketPosition: bracketSlot++,
        player1Id: shuffled[i],
        player2Id: shuffled[i + 1] ?? undefined,
        score1: 0,
        score2: 0,
        status: MatchStatus.Pending,
        createdAt: now,
        updatedAt: now
      }
      matches.push(match)
      matchStore.set(match.id, match)

      if (!match.player2Id) {
        match.winnerId = match.player1Id
        match.status = MatchStatus.Completed
        match.playedAt = now
        matchStore.set(match.id, match)
      }
    }

    let bracketCount = Math.ceil(shuffled.length / 2)
    while (bracketCount > 1 && currentRound < totalRounds) {
      currentRound++
      const nextRoundMatches = Math.floor(bracketCount / 2)
      for (let i = 0; i < nextRoundMatches; i++) {
        const match: Match = {
          id: `match-${randomUUID()}`,
          tournamentId,
          round: currentRound,
          bracketPosition: i,
          player1Id: '',
          player2Id: '',
          score1: 0,
          score2: 0,
          status: MatchStatus.Pending,
          createdAt: now,
          updatedAt: now
        }
        matches.push(match)
        matchStore.set(match.id, match)
      }
      bracketCount = nextRoundMatches
    }

    tournament.status = TournamentStatus.Ongoing
    tournament.updatedAt = now
    nationalTournamentStore.set(tournamentId, tournament)

    return matches
  }

  declareChampion(tournamentId: string, memberId: string): { champion: Ranking; tournament: NationalTournament } {
    const tournament = this.requireNationalTournament(tournamentId)

    const finalMatches = Array.from(matchStore.values())
      .filter((m) => m.tournamentId === tournamentId && m.round === this.getFinalRound(tournamentId))
      .filter((m) => m.status === MatchStatus.Completed)

    if (finalMatches.length === 0) {
      throw new Error('No final match completed')
    }

    const finalMatch = finalMatches[0]
    if (finalMatch.winnerId !== memberId) {
      throw new Error('Member is not the winner of the final match')
    }

    tournament.status = TournamentStatus.Completed
    tournament.updatedAt = new Date().toISOString()
    nationalTournamentStore.set(tournamentId, tournament)

    const championRanking = Array.from(rankingStore.values()).find(
      (r) => r.tournamentId === tournamentId && r.memberId === memberId
    )
    if (championRanking) {
      championRanking.rank = 1
      rankingStore.set(championRanking.id, championRanking)
    }

    return { champion: championRanking!, tournament }
  }

  private requireNationalTournament(tournamentId: string): NationalTournament {
    const tournament = nationalTournamentStore.get(tournamentId)
    if (!tournament) {
      throw new Error(`National tournament not found: ${tournamentId}`)
    }
    return tournament
  }

  private getFinalRound(tournamentId: string): number {
    const matches = Array.from(matchStore.values()).filter((m) => m.tournamentId === tournamentId)
    return Math.max(...matches.map((m) => m.round), 0)
  }

  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }
}

// ── ChampionshipTournament：锦标赛（L6） ──

@Injectable()
export class ChampionshipTournamentService {
  createChampionship(input: {
    tenantId: string
    name: string
    isInvitationOnly?: boolean
    prizePool?: number
  }): ChampionshipTournament {
    const now = new Date().toISOString()
    const championship: ChampionshipTournament = {
      id: `championship-${randomUUID()}`,
      tenantId: input.tenantId,
      name: input.name,
      status: TournamentStatus.Draft,
      isInvitationOnly: input.isInvitationOnly ?? false,
      prizePool: input.prizePool ?? 0,
      invitedMembers: [],
      acceptedMembers: [],
      rejectedMembers: [],
      createdAt: now,
      updatedAt: now
    }
    championshipStore.set(championship.id, championship)
    return championship
  }

  invitePlayers(championshipId: string, memberIds: string[]): ChampionshipTournament {
    const championship = this.requireChampionship(championshipId)

    for (const memberId of memberIds) {
      if (!championship.invitedMembers.includes(memberId)) {
        championship.invitedMembers.push(memberId)
      }
    }

    championship.updatedAt = new Date().toISOString()
    championshipStore.set(championshipId, championship)
    return championship
  }

  acceptInvitation(championshipId: string, memberId: string): ChampionshipTournament {
    const championship = this.requireChampionship(championshipId)

    if (!championship.invitedMembers.includes(memberId)) {
      throw new Error('Member has not been invited')
    }
    if (championship.acceptedMembers.includes(memberId)) {
      throw new Error('Invitation already accepted')
    }
    if (championship.rejectedMembers.includes(memberId)) {
      throw new Error('Invitation was rejected')
    }

    championship.acceptedMembers.push(memberId)
    championship.updatedAt = new Date().toISOString()
    championshipStore.set(championshipId, championship)
    return championship
  }

  rejectInvitation(championshipId: string, memberId: string): ChampionshipTournament {
    const championship = this.requireChampionship(championshipId)

    if (!championship.invitedMembers.includes(memberId)) {
      throw new Error('Member has not been invited')
    }
    if (championship.rejectedMembers.includes(memberId)) {
      throw new Error('Invitation already rejected')
    }

    championship.rejectedMembers.push(memberId)
    championship.updatedAt = new Date().toISOString()
    championshipStore.set(championshipId, championship)
    return championship
  }

  getPrizePool(championshipId: string): number {
    const championship = this.requireChampionship(championshipId)
    return championship.prizePool
  }

  private requireChampionship(championshipId: string): ChampionshipTournament {
    const championship = championshipStore.get(championshipId)
    if (!championship) {
      throw new Error(`Championship not found: ${championshipId}`)
    }
    return championship
  }
}

// ── WorldCupTournament：世界杯（L7） ──

@Injectable()
export class WorldCupTournamentService {
  createWorldCup(input: {
    tenantId: string
    name: string
  }): WorldCupTournament {
    const now = new Date().toISOString()
    const worldCup: WorldCupTournament = {
      id: `worldcup-${randomUUID()}`,
      tenantId: input.tenantId,
      name: input.name,
      status: TournamentStatus.Draft,
      nationalTeams: [],
      qualifiedTeams: [],
      createdAt: now,
      updatedAt: now
    }
    worldCupStore.set(worldCup.id, worldCup)
    return worldCup
  }

  registerNationalTeam(
    worldCupId: string,
    teamId: string,
    country: string,
    playerIds: string[],
    captainId: string
  ): WorldCupTournament {
    const worldCup = this.requireWorldCup(worldCupId)

    const existingTeam = worldCup.nationalTeams.find((t) => t.id === teamId)
    if (existingTeam) {
      throw new Error('Team already registered')
    }

    const team: NationalTeam = {
      id: teamId,
      country,
      playerIds,
      captainId,
      registeredAt: new Date().toISOString()
    }

    worldCup.nationalTeams.push(team)
    worldCup.updatedAt = new Date().toISOString()
    worldCupStore.set(worldCupId, worldCup)
    return worldCup
  }

  qualifyWorldCup(worldCupId: string): NationalTeam[] {
    const worldCup = this.requireWorldCup(worldCupId)

    // Simple qualification: first 16 teams qualify
    const qualified = worldCup.nationalTeams.slice(0, 16)
    worldCup.qualifiedTeams = qualified
    worldCup.status = TournamentStatus.Ongoing
    worldCup.updatedAt = new Date().toISOString()
    worldCupStore.set(worldCupId, worldCup)

    return qualified
  }

  awardWorldChampion(worldCupId: string, teamId: string): WorldCupTournament {
    const worldCup = this.requireWorldCup(worldCupId)

    const team = worldCup.qualifiedTeams.find((t) => t.id === teamId)
    if (!team) {
      throw new Error('Team did not qualify for World Cup')
    }

    worldCup.championTeamId = teamId
    worldCup.status = TournamentStatus.Completed
    worldCup.updatedAt = new Date().toISOString()
    worldCupStore.set(worldCupId, worldCup)
    return worldCup
  }

  private requireWorldCup(worldCupId: string): WorldCupTournament {
    const worldCup = worldCupStore.get(worldCupId)
    if (!worldCup) {
      throw new Error(`World Cup not found: ${worldCupId}`)
    }
    return worldCup
  }
}

// ── WaitTimeEstimator：等待时间预估（P1-3） ──

@Injectable()
export class WaitTimeEstimator {
  estimateWait(memberId: string, tournamentId: string): WaitEstimate {
    const matches = Array.from(matchStore.values())
      .filter(
        (m) =>
          m.tournamentId === tournamentId &&
          (m.player1Id === memberId || m.player2Id === memberId) &&
          m.status === MatchStatus.Pending
      )
      .sort((a, b) => a.round - b.round)

    const currentRound = matches.length > 0 ? matches[0].round : 0
    // Base estimate: 10 minutes per round
    const estimatedWaitMinutes = currentRound * 10

    const now = new Date()
    const estimatedStartTime = new Date(now.getTime() + estimatedWaitMinutes * 60 * 1000)

    return {
      memberId,
      tournamentId,
      estimatedWaitMinutes,
      currentRound,
      estimatedStartTime: estimatedStartTime.toISOString(),
      calculatedAt: now.toISOString()
    }
  }

  getEstimatedStartTime(tournamentId: string): string {
    const matches = Array.from(matchStore.values())
      .filter((m) => m.tournamentId === tournamentId && m.status === MatchStatus.Pending)
      .sort((a, b) => a.round - b.round)

    if (matches.length === 0) {
      return new Date().toISOString()
    }

    const minRound = Math.min(...matches.map((m) => m.round))
    const now = new Date()
    const estimatedStartTime = new Date(now.getTime() + minRound * 10 * 60 * 1000)
    return estimatedStartTime.toISOString()
  }
}

// ── BusyIndexCalculator：繁忙指数（P2-3） ──

@Injectable()
export class BusyIndexCalculator {
  calculate(tournamentId: string): BusyIndex {
    const matches = Array.from(matchStore.values()).filter((m) => m.tournamentId === tournamentId)

    const activeMatches = matches.filter((m) => m.status === MatchStatus.Ongoing).length
    const pendingMatches = matches.filter((m) => m.status === MatchStatus.Pending).length
    const totalMatches = matches.length

    // Formula: (active * 2 + pending) / total * 50
    let index = 0
    if (totalMatches > 0) {
      index = Math.round(((activeMatches * 2 + pendingMatches) / totalMatches) * 50)
    }

    return {
      tournamentId,
      index: Math.min(100, index),
      isHighLoad: index > 70,
      activeMatches,
      pendingMatches,
      calculatedAt: new Date().toISOString()
    }
  }

  isHighLoad(tournamentId: string): boolean {
    const busyIndex = this.calculate(tournamentId)
    return busyIndex.isHighLoad
  }
}

// ── TicketIdempotency：取号幂等性（P2-9） ──

@Injectable()
export class TicketIdempotency {
  private ticketCounter = 1000

  issueTicket(tournamentId: string, memberId: string): Ticket {
    const key = `${tournamentId}:${memberId}`
    const existing = ticketStore.get(key)

    if (existing) {
      return {
        tournamentId,
        memberId,
        ticketNumber: existing,
        issuedAt: new Date().toISOString()
      }
    }

    const ticketNumber = `TKT-${++this.ticketCounter}`
    ticketStore.set(key, ticketNumber)

    return {
      tournamentId,
      memberId,
      ticketNumber,
      issuedAt: new Date().toISOString()
    }
  }

  getTicket(tournamentId: string, memberId: string): Ticket | undefined {
    const ticketNumber = ticketStore.get(`${tournamentId}:${memberId}`)
    if (!ticketNumber) {
      return undefined
    }
    return {
      tournamentId,
      memberId,
      ticketNumber,
      issuedAt: new Date().toISOString()
    }
  }
}

// ── Test helpers ──

export function resetL5L7StoresForTests(): void {
  nationalTournamentStore.clear()
  championshipStore.clear()
  worldCupStore.clear()
  ticketStore.clear()
  matchStore.clear()
  rankingStore.clear()
}

// Export stores for testing
export const testExports = {
  matchStore,
  rankingStore,
  nationalTournamentStore,
  championshipStore,
  worldCupStore,
  ticketStore
}
