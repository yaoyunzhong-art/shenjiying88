import type { RequestTenantContext } from '../tenant/tenant.types'

// ── Tournament ──

export enum TournamentType {
  SingleElimination = 'SINGLE_ELIMINATION',
  DoubleElimination = 'DOUBLE_ELIMINATION',
  RoundRobin = 'ROUND_ROBIN',
  League = 'LEAGUE'
}

export enum TournamentStatus {
  Draft = 'DRAFT',
  Open = 'OPEN',
  Ongoing = 'ONGOING',
  Completed = 'COMPLETED',
  Cancelled = 'CANCELLED'
}

export interface TournamentPrizes {
  first?: { label: string; value: string }
  second?: { label: string; value: string }
  third?: { label: string; value: string }
  participation?: { label: string; value: string }
  [key: string]: { label: string; value: string } | undefined
}

export interface TournamentRules {
  matchFormat?: string // e.g. 'BO1', 'BO3', 'BO5'
  scoreMode?: string // e.g. 'POINTS', 'TIME', 'WINS'
  maxScore?: number
  allowDraws?: boolean
  overtime?: boolean
  [key: string]: unknown
}

export interface Tournament {
  id: string
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
  currentParticipants: number
  status: TournamentStatus
  rules: TournamentRules
  prizes: TournamentPrizes
  bannerImage?: string
  createdAt: string
  updatedAt: string
}

// ── Match ──

export enum MatchStatus {
  Pending = 'PENDING',
  Ongoing = 'ONGOING',
  Completed = 'COMPLETED',
  Disputed = 'DISPUTED'
}

export interface Match {
  id: string
  tournamentId: string
  round: number
  bracketPosition: number
  player1Id: string // memberId
  player2Id?: string // memberId (nullable for bye rounds)
  winnerId?: string // memberId
  score1: number
  score2: number
  status: MatchStatus
  scheduledAt?: string
  playedAt?: string
  createdAt: string
  updatedAt: string
}

// ── Ranking ──

export interface Ranking {
  id: string
  tournamentId: string
  memberId: string
  rank: number
  points: number
  wins: number
  losses: number
  draws: number
  updatedAt: string
}

// ── TeamRegistration ──

export enum TeamRegistrationStatus {
  Pending = 'PENDING',
  Approved = 'APPROVED',
  Rejected = 'REJECTED'
}

export interface TeamRegistration {
  id: string
  tournamentId: string
  teamName: string
  captainId: string // memberId
  memberIds: string[] // memberId[]
  status: TeamRegistrationStatus
  createdAt: string
  updatedAt: string
}
