import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'

// ── Types ──────────────────────────────────────────────────────────────────

export enum TournamentLevel {
  Daily = 'DAILY',
  Weekly = 'WEEKLY',
  Monthly = 'MONTHLY',
  City = 'CITY'
}

export enum DailyTournamentStatus {
  Pending = 'PENDING',
  Registration = 'REGISTRATION',
  InProgress = 'IN_PROGRESS',
  Settled = 'SETTLED'
}

export enum WeeklyTournamentStatus {
  Registration = 'REGISTRATION',
  InProgress = 'IN_PROGRESS',
  Completed = 'COMPLETED'
}

export enum MonthlyTournamentStatus {
  Qualifying = 'QUALIFYING',
  Finals = 'FINALS',
  ChampionCrowned = 'CHAMPION_CROWNED'
}

export enum CityTournamentStatus {
  Regional = 'REGIONAL',
  CityFinal = 'CITY_FINAL',
  ChampionAwarded = 'CHAMPION_AWARDED'
}

export interface DailyTournamentConfig {
  name: string
  date: string
  entryFee?: number
  prizePool?: number
  maxParticipants?: number
}

export interface WeeklyTournamentConfig {
  name: string
  weekNumber: number
  year: number
  entryFee?: number
  prizePool?: number
}

export interface MonthlyTournamentConfig {
  name: string
  month: number
  year: number
  entryFee?: number
  prizePool?: number
  finalistCount?: number
}

export interface CityTournamentConfig {
  city: string
  name: string
  entryFee?: number
  prizePool?: number
}

export interface DailyParticipant {
  memberId: string
  joinedAt: string
  score?: number
  adjustedScore?: number
  submittedAt?: string
  rank?: number
}

export interface WeeklyParticipant {
  memberId: string
  memberLevel: number
  scores: number[]
  bestScore: number
  adjustedBestScore: number
  submissions: string[]
  crownGranted: boolean
}

export interface MonthlyParticipant {
  memberId: string
  qualifyingScore: number
  isFinalist: boolean
  finalsScore?: number
  isChampion: boolean
}

export interface CityParticipant {
  memberId: string
  city: string
  regionalScore?: number
  cityScore?: number
  isQualified: boolean
  isCityChampion: boolean
}

// ── In-memory stores ───────────────────────────────────────────────────────

const dailyTournamentStore = new Map<string, DailyTournament>()
const dailyParticipantStore = new Map<string, DailyParticipant>()
const weeklyTournamentStore = new Map<string, WeeklyTournament>()
const weeklyParticipantStore = new Map<string, WeeklyParticipant>()
const monthlyTournamentStore = new Map<string, MonthlyTournament>()
const monthlyParticipantStore = new Map<string, MonthlyParticipant>()
const cityTournamentStore = new Map<string, CityTournament>()
const cityParticipantStore = new Map<string, CityParticipant>()
const memberLevelStore = new Map<string, number>()

// ── Interfaces ─────────────────────────────────────────────────────────────

export interface DailyTournament {
  id: string
  name: string
  date: string
  status: DailyTournamentStatus
  entryFee: number
  prizePool: number
  maxParticipants: number
  currentParticipants: number
  rewards?: Record<string, number>
  createdAt: string
}

export interface WeeklyTournament {
  id: string
  name: string
  weekNumber: number
  year: number
  status: WeeklyTournamentStatus
  entryFee: number
  prizePool: number
  championId?: string
  championTitle?: string
  createdAt: string
}

export interface MonthlyTournament {
  id: string
  name: string
  month: number
  year: number
  status: MonthlyTournamentStatus
  entryFee: number
  prizePool: number
  finalistCount: number
  finalists: string[]
  championId?: string
  createdAt: string
}

export interface CityTournament {
  id: string
  city: string
  name: string
  status: CityTournamentStatus
  entryFee: number
  prizePool: number
  championId?: string
  createdAt: string
}

// ── Service ────────────────────────────────────────────────────────────────

