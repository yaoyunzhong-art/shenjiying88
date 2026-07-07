import {
  IsString,
  IsNumber,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsNotEmpty,
  MinLength
} from 'class-validator'
import { Type } from 'class-transformer'

// ── Tool Call DTO ──

export class AgentToolCallDto {
  @IsString()
  @IsNotEmpty()
  id!: string

  @IsString()
  @IsNotEmpty()
  name!: string

  @IsNotEmpty()
  input!: unknown
}

// ── Message DTO ──

export class AgentMessageDto {
  @IsString()
  @IsNotEmpty()
  id!: string

  @IsString()
  @IsNotEmpty()
  sessionId!: string

  @IsString()
  @IsEnum(['system', 'user', 'assistant', 'tool'])
  role!: 'system' | 'user' | 'assistant' | 'tool'

  @IsString()
  @IsNotEmpty()
  content!: string

  @IsOptional()
  @IsString()
  toolCallId?: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgentToolCallDto)
  toolCalls?: AgentToolCallDto[]

  @IsString()
  timestamp!: string
}

// ── Create Session DTO ──

export class CreateSessionRequestDto {
  @IsString()
  @IsNotEmpty()
  configId!: string

  @IsString()
  @MinLength(1)
  userInput!: string

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  maxSteps?: number

  @IsOptional()
  @IsBoolean()
  enableReflection?: boolean

  @IsString()
  @IsNotEmpty()
  createdBy!: string

  @IsString()
  @IsNotEmpty()
  tenantId!: string
}

// ── Batch Item DTO ──

export class BatchAgentItemDto {
  @IsString()
  @IsNotEmpty()
  configId!: string

  @IsString()
  @MinLength(1)
  userInput!: string

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  maxSteps?: number

  @IsOptional()
  @IsBoolean()
  enableReflection?: boolean
}

// ── Batch Request DTO ──

export class BatchAgentRequestDto {
  @ValidateNested({ each: true })
  @Type(() => BatchAgentItemDto)
  @IsArray()
  @IsNotEmpty()
  items!: BatchAgentItemDto[]

  @IsString()
  @IsNotEmpty()
  createdBy!: string

  @IsString()
  @IsNotEmpty()
  tenantId!: string
}

// ── Quality Evaluation DTO ──

export class QualityEvaluationDto {
  @IsString()
  @IsNotEmpty()
  sessionId!: string

  @IsString()
  @MinLength(1)
  userInput!: string

  @IsString()
  @MinLength(1)
  agentOutput!: string

  @IsNumber()
  @Min(0)
  @Max(1)
  relevanceScore!: number

  @IsNumber()
  @Min(0)
  @Max(1)
  accuracyScore!: number

  @IsNumber()
  @Min(0)
  @Max(1)
  completenessScore!: number

  @IsNumber()
  @Min(0)
  @Max(1)
  safetyScore!: number

  @IsNumber()
  @Min(0)
  @Max(1)
  helpfulnessScore!: number

  @IsNumber()
  @Min(0)
  @Max(1)
  concisenessScore!: number

  @IsString()
  @IsNotEmpty()
  feedback!: string

  @IsString()
  @IsNotEmpty()
  evaluatedBy!: string

  @IsString()
  @IsNotEmpty()
  tenantId!: string
}
