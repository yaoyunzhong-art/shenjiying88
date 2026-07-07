/**
 * Champion DTO (Data Transfer Object)
 *
 * 请求/响应数据验证与转换
 */

import 'reflect-metadata';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ChampionRole, ContributionKind } from './champion.entity';

/** 注册 Champion 请求体 */
export class RegisterChampionDto {
  @IsString()
  name!: string;

  @IsEnum(ChampionRole)
  role!: ChampionRole;

  @IsDateString()
  @IsOptional()
  joinedAt?: string;
}

/** 记录贡献请求体 */
export class RecordContributionDto {
  @IsString()
  championId!: string;

  @IsEnum(ContributionKind)
  kind!: ContributionKind;

  @IsString()
  refId!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  @IsOptional()
  occurredAt?: string;
}

/** 排行榜查询参数 */
export class RankingQueryDto {
  @IsEnum(ChampionRole)
  @IsOptional()
  role?: ChampionRole;
}

/** 时间线查询参数 */
export class TimelineQueryDto {
  @IsString()
  @IsOptional()
  championId?: string;

  @IsDateString()
  @IsOptional()
  sinceDate?: string;
}

/** Champion 响应 DTO */
export class ChampionResponseDto {
  id!: string;
  name!: string;
  role!: ChampionRole;
  joinedAt!: string;
  contributions!: Array<{
    id: string;
    kind: ContributionKind;
    weight: number;
    refId: string;
    occurredAt: string;
    description?: string;
  }>;
  totalScore!: number;
}

/** 排行榜响应 DTO */
export class RankingResponseDto {
  entries!: Array<{
    championId: string;
    name: string;
    role: ChampionRole;
    totalScore: number;
    commits: number;
    reviews: number;
    rfcs: number;
    pulseReviews: number;
    retros: number;
    rank: number;
  }>;
  totalChampions!: number;
}

/** 知识地图响应 DTO */
export class KnowledgeMapResponseDto {
  totalChampions!: number;
  totalContributions!: number;
  totalScore!: number;
  byKind!: Record<string, number>;
  byRole!: Record<string, number>;
}
