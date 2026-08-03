import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import {
  MatchStatus,
  TeamRegistrationStatus,
  TournamentStatus,
  TournamentType,
  RedemptionStatus,
  PredictionStatus,
  type Match,
  type Ranking,
  type TeamRegistration,
  type Tournament,
  type TournamentPrizes,
  type TournamentRules,
  type RedemptionRecord,
  type PredictionRecord,
  type VoteRecord,
  type PopularityEntry
} from './tournament.entity'

// ── In-memory stores ──

const tournamentStore = new Map<string, Tournament>()
const matchStore = new Map<string, Match>()
const rankingStore = new Map<string, Ranking>()
const teamRegistrationStore = new Map<string, TeamRegistration>()
const redemptionStore = new Map<string, RedemptionRecord>()
const predictionStore = new Map<string, PredictionRecord>()
const voteStore = new Map<string, VoteRecord>()

// Participant points store (userId → points)
const participantPointsStore = new Map<string, Map<string, number>>()
// Prize stock store (prizeId → stock count)
const prizeStockStore = new Map<string, number>()

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
    minParticipants?: number
    entryFee?: number
    prizePool?: number
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
      minParticipants: input.minParticipants ?? 2,
      entryFee: input.entryFee ?? 0,
      prizePool: input.prizePool ?? 0,
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
      minParticipants?: number
      entryFee?: number
      prizePool?: number
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
    if (input.minParticipants !== undefined) tournament.minParticipants = input.minParticipants
    if (input.entryFee !== undefined) tournament.entryFee = input.entryFee
    if (input.prizePool !== undefined) tournament.prizePool = input.prizePool
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
  // 1. Redemption (兑换)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Redeem points for a prize in a tournament.
   * Validates: user has enough points, prize stock is available, tournament is ongoing.
   */
  redeem(input: {
    tournamentId: string
    tenantId: string
    userId: string
    prizeId: string
    points: number
  }): {
    success: boolean
    redemptionId: string
    remainingPoints: number
    estimatedDelivery: string
  } {
    const tournament = this.requireTournament(input.tournamentId, input.tenantId)

    if (tournament.status !== TournamentStatus.Ongoing) {
      throw new Error('Tournament is not ongoing; redemptions are only available during active tournaments')
    }

    // Check user points
    const userPoints = this.getUserPoints(input.tournamentId, input.userId)
    if (userPoints < input.points) {
      throw new Error(`Insufficient points: user has ${userPoints}, needs ${input.points}`)
    }

    // Check prize stock
    const stock = this.getPrizeStock(input.prizeId)
    if (stock <= 0) {
      throw new Error(`Prize ${input.prizeId} is out of stock`)
    }

    // Deduct points
    this.deductUserPoints(input.tournamentId, input.userId, input.points)

    // Reduce prize stock
    prizeStockStore.set(input.prizeId, stock - 1)

    // Determine prize label
    const prizeLabel = this.resolvePrizeLabel(tournament.prizes, input.prizeId)

    const now = new Date().toISOString()
    const estimatedDelivery = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days
    const redemption: RedemptionRecord = {
      id: `redemption-${randomUUID()}`,
      tournamentId: input.tournamentId,
      userId: input.userId,
      prizeId: input.prizeId,
      prizeLabel,
      pointsCost: input.points,
      status: RedemptionStatus.Pending,
      estimatedDelivery,
      createdAt: now,
      updatedAt: now
    }
    redemptionStore.set(redemption.id, redemption)

    // Async: trigger prize dispatch (simulated)
    this.triggerPrizeDispatch(redemption.id)

    return {
      success: true,
      redemptionId: redemption.id,
      remainingPoints: this.getUserPoints(input.tournamentId, input.userId),
      estimatedDelivery
    }
  }

  /**
   * Query all redemption records for a tournament.
   */
  listRedemptions(tournamentId: string, tenantId: string): RedemptionRecord[] {
    this.requireTournament(tournamentId, tenantId)
    return Array.from(redemptionStore.values())
      .filter((r) => r.tournamentId === tournamentId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  /**
   * Get a single redemption record by id.
   */
  getRedemption(redemptionId: string): RedemptionRecord | undefined {
    return redemptionStore.get(redemptionId)
  }

  // ═══════════════════════════════════════════════════════════════════
  // 2. Enhanced Join (观众加入)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Enhanced join tournament — supports spectator mode alongside existing participant registration.
   */
  joinTournament(input: {
    tournamentId: string
    tenantId: string
    userId: string
    joinType: 'PARTICIPANT' | 'SPECTATOR'
  }): Tournament {
    const tournament = this.requireTournament(input.tournamentId, input.tenantId)

    if (input.joinType === 'SPECTATOR') {
      // Spectator join: no ranking entry, just mark presence
      // No capacity or duplicate checks needed for spectators
      return tournament
    }

    // Participant: delegate to existing register method
    return this.registerParticipant(input.tournamentId, input.userId, input.tenantId)
  }

  // ═══════════════════════════════════════════════════════════════════
  // 3. Prediction (竞猜预测)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Place a prediction on a match. Points are locked immediately.
   * If the prediction is correct, the stake is doubled and returned.
   */
  placePrediction(input: {
    tournamentId: string
    tenantId: string
    userId: string
    matchId: string
    prediction: string
    stake: number
  }): PredictionRecord {
    const tournament = this.requireTournament(input.tournamentId, input.tenantId)

    if (tournament.status !== TournamentStatus.Ongoing) {
      throw new Error('Tournament is not ongoing; predictions are only available during active tournaments')
    }

    // Validate the match exists and belongs to this tournament
    const match = matchStore.get(input.matchId)
    if (!match || match.tournamentId !== input.tournamentId) {
      throw new Error(`Match not found: ${input.matchId}`)
    }

    // Check user points
    const userPoints = this.getUserPoints(input.tournamentId, input.userId)
    if (userPoints < input.stake) {
      throw new Error(`Insufficient points for prediction: user has ${userPoints}, needs ${input.stake}`)
    }

    // Lock the stake (deduct from available points)
    this.deductUserPoints(input.tournamentId, input.userId, input.stake)

    const now = new Date().toISOString()
    const prediction: PredictionRecord = {
      id: `prediction-${randomUUID()}`,
      tournamentId: input.tournamentId,
      matchId: input.matchId,
      userId: input.userId,
      prediction: input.prediction,
      stake: input.stake,
      status: PredictionStatus.Locked,
      createdAt: now,
      updatedAt: now
    }
    predictionStore.set(prediction.id, prediction)

    return prediction
  }

  /**
   * Settle all predictions for a completed match.
   * Winners get double their stake back.
   */
  settlePredictions(matchId: string, winnerPrediction: string, tenantId: string): number {
    const match = matchStore.get(matchId)
    if (!match) throw new Error(`Match not found: ${matchId}`)
    this.requireTournament(match.tournamentId, tenantId)

    const tournamentPredictions = Array.from(predictionStore.values()).filter(
      (p) => p.matchId === matchId && p.status === PredictionStatus.Locked
    )

    let settledCount = 0
    for (const pred of tournamentPredictions) {
      if (pred.prediction === winnerPrediction) {
        // Won: double stake back
        pred.status = PredictionStatus.Won
        const winnings = pred.stake * 2
        this.addUserPoints(match.tournamentId, pred.userId, winnings)
      } else {
        // Lost: stake forfeited
        pred.status = PredictionStatus.Lost
      }
      pred.updatedAt = new Date().toISOString()
      predictionStore.set(pred.id, pred)
      settledCount++
    }

    return settledCount
  }

  /**
   * Query predictions for a match or user.
   */
  getPredictions(filter: {
    tournamentId?: string
    matchId?: string
    userId?: string
  }): PredictionRecord[] {
    return Array.from(predictionStore.values()).filter((p) => {
      if (filter.tournamentId && p.tournamentId !== filter.tournamentId) return false
      if (filter.matchId && p.matchId !== filter.matchId) return false
      if (filter.userId && p.userId !== filter.userId) return false
      return true
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  // ═══════════════════════════════════════════════════════════════════
  // 4. Vote (人气投票)
  // ═══════════════════════════════════════════════════════════════════

  /**
   * Cast votes for a contestant. Each vote costs 1 point.
   */
  castVote(input: {
    tournamentId: string
    tenantId: string
    userId: string
    contestantId: string
    votes: number
  }): VoteRecord {
    const tournament = this.requireTournament(input.tournamentId, input.tenantId)

    if (tournament.status !== TournamentStatus.Ongoing) {
      throw new Error('Tournament is not ongoing; voting is only available during active tournaments')
    }

    // Check user points
    const userPoints = this.getUserPoints(input.tournamentId, input.userId)
    if (userPoints < input.votes) {
      throw new Error(`Insufficient points for voting: user has ${userPoints}, needs ${input.votes}`)
    }

    // Deduct points (1 point per vote)
    this.deductUserPoints(input.tournamentId, input.userId, input.votes)

    const now = new Date().toISOString()
    const vote: VoteRecord = {
      id: `vote-${randomUUID()}`,
      tournamentId: input.tournamentId,
      contestantId: input.contestantId,
      userId: input.userId,
      votes: input.votes,
      createdAt: now
    }
    voteStore.set(vote.id, vote)

    return vote
  }

  /**
   * Get popularity rankings for a tournament.
   */
  getPopularityRankings(tournamentId: string, tenantId: string): PopularityEntry[] {
    this.requireTournament(tournamentId, tenantId)

    const voteTotals = new Map<string, number>()
    for (const vote of voteStore.values()) {
      if (vote.tournamentId === tournamentId) {
        const current = voteTotals.get(vote.contestantId) ?? 0
        voteTotals.set(vote.contestantId, current + vote.votes)
      }
    }

    return Array.from(voteTotals.entries())
      .map(([contestantId, totalVotes]) => ({ contestantId, totalVotes }))
      .sort((a, b) => b.totalVotes - a.totalVotes)
  }

  /**
   * Set prize stock for a prize id (for test setup).
   */
  setPrizeStock(prizeId: string, stock: number): void {
    prizeStockStore.set(prizeId, stock)
  }

  /**
   * Add points to a user's balance for a tournament (for test setup).
   */
  addUserPoints(tournamentId: string, userId: string, points: number): void {
    if (!participantPointsStore.has(tournamentId)) {
      participantPointsStore.set(tournamentId, new Map())
    }
    const userPoints = participantPointsStore.get(tournamentId)!
    const current = userPoints.get(userId) ?? 0
    userPoints.set(userId, current + points)
  }

  /**
   * Get a user's current points balance for a tournament.
   */
  getUserPoints(tournamentId: string, userId: string): number {
    const userPoints = participantPointsStore.get(tournamentId)
    if (!userPoints) return 0
    return userPoints.get(userId) ?? 0
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

  private deductUserPoints(tournamentId: string, userId: string, points: number): void {
    if (!participantPointsStore.has(tournamentId)) {
      participantPointsStore.set(tournamentId, new Map())
    }
    const userPoints = participantPointsStore.get(tournamentId)!
    const current = userPoints.get(userId) ?? 0
    if (current < points) {
      throw new Error(`Insufficient points: user has ${current}, needs ${points}`)
    }
    userPoints.set(userId, current - points)
  }

  private getPrizeStock(prizeId: string): number {
    return prizeStockStore.get(prizeId) ?? 0
  }

  private resolvePrizeLabel(prizes: TournamentPrizes, prizeId: string): string {
    const prize = prizes[prizeId]
    if (prize) return prize.label
    return `Prize ${prizeId}`
  }

  private triggerPrizeDispatch(_redemptionId: string): void {
    // Async prize dispatch — in production this would enqueue a message
    // For now, this is a no-op that can be extended
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
    redemptionStore.clear()
    predictionStore.clear()
    voteStore.clear()
    participantPointsStore.clear()
    prizeStockStore.clear()
  }
}