@Injectable()
export class TournamentL1L4Service {
  constructor() {
    // Initialize some member levels for handicap calculation
    memberLevelStore.set('member-pro-1', 9)
    memberLevelStore.set('member-pro-2', 8)
    memberLevelStore.set('member-amateur-1', 3)
    memberLevelStore.set('member-amateur-2', 2)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HandicapSystem (P1-9)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Apply handicap to a member's base score.
   * Higher level members give 10% handicap per level difference to lower level members.
   * This ensures fair competition across different skill levels.
   */
  applyHandicap(memberId: string, baseScore: number): number {
    const memberLevel = this.getMemberLevel(memberId)
    const handicapPercentage = this.calculateHandicapPercentage(memberId)
    const adjustedScore = baseScore * (1 + handicapPercentage)
    return Math.round(adjustedScore * 100) / 100
  }

  /**
   * Calculate adjusted score considering member's level and handicap.
   * Lower level members get bonus, higher level members get no bonus.
   */
  calculateAdjustedScore(memberId: string, rawScore: number): number {
    const memberLevel = this.getMemberLevel(memberId)
    // Each level difference = 10% adjustment
    // Base level assumed to be 5
    const baseLevel = 5
    const levelDiff = memberLevel - baseLevel

    if (levelDiff <= 0) {
      // Lower or equal level: get handicap bonus
      const bonus = Math.abs(levelDiff) * 0.1
      return Math.round(rawScore * (1 + bonus) * 100) / 100
    } else {
      // Higher level: no bonus, raw score stands
      return rawScore
    }
  }

  private calculateHandicapPercentage(memberId: string): number {
    const memberLevel = this.getMemberLevel(memberId)
    const baseLevel = 5
    const diff = baseLevel - memberLevel
    // Each level below base gives 10% handicap
    return Math.max(0, diff * 0.1)
  }

  private getMemberLevel(memberId: string): number {
    return memberLevelStore.get(memberId) ?? 5 // default level 5
  }

  setMemberLevel(memberId: string, level: number): void {
    memberLevelStore.set(memberId, level)
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DailyTournament (L1)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create a daily tournament (runs every day)
   */
  createDaily(config: DailyTournamentConfig): DailyTournament {
    const now = new Date().toISOString()
    const tournament: DailyTournament = {
      id: `daily-${randomUUID()}`,
      name: config.name,
      date: config.date,
      status: DailyTournamentStatus.Registration,
      entryFee: config.entryFee ?? 0,
      prizePool: config.prizePool ?? 100,
      maxParticipants: config.maxParticipants ?? 100,
      currentParticipants: 0,
      createdAt: now
    }
    dailyTournamentStore.set(tournament.id, tournament)
    return tournament
  }

  /**
   * Join a daily tournament
   */
  join(tournamentId: string, memberId: string): DailyParticipant {
    const tournament = this.requireDailyTournament(tournamentId)

    if (tournament.status !== DailyTournamentStatus.Registration) {
      throw new Error('Tournament is not open for registration')
    }

    if (tournament.currentParticipants >= tournament.maxParticipants) {
      throw new Error('Tournament is full')
    }

    // Check if already joined
    const existing = Array.from(dailyParticipantStore.values()).find(
      (p) => p.tournamentId === tournamentId && p.memberId === memberId
    )
    if (existing) {
      throw new Error('Already joined this tournament')
    }

    tournament.currentParticipants += 1
    dailyTournamentStore.set(tournamentId, tournament)

    const participant: DailyParticipant = {
      memberId,
      tournamentId,
      joinedAt: new Date().toISOString()
    }
    dailyParticipantStore.set(`${tournamentId}-${memberId}`, participant)
    return participant
  }

  /**
   * Submit score for daily tournament
   */
  submitScore(
    tournamentId: string,
    memberId: string,
    score: number
  ): DailyParticipant {
    const tournament = this.requireDailyTournament(tournamentId)

    if (tournament.status === DailyTournamentStatus.Settled) {
      throw new Error('Tournament already settled')
    }

    const key = `${tournamentId}-${memberId}`
    const participant = dailyParticipantStore.get(key)
    if (!participant) {
      throw new Error('Not a participant in this tournament')
    }

    // Apply handicap before storing
    const adjustedScore = this.calculateAdjustedScore(memberId, score)
    participant.score = score
    participant.adjustedScore = adjustedScore
    participant.submittedAt = new Date().toISOString()

    // Auto-start tournament on first score submission
    if (tournament.status === DailyTournamentStatus.Registration) {
      tournament.status = DailyTournamentStatus.InProgress
      dailyTournamentStore.set(tournamentId, tournament)
    }

    dailyParticipantStore.set(key, participant)
    return participant
  }

  /**
   * Get leaderboard for daily tournament
   * Sorted by adjustedScore desc, then by submittedAt asc for ties
   */
  getLeaderboard(tournamentId: string): DailyParticipant[] {
    this.requireDailyTournament(tournamentId)

    const participants = Array.from(dailyParticipantStore.values())
      .filter((p) => p.tournamentId === tournamentId && p.score !== undefined)
      .sort((a, b) => {
        // First by adjusted score descending
        const scoreDiff = (b.adjustedScore ?? 0) - (a.adjustedScore ?? 0)
        if (scoreDiff !== 0) return scoreDiff
        // Tie-breaker: earlier submission wins
        return (a.submittedAt ?? '').localeCompare(b.submittedAt ?? '')
      })
      .map((p, index) => ({ ...p, rank: index + 1 }))

    return participants
  }

  /**
   * Settle tournament and distribute rewards
   */
  settle(tournamentId: string): { champion: DailyParticipant; rewards: Record<string, number> } {
    const tournament = this.requireDailyTournament(tournamentId)

    if (tournament.status === DailyTournamentStatus.Settled) {
      throw new Error('Tournament already settled')
    }

    // Close tournament
    tournament.status = DailyTournamentStatus.Settled
    dailyTournamentStore.set(tournamentId, tournament)

    // Get leaderboard
    const leaderboard = this.getLeaderboard(tournamentId)
    if (leaderboard.length === 0) {
      throw new Error('No participants with scores')
    }

    const champion = leaderboard[0]
    const rewards = this.distributeDailyRewards(tournament, leaderboard)

    return { champion, rewards }
  }

  private distributeDailyRewards(
    tournament: DailyTournament,
    leaderboard: DailyParticipant[]
  ): Record<string, number> {
    const rewards: Record<string, number> = {}
    const prizePool = tournament.prizePool

    // 1st place: 50%, 2nd place: 30%, 3rd place: 20%
    const distribution = [0.5, 0.3, 0.2]
    leaderboard.slice(0, 3).forEach((participant, index) => {
      const reward = Math.floor(prizePool * distribution[index])
      rewards[participant.memberId] = reward
    })

    return rewards
  }

  private requireDailyTournament(tournamentId: string): DailyTournament {
    const tournament = dailyTournamentStore.get(tournamentId)
    if (!tournament) {
      throw new Error(`Daily tournament not found: ${tournamentId}`)
    }
    return tournament
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WeeklyTournament (L2)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create weekly tournament
   */
  createWeekly(config: WeeklyTournamentConfig): WeeklyTournament {
    const now = new Date().toISOString()
    const tournament: WeeklyTournament = {
      id: `weekly-${randomUUID()}`,
      name: config.name,
      weekNumber: config.weekNumber,
      year: config.year,
      status: WeeklyTournamentStatus.Registration,
      entryFee: config.entryFee ?? 0,
      prizePool: config.prizePool ?? 500,
      createdAt: now
    }
    weeklyTournamentStore.set(tournament.id, tournament)
    return tournament
  }

  /**
   * Get weekly rankings sorted by best score
   */
  getWeeklyRankings(weekNumber: number, year?: number): WeeklyParticipant[] {
    const participants = Array.from(weeklyParticipantStore.values())
      .filter((p) => {
        const tournament = weeklyTournamentStore.get(p.tournamentId)
        return (
          tournament &&
          tournament.weekNumber === weekNumber &&
          (year ? tournament.year === year : true)
        )
      })
      .sort((a, b) => b.adjustedBestScore - a.adjustedBestScore)
      .map((p, index) => ({ ...p, rank: index + 1 }))

    return participants
  }

  /**
   * Submit score for weekly tournament (multiple submissions allowed)
   */
  submitWeeklyScore(
    tournamentId: string,
    memberId: string,
    score: number
  ): WeeklyParticipant {
    const tournament = this.requireWeeklyTournament(tournamentId)

    if (tournament.status === WeeklyTournamentStatus.Completed) {
      throw new Error('Tournament already completed')
    }

    const key = `${tournamentId}-${memberId}`
    let participant = weeklyParticipantStore.get(key)

    if (!participant) {
      participant = {
        memberId,
        tournamentId,
        memberLevel: this.getMemberLevel(memberId),
        scores: [],
        bestScore: 0,
        adjustedBestScore: 0,
        submissions: [],
        crownGranted: false
      }
    }

    // Record submission
    participant.scores.push(score)
    participant.submissions.push(new Date().toISOString())

    // Update best score
    const rawBest = Math.max(...participant.scores)
    const adjustedBest = this.calculateAdjustedScore(memberId, rawBest)
    participant.bestScore = rawBest
    participant.adjustedBestScore = adjustedBest

    // Auto-start if first submission
    if (tournament.status === WeeklyTournamentStatus.Registration) {
      tournament.status = WeeklyTournamentStatus.InProgress
      weeklyTournamentStore.set(tournamentId, tournament)
    }

    weeklyParticipantStore.set(key, participant)
    return participant
  }

  /**
   * Crown weekly champion
   */
  crownChampion(tournamentId: string): WeeklyParticipant {
    const tournament = this.requireWeeklyTournament(tournamentId)

    if (tournament.status === WeeklyTournamentStatus.Completed) {
      throw new Error('Tournament already completed')
    }

    const rankings = this.getWeeklyRankings(
      tournament.weekNumber,
      tournament.year
    ).filter((p) => p.tournamentId === tournamentId)

    if (rankings.length === 0) {
      throw new Error('No participants')
    }

    const champion = rankings[0]
    champion.crownGranted = true
    tournament.championId = champion.memberId
    tournament.championTitle = `Week ${tournament.weekNumber} Champion`
    tournament.status = WeeklyTournamentStatus.Completed

    weeklyTournamentStore.set(tournamentId, tournament)
    weeklyParticipantStore.set(`${tournamentId}-${champion.memberId}`, champion)

    return champion
  }

  private requireWeeklyTournament(tournamentId: string): WeeklyTournament {
    const tournament = weeklyTournamentStore.get(tournamentId)
    if (!tournament) {
      throw new Error(`Weekly tournament not found: ${tournamentId}`)
    }
    return tournament
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MonthlyTournament (L3)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create monthly tournament
   */
  createMonthly(config: MonthlyTournamentConfig): MonthlyTournament {
    const now = new Date().toISOString()
    const tournament: MonthlyTournament = {
      id: `monthly-${randomUUID()}`,
      name: config.name,
      month: config.month,
      year: config.year,
      status: MonthlyTournamentStatus.Qualifying,
      entryFee: config.entryFee ?? 0,
      prizePool: config.prizePool ?? 2000,
      finalistCount: config.finalistCount ?? 8,
      finalists: [],
      createdAt: now
    }
    monthlyTournamentStore.set(tournament.id, tournament)
    return tournament
  }

  /**
   * Submit qualifying score for monthly tournament
   */
  submitMonthlyQualifyingScore(
    tournamentId: string,
    memberId: string,
    score: number
  ): MonthlyParticipant {
    const tournament = this.requireMonthlyTournament(tournamentId)

    if (tournament.status === MonthlyTournamentStatus.ChampionCrowned) {
      throw new Error('Tournament already concluded')
    }

    const key = `${tournamentId}-${memberId}`
    let participant = monthlyParticipantStore.get(key)

    if (!participant) {
      participant = {
        memberId,
        tournamentId,
        qualifyingScore: 0,
        isFinalist: false,
        isChampion: false
      }
    }

    participant.qualifyingScore = Math.max(participant.qualifyingScore, score)
    monthlyParticipantStore.set(key, participant)
    return participant
  }

  /**
   * Get monthly finalists (top N by qualifying score)
   */
  getMonthlyFinalists(tournamentId: string): MonthlyParticipant[] {
    const tournament = this.requireMonthlyTournament(tournamentId)

    const participants = Array.from(monthlyParticipantStore.values())
      .filter((p) => p.tournamentId === tournamentId)
      .sort((a, b) => b.qualifyingScore - a.qualifyingScore)
      .slice(0, tournament.finalistCount)

    return participants
  }

  /**
   * Hold finals and determine champion
   */
  holdFinals(
    tournamentId: string,
    finalistIds: string[],
    finalsScores: Record<string, number>
  ): MonthlyParticipant {
    const tournament = this.requireMonthlyTournament(tournamentId)

    // Update finalists
    finalistIds.forEach((id) => {
      const key = `${tournamentId}-${id}`
      const participant = monthlyParticipantStore.get(key)
      if (participant) {
        participant.isFinalist = true
        monthlyParticipantStore.set(key, participant)
      }
    })

    tournament.finalists = finalistIds
    tournament.status = MonthlyTournamentStatus.Finals

    // Determine champion (highest finals score)
    let championId = finalistIds[0]
    let highestScore = -Infinity

    for (const [memberId, score] of Object.entries(finalsScores)) {
      if (finalistIds.includes(memberId) && score > highestScore) {
        highestScore = score
        championId = memberId
      }
    }

    const championKey = `${tournamentId}-${championId}`
    const champion = monthlyParticipantStore.get(championKey)
    if (!champion) {
      throw new Error('Champion not found')
    }

    champion.isChampion = true
    champion.finalsScore = finalsScores[championId]
    tournament.championId = championId
    tournament.status = MonthlyTournamentStatus.ChampionCrowned

    monthlyTournamentStore.set(tournamentId, tournament)
    monthlyParticipantStore.set(championKey, champion)

    return champion
  }

  private requireMonthlyTournament(tournamentId: string): MonthlyTournament {
    const tournament = monthlyTournamentStore.get(tournamentId)
    if (!tournament) {
      throw new Error(`Monthly tournament not found: ${tournamentId}`)
    }
    return tournament
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CityTournament (L4)
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Create city tournament
   */
  createCity(city: string, config: CityTournamentConfig): CityTournament {
    const now = new Date().toISOString()
    const tournament: CityTournament = {
      id: `city-${randomUUID()}`,
      city,
      name: config.name,
      status: CityTournamentStatus.Regional,
      entryFee: config.entryFee ?? 0,
      prizePool: config.prizePool ?? 5000,
      createdAt: now
    }
    cityTournamentStore.set(tournament.id, tournament)
    return tournament
  }

  /**
   * Qualify from regional to city final
   */
  qualifyFromRegional(
    cityTournamentId: string,
    memberId: string,
    regionalScore: number
  ): CityParticipant {
    const tournament = this.requireCityTournament(cityTournamentId)

    if (tournament.status !== CityTournamentStatus.Regional) {
      throw new Error('Tournament not in regional phase')
    }

    const key = `${cityTournamentId}-${memberId}`
    let participant = cityParticipantStore.get(key)

    if (!participant) {
      participant = {
        memberId,
        tournamentId: cityTournamentId,
        city: tournament.city,
        isQualified: false,
        isCityChampion: false
      }
    }

    participant.regionalScore = regionalScore
    participant.isQualified = true
    cityParticipantStore.set(key, participant)

    return participant
  }

  /**
   * Award city champion
   */
  awardCityChampion(
    cityTournamentId: string,
    cityScores: Record<string, number>
  ): CityParticipant {
    const tournament = this.requireCityTournament(cityTournamentId)

    // Update city scores for all qualified participants
    for (const [memberId, score] of Object.entries(cityScores)) {
      const key = `${cityTournamentId}-${memberId}`
      const participant = cityParticipantStore.get(key)
      if (participant) {
        participant.cityScore = score
        cityParticipantStore.set(key, participant)
      }
    }

    // Get qualified participants
    const qualified = Array.from(cityParticipantStore.values())
      .filter((p) => p.tournamentId === cityTournamentId && p.isQualified)

    if (qualified.length === 0) {
      throw new Error('No qualified participants')
    }

    // Find highest score
    let champion = qualified[0]
    let highestScore = 0

    for (const p of qualified) {
      const score = p.cityScore ?? 0
      if (score > highestScore) {
        highestScore = score
        champion = p
      }
    }

    champion.isCityChampion = true
    champion.cityScore = highestScore
    tournament.championId = champion.memberId
    tournament.status = CityTournamentStatus.ChampionAwarded

    cityTournamentStore.set(cityTournamentId, tournament)
    cityParticipantStore.set(`${cityTournamentId}-${champion.memberId}`, champion)

    return champion
  }

  private requireCityTournament(tournamentId: string): CityTournament {
    const tournament = cityTournamentStore.get(tournamentId)
    if (!tournament) {
      throw new Error(`City tournament not found: ${tournamentId}`)
    }
    return tournament
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Test helpers
  // ═══════════════════════════════════════════════════════════════════════════

  resetStoresForTests(): void {
    dailyTournamentStore.clear()
    dailyParticipantStore.clear()
    weeklyTournamentStore.clear()
    weeklyParticipantStore.clear()
    monthlyTournamentStore.clear()
    monthlyParticipantStore.clear()
    cityTournamentStore.clear()
    cityParticipantStore.clear()
    memberLevelStore.clear()
  }
}

// Extend DailyParticipant to include tournamentId
declare module './tournament-l1-l4.service' {
  interface DailyParticipant {
    tournamentId: string
  }
}

// Extend WeeklyParticipant to include tournamentId
declare module './tournament-l1-l4.service' {
  interface WeeklyParticipant {
    tournamentId: string
    rank?: number
  }
}

// Extend MonthlyParticipant to include tournamentId
declare module './tournament-l1-l4.service' {
  interface MonthlyParticipant {
    tournamentId: string
  }
}

// Extend CityParticipant to include tournamentId
declare module './tournament-l1-l4.service' {
  interface CityParticipant {
    tournamentId: string
  }
}
