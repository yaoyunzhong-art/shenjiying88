import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import {
  MatchStatus,
  TeamRegistrationStatus,
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

const tournamentStore = new Map<string, Tournament>()
const matchStore = new Map<string, Match>()
const rankingStore = new Map<string, Ranking>()
const teamRegistrationStore = new Map<string, TeamRegistration>()

@Injectable()
export class TournamentService {
  // ═══════════════════════════════════════════════════════════════════
  // Tournament CRUD
  // ═══════════════════════════════════════════════════════════════════

  createTournament(input: {
    tenantId: string
    brandId?: string
    storeId?: string
    name: string
    description?: string
    type: TournamentType
    gameName: string
    startDate: string
    endDate: string
    maxParticipants: number
    rules?: TournamentRules
    prizes?: TournamentPrizes
    bannerImage?: string
  }): Tournament {
    const now = new Date().toISOString()
    const tournament: Tournament = {
      id: `tournament-${randomUUID()}`,
      tenantId: input.tenantId,
      brandId: input.brandId,
      storeId: input.storeId,
      name: input.name,
      description: input.description,
      type: input.type,
      gameName: input.gameName,
      startDate: input.startDate,
      endDate: input.endDate,
      maxParticipants: input.maxParticipants,
      currentParticipants: 0,
      status: TournamentStatus.Draft,
      rules: input.rules ?? {},
      prizes: input.prizes ?? {},
      bannerImage: input.bannerImage,
      createdAt: now,
      updatedAt: now
    }
    tournamentStore.set(tournament.id, tournament)
    return tournament
  }

  updateTournament(
    tournamentId: string,
    tenantId: string,
    input: {
      name?: string
      description?: string
      type?: TournamentType
      gameName?: string
      startDate?: string
      endDate?: string
      maxParticipants?: number
      rules?: TournamentRules
      prizes?: TournamentPrizes
      bannerImage?: string
    }
  ): Tournament {
    const tournament = this.requireTournament(tournamentId, tenantId)

    if (input.name !== undefined) tournament.name = input.name
    if (input.description !== undefined) tournament.description = input.description
    if (input.type !== undefined) tournament.type = input.type
    if (input.gameName !== undefined) tournament.gameName = input.gameName
    if (input.startDate !== undefined) tournament.startDate = input.startDate
    if (input.endDate !== undefined) tournament.endDate = input.endDate
    if (input.maxParticipants !== undefined) tournament.maxParticipants = input.maxParticipants
    if (input.rules !== undefined) tournament.rules = input.rules
    if (input.prizes !== undefined) tournament.prizes = input.prizes
    if (input.bannerImage !== undefined) tournament.bannerImage = input.bannerImage

    tournament.updatedAt = new Date().toISOString()
    tournamentStore.set(tournamentId, tournament)
    return tournament
  }

  getTournament(tournamentId: string, tenantId: string): Tournament | undefined {
    const tournament = tournamentStore.get(tournamentId)
    if (!tournament || tournament.tenantId !== tenantId) return undefined
    return tournament
  }

  listTournaments(
    tenantId: string,
    filter?: {
      status?: TournamentStatus
      type?: TournamentType
      storeId?: string
      brandId?: string
    }
  ): Tournament[] {
    return Array.from(tournamentStore.values())
      .filter((t) => t.tenantId === tenantId)
      .filter((t) => (filter?.status ? t.status === filter.status : true))
      .filter((t) => (filter?.type ? t.type === filter.type : true))
      .filter((t) => (filter?.storeId ? t.storeId === filter.storeId : true))
      .filter((t) => (filter?.brandId ? t.brandId === filter.brandId : true))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  // ═══════════════════════════════════════════════════════════════════
  // Status transitions
  // ═══════════════════════════════════════════════════════════════════

  updateTournamentStatus(
    tournamentId: string,
    status: TournamentStatus,
    tenantId: string
  ): Tournament {
    const tournament = this.requireTournament(tournamentId, tenantId)
    this.assertValidTournamentStatusTransition(tournament.status, status)
    tournament.status = status
    tournament.updatedAt = new Date().toISOString()
    tournamentStore.set(tournamentId, tournament)
    return tournament
  }

  // ═══════════════════════════════════════════════════════════════════
  // Participant registration
  // ═══════════════════════════════════════════════════════════════════

  registerParticipant(tournamentId: string, memberId: string, tenantId: string): Tournament {
    const tournament = this.requireTournament(tournamentId, tenantId)

    if (tournament.status !== TournamentStatus.Open) {
      throw new Error('Tournament is not open for registration')
    }
    if (tournament.currentParticipants >= tournament.maxParticipants) {
      throw new Error('Tournament has reached maximum participants')
    }

    // Check if already registered (via ranking store as participant list)
    const existing = Array.from(rankingStore.values()).find(
      (r) => r.tournamentId === tournamentId && r.memberId === memberId
    )
    if (existing) {
      throw new Error('Participant already registered')
    }

    tournament.currentParticipants += 1
    tournament.updatedAt = new Date().toISOString()
    tournamentStore.set(tournamentId, tournament)

    // Create initial ranking entry
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

  registerTeam(input: {
    tournamentId: string
    teamName: string
    captainId: string
    memberIds: string[]
  }, tenantId: string): TeamRegistration {
    const tournament = this.requireTournament(input.tournamentId, tenantId)

    if (tournament.status !== TournamentStatus.Open) {
      throw new Error('Tournament is not open for registration')
    }

    const now = new Date().toISOString()
    const registration: TeamRegistration = {
      id: `teamreg-${randomUUID()}`,
      tournamentId: input.tournamentId,
      teamName: input.teamName,
      captainId: input.captainId,
      memberIds: input.memberIds,
      status: TeamRegistrationStatus.Pending,
      createdAt: now,
      updatedAt: now
    }
    teamRegistrationStore.set(registration.id, registration)
    return registration
  }

  approveTeam(teamRegId: string, tenantId: string): TeamRegistration {
    const reg = teamRegistrationStore.get(teamRegId)
    if (!reg) throw new Error(`Team registration not found: ${teamRegId}`)
    // Verify tournament belongs to tenant
    this.requireTournament(reg.tournamentId, tenantId)

    reg.status = TeamRegistrationStatus.Approved
    reg.updatedAt = new Date().toISOString()
    teamRegistrationStore.set(teamRegId, reg)
    return reg
  }

  rejectTeam(teamRegId: string, tenantId: string): TeamRegistration {
    const reg = teamRegistrationStore.get(teamRegId)
    if (!reg) throw new Error(`Team registration not found: ${teamRegId}`)
    this.requireTournament(reg.tournamentId, tenantId)

    reg.status = TeamRegistrationStatus.Rejected
    reg.updatedAt = new Date().toISOString()
    teamRegistrationStore.set(teamRegId, reg)
    return reg
  }

  listTeamRegistrations(tournamentId: string, tenantId: string): TeamRegistration[] {
    this.requireTournament(tournamentId, tenantId)
    return Array.from(teamRegistrationStore.values())
      .filter((r) => r.tournamentId === tournamentId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  }

  // ═══════════════════════════════════════════════════════════════════
  // Bracket & Match management
  // ═══════════════════════════════════════════════════════════════════

  generateBracket(tournamentId: string, tenantId: string): Match[] {
    const tournament = this.requireTournament(tournamentId, tenantId)

    if (tournament.status !== TournamentStatus.Open) {
      throw new Error('Bracket can only be generated when tournament is OPEN')
    }

    // Get all registered participants
    const participants = Array.from(rankingStore.values())
      .filter((r) => r.tournamentId === tournamentId)
      .map((r) => r.memberId)

    if (participants.length < 2) {
      throw new Error('Need at least 2 participants to generate a bracket')
    }

    const matches: Match[] = []
    const now = new Date().toISOString()

    if (tournament.type === TournamentType.RoundRobin || tournament.type === TournamentType.League) {
      // Round-robin: every participant plays every other
      let position = 0
      for (let i = 0; i < participants.length; i++) {
        for (let j = i + 1; j < participants.length; j++) {
          const match: Match = {
            id: `match-${randomUUID()}`,
            tournamentId,
            round: 1,
            bracketPosition: position++,
            player1Id: participants[i],
            player2Id: participants[j],
            score1: 0,
            score2: 0,
            status: MatchStatus.Pending,
            createdAt: now,
            updatedAt: now
          }
          matches.push(match)
          matchStore.set(match.id, match)
        }
      }
    } else {
      // Single/Double elimination: bracket-style pairing
      // Shuffle & pair adjacent participants
      const shuffled = this.shuffleArray([...participants])

      // Calculate rounds: next power of 2
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
          player2Id: shuffled[i + 1] ?? undefined, // bye
          score1: 0,
          score2: 0,
          status: MatchStatus.Pending,
          createdAt: now,
          updatedAt: now
        }
        matches.push(match)
        matchStore.set(match.id, match)

        // If it's a bye round, auto-advance
        if (!match.player2Id) {
          match.winnerId = match.player1Id
          match.status = MatchStatus.Completed
          match.playedAt = now
          matchStore.set(match.id, match)
        }
      }

      // Pre-create subsequent round placeholder matches for elimination brackets
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
            player1Id: '', // TBD
            player2Id: '', // TBD
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
    }

    // Transition tournament to ongoing
    tournament.status = TournamentStatus.Ongoing
    tournament.updatedAt = now
    tournamentStore.set(tournamentId, tournament)

    return matches
  }

  recordMatchResult(
    matchId: string,
    score1: number,
    score2: number,
    tenantId: string
  ): Match {
    const match = matchStore.get(matchId)
    if (!match) throw new Error(`Match not found: ${matchId}`)

    // Verify tournament tenant
    this.requireTournament(match.tournamentId, tenantId)

    if (match.status === MatchStatus.Completed) {
      throw new Error('Match already completed')
    }

    const now = new Date().toISOString()
    match.score1 = score1
    match.score2 = score2
    match.winnerId =
      score1 > score2 ? match.player1Id : score1 < score2 ? match.player2Id! : undefined
    match.status = MatchStatus.Completed
    match.playedAt = now
    match.updatedAt = now
    matchStore.set(matchId, match)

    // Update rankings
    this.updateRankingAfterMatch(match)

    // Check if tournament is complete
    this.checkTournamentCompletion(match.tournamentId)

    return match
  }

  setDisputed(matchId: string, tenantId: string): Match {
    const match = matchStore.get(matchId)
    if (!match) throw new Error(`Match not found: ${matchId}`)
    this.requireTournament(match.tournamentId, tenantId)

    match.status = MatchStatus.Disputed
    match.updatedAt = new Date().toISOString()
    matchStore.set(matchId, match)
    return match
  }

  getMatch(matchId: string, tenantId: string): Match | undefined {
    const match = matchStore.get(matchId)
    if (!match) return undefined
    // Verify tenant ownership via tournament
    const tournament = tournamentStore.get(match.tournamentId)
    if (!tournament || tournament.tenantId !== tenantId) return undefined
    return match
  }

  listMatches(
    tournamentId: string,
    tenantId: string,
    filter?: { round?: number; status?: MatchStatus }
  ): Match[] {
    this.requireTournament(tournamentId, tenantId)
    return Array.from(matchStore.values())
      .filter((m) => m.tournamentId === tournamentId)
      .filter((m) => (filter?.round ? m.round === filter.round : true))
      .filter((m) => (filter?.status ? m.status === filter.status : true))
      .sort((a, b) => a.round - b.round || a.bracketPosition - b.bracketPosition)
  }

  getUpcomingMatches(memberId: string): Match[] {
    return Array.from(matchStore.values())
      .filter(
        (m) =>
          m.status === MatchStatus.Pending &&
          (m.player1Id === memberId || m.player2Id === memberId)
      )
      .sort((a, b) => {
        if (a.scheduledAt && b.scheduledAt) return a.scheduledAt.localeCompare(b.scheduledAt)
        return a.createdAt.localeCompare(b.createdAt)
      })
  }

  getLiveMatches(storeId: string): Match[] {
    // Find tournaments for this store, then ongoing matches
    const storeTournamentIds = Array.from(tournamentStore.values())
      .filter((t) => t.storeId === storeId && t.status === TournamentStatus.Ongoing)
      .map((t) => t.id)

    return Array.from(matchStore.values())
      .filter(
        (m) =>
          storeTournamentIds.includes(m.tournamentId) &&
          m.status === MatchStatus.Ongoing
      )
      .sort((a, b) => a.round - b.round)
  }

  // ═══════════════════════════════════════════════════════════════════
  // Rankings
  // ═══════════════════════════════════════════════════════════════════

  getRankings(tournamentId: string, tenantId: string): Ranking[] {
    this.requireTournament(tournamentId, tenantId)
    return Array.from(rankingStore.values())
      .filter((r) => r.tournamentId === tournamentId)
      .sort((a, b) => b.points - a.points || b.wins - a.wins || a.losses - b.losses)
      .map((r, index) => ({ ...r, rank: index + 1 }))
  }

  updateRankingAfterMatch(match: Match): void {
    const winnerId = match.winnerId
    const loserId =
      match.player1Id === winnerId ? match.player2Id : match.player1Id

    if (winnerId) {
      this.updatePlayerRanking(match.tournamentId, winnerId, {
        points: 3,
        wins: 1,
        losses: 0,
        draws: 0
      })
    }

    if (loserId) {
      this.updatePlayerRanking(match.tournamentId, loserId, {
        points: 0,
        wins: 0,
        losses: 1,
        draws: 0
      })
    }

    // Handle draw (equal scores)
    if (!winnerId && match.score1 === match.score2) {
      this.updatePlayerRanking(match.tournamentId, match.player1Id, {
        points: 1,
        wins: 0,
        losses: 0,
        draws: 1
      })
      if (match.player2Id) {
        this.updatePlayerRanking(match.tournamentId, match.player2Id, {
          points: 1,
          wins: 0,
          losses: 0,
          draws: 1
        })
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Internals
  // ═══════════════════════════════════════════════════════════════════

  private requireTournament(tournamentId: string, tenantId: string): Tournament {
    const tournament = tournamentStore.get(tournamentId)
    if (!tournament || tournament.tenantId !== tenantId) {
      throw new Error(`Tournament not found: ${tournamentId}`)
    }
    return tournament
  }

  private assertValidTournamentStatusTransition(
    from: TournamentStatus,
    to: TournamentStatus
  ): void {
    const validTransitions: Record<TournamentStatus, TournamentStatus[]> = {
      [TournamentStatus.Draft]: [
        TournamentStatus.Open,
        TournamentStatus.Cancelled
      ],
      [TournamentStatus.Open]: [
        TournamentStatus.Ongoing,
        TournamentStatus.Cancelled,
        TournamentStatus.Draft
      ],
      [TournamentStatus.Ongoing]: [
        TournamentStatus.Completed,
        TournamentStatus.Cancelled
      ],
      [TournamentStatus.Completed]: [],
      [TournamentStatus.Cancelled]: [TournamentStatus.Draft]
    }
    if (!validTransitions[from].includes(to)) {
      throw new Error(`Invalid tournament status transition: ${from} → ${to}`)
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
  }

  private updatePlayerRanking(
    tournamentId: string,
    memberId: string,
    delta: { points: number; wins: number; losses: number; draws: number }
  ): void {
    let ranking = Array.from(rankingStore.values()).find(
      (r) => r.tournamentId === tournamentId && r.memberId === memberId
    )

    if (!ranking) {
      ranking = {
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
    }

    ranking.points += delta.points
    ranking.wins += delta.wins
    ranking.losses += delta.losses
    ranking.draws += delta.draws
    ranking.updatedAt = new Date().toISOString()
    rankingStore.set(ranking.id, ranking)
  }

  private checkTournamentCompletion(tournamentId: string): void {
    const tournament = tournamentStore.get(tournamentId)
    if (!tournament || tournament.status !== TournamentStatus.Ongoing) return

    // For single/double elimination: check if final match is completed
    // For round robin: check if all matches are completed
    const tournamentMatches = Array.from(matchStore.values()).filter(
      (m) => m.tournamentId === tournamentId
    )

    const allCompleted = tournamentMatches.every(
      (m) => m.status === MatchStatus.Completed
    )

    if (allCompleted && tournamentMatches.length > 0) {
      tournament.status = TournamentStatus.Completed
      tournament.updatedAt = new Date().toISOString()
      tournamentStore.set(tournamentId, tournament)

      // Finalize rankings
      const rankings = Array.from(rankingStore.values())
        .filter((r) => r.tournamentId === tournamentId)
        .sort(
          (a, b) => b.points - a.points || b.wins - a.wins || a.losses - b.losses
        )

      rankings.forEach((r, index) => {
        r.rank = index + 1
        rankingStore.set(r.id, r)
      })
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Test helpers
  // ═══════════════════════════════════════════════════════════════════

  resetTournamentStoresForTests(): void {
    tournamentStore.clear()
    matchStore.clear()
    rankingStore.clear()
    teamRegistrationStore.clear()
  }
}
