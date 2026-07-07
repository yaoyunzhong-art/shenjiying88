import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsEnum,
  Min,
  Max,
  ValidateNested,
  ArrayMinSize,
  IsObject
} from 'class-validator'
import { Type } from 'class-transformer'
import type { ContentType } from './training.entity'

// ─── ModuleContent DTO ─────────────────────────────────────────

export class ModuleContentDto {
  @IsString()
  @IsNotEmpty()
  contentId!: string

  @IsString()
  @IsEnum(['video', 'document', 'quiz', 'assignment', 'live'])
  type!: ContentType

  @IsString()
  @IsNotEmpty()
  title!: string

  @IsOptional()
  @IsString()
  url?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  durationMinutes?: number

  @IsOptional()
  @IsString()
  transcript?: string
}

// ─── QuizQuestion DTO ──────────────────────────────────────────

export class QuizQuestionDto {
  @IsString()
  @IsNotEmpty()
  questionId!: string

  @IsString()
  @IsNotEmpty()
  text!: string

  @IsString()
  @IsEnum(['single_choice', 'multiple_choice', 'true_false', 'short_answer'])
  type!: 'single_choice' | 'multiple_choice' | 'true_false' | 'short_answer'

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[]

  @IsNotEmpty()
  correctAnswer!: string | string[]

  @IsOptional()
  @IsString()
  explanation?: string

  @IsNumber()
  @Min(0)
  points!: number
}

// ─── Quiz DTO ──────────────────────────────────────────────────

export class QuizDto {
  @IsString()
  @IsNotEmpty()
  quizId!: string

  @ValidateNested({ each: true })
  @Type(() => QuizQuestionDto)
  @IsArray()
  @ArrayMinSize(1)
  questions!: QuizQuestionDto[]

  @IsOptional()
  @IsNumber()
  @Min(0)
  timeLimitMinutes?: number

  @IsNumber()
  @Min(1)
  maxAttempts!: number
}

// ─── CourseModule DTO ──────────────────────────────────────────

export class CourseModuleDto {
  @IsString()
  @IsNotEmpty()
  moduleId!: string

  @IsString()
  @IsNotEmpty()
  title!: string

  @ValidateNested({ each: true })
  @Type(() => ModuleContentDto)
  @IsArray()
  @ArrayMinSize(1)
  contents!: ModuleContentDto[]

  @IsOptional()
  @ValidateNested()
  @Type(() => QuizDto)
  quiz?: QuizDto

  @IsNumber()
  @Min(0)
  order!: number
}

// ─── CreateCourse DTO ──────────────────────────────────────────

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  title!: string

  @IsString()
  @IsNotEmpty()
  description!: string

  @ValidateNested({ each: true })
  @Type(() => CourseModuleDto)
  @IsArray()
  @ArrayMinSize(1)
  modules!: CourseModuleDto[]

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  targetRoles!: string[]

  @IsNumber()
  @Min(1)
  estimatedMinutes!: number

  @IsNumber()
  @Min(0)
  @Max(100)
  passingScore!: number

  @IsOptional()
  @IsString()
  certificateTemplate?: string
}

// ─── Enroll DTO ────────────────────────────────────────────────

export class EnrollDto {
  @IsString()
  @IsNotEmpty()
  userId!: string

  @IsString()
  @IsNotEmpty()
  courseId!: string
}

// ─── UpdateProgress DTO ────────────────────────────────────────

export class UpdateProgressDto {
  @IsString()
  @IsNotEmpty()
  userId!: string

  @IsString()
  @IsNotEmpty()
  courseId!: string

  @IsString()
  @IsNotEmpty()
  moduleId!: string
}

// ─── StartQuiz DTO ─────────────────────────────────────────────

export class StartQuizDto {
  @IsString()
  @IsNotEmpty()
  userId!: string

  @IsString()
  @IsNotEmpty()
  courseId!: string
}

// ─── SubmitQuiz DTO ────────────────────────────────────────────

export class SubmitQuizDto {
  @IsString()
  @IsNotEmpty()
  attemptId!: string

  @IsObject()
  answers!: Record<string, string | string[]>
}

// ─── GenerateCertificate DTO ───────────────────────────────────

export class GenerateCertificateDto {
  @IsString()
  @IsNotEmpty()
  userId!: string

  @IsString()
  @IsNotEmpty()
  courseId!: string
}

// ─── RoleCoursesQuery DTO ──────────────────────────────────────

export class RoleCoursesQueryDto {
  @IsString()
  @IsNotEmpty()
  role!: string
}
