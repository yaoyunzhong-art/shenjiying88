import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
  IsObject,
  IsNumber
} from 'class-validator'
import 'reflect-metadata'
import {
  TournamentType,
  TournamentStatus,
  MatchStatus,
  type TournamentRules,
  type TournamentPrizes
} from './tournament.entity'

// ═══════════════════════════════════════════════════════════════════════
// Tournament DTOs
// ═══════════════════════════════════════════════════════════════════════

export class CreateTournamentDto {
  @IsString()
  name!: string

  @IsString()
  @IsOptional()
  description?: string

  @IsEnum(TournamentType)
  type!: TournamentType

  @IsString()
  gameName!: string

  @IsDateString()
  startDate!: string

  @IsDateString()
  endDate!: string

  @IsInt()
  @Min(2)
  maxParticipants!: number

  @IsObject()
  @IsOptional()
  rules?: TournamentRules

  @IsObject()
  @IsOptional()
  prizes?: TournamentPrizes

  @IsString()
  @IsOptional()
  bannerImage?: string
}

export class UpdateTournamentDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  description?: string

  @IsEnum(TournamentType)
  @IsOptional()
  type?: TournamentType

  @IsString()
  @IsOptional()
  gameName?: string

  @IsDateString()
  @IsOptional()
  startDate?: string

  @IsDateString()
  @IsOptional()
  endDate?: string

  @IsInt()
  @Min(2)
  @IsOptional()
  maxParticipants?: number

  @IsObject()
  @IsOptional()
  rules?: TournamentRules

  @IsObject()
  @IsOptional()
  prizes?: TournamentPrizes

  @IsString()
  @IsOptional()
  bannerImage?: string
}

export class UpdateTournamentStatusDto {
  @IsEnum(TournamentStatus)
  status!: TournamentStatus
}

export class TournamentQueryDto {
  @IsEnum(TournamentStatus)
  @IsOptional()
  status?: TournamentStatus

  @IsEnum(TournamentType)
  @IsOptional()
  type?: TournamentType

  @IsString()
  @IsOptional()
  storeId?: string

  @IsString()
  @IsOptional()
  brandId?: string
}

// ═══════════════════════════════════════════════════════════════════════
// Match DTOs
// ═══════════════════════════════════════════════════════════════════════

export class MatchResultDto {
  @IsInt()
  @Min(0)
  score1!: number

  @IsInt()
  @Min(0)
  score2!: number
}

export class MatchQueryDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  round?: number

  @IsEnum(MatchStatus)
  @IsOptional()
  status?: MatchStatus
}

// ═══════════════════════════════════════════════════════════════════════
// Registration DTOs
// ═══════════════════════════════════════════════════════════════════════

export class RegisterParticipantDto {
  @IsString()
  memberId!: string
}

export class RegisterTeamDto {
  @IsString()
  teamName!: string

  @IsString()
  captainId!: string

  @IsArray()
  @IsString({ each: true })
  memberIds!: string[]
}

export class ApproveRejectTeamDto {
  @IsString()
  teamRegId!: string
}

// ═══════════════════════════════════════════════════════════════════════
// Ranking DTOs
// ═══════════════════════════════════════════════════════════════════════

export class RankingQueryDto {
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number
}
