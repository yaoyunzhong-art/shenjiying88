import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common'
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsNumber, Min } from 'class-validator'
import { TrafficGovernanceGuard } from '../../common/guards/traffic-governance.guard'
import { MinorProtectionService, type VerificationMethod } from './minor-protection.service'
import type { MinorProtectionProfile, ParentalConsent, TimeUsageRecord, SpendRecord } from './minor-protection.service'

// ── DTO ─────────────────────────────────────────────────────────────────────

class RegisterProfileDto { @IsString() userId!: string; @IsString() tenantId!: string; @IsString() @IsDateString() birthDate!: string; @IsOptional() @IsString() verificationMethod?: string }
class VerifyAgeDto { @IsString() @IsEnum(['id_card','face','parental_consent','none']) method!: VerificationMethod }
class CreateConsentDto { @IsString() minorUserId!: string; @IsString() parentUserId!: string; @IsString() parentName!: string; @IsString() parentIdCard!: string; @IsString() relationship!: string; @IsString() @IsEnum(['full','partial']) consentType!: 'full' | 'partial'; @IsDateString() effectiveFrom!: string; @IsOptional() @IsDateString() effectiveTo?: string }
class CheckTimeDto { @IsNumber() @Min(1) sessionDurationMin!: number }
class CheckSpendDto { @IsNumber() @Min(0.01) amount!: number }
class CheckContentDto { @IsString() rating!: string }
class RecordTimeDto { @IsNumber() @Min(1) sessionDurationMin!: number }
class RecordSpendDto { @IsNumber() @Min(0.01) amount!: number; @IsString() category!: string; @IsString() description!: string }
class ReportQueryDto { @IsString() @IsDateString() startDate!: string; @IsString() @IsDateString() endDate!: string }

@Controller('minor-protection')
@UseGuards(TrafficGovernanceGuard)
@UsePipes(new ValidationPipe({ transform: true }))
export class MinorProtectionController {
  constructor(private readonly service: MinorProtectionService) {}

  @Post('profile')
  registerProfile(@Body() dto: RegisterProfileDto): Promise<MinorProtectionProfile> {
    return this.service.registerProfile(dto.userId, dto.tenantId, dto.birthDate, (dto.verificationMethod as VerificationMethod) ?? 'none')
  }

  @Get('profile/:userId')
  getProfile(@Param('userId') uid: string): Promise<MinorProtectionProfile> { return this.service.getProfile(uid) }

  @Patch('profile/:userId/verify')
  verifyAge(@Param('userId') uid: string, @Body() dto: VerifyAgeDto): Promise<MinorProtectionProfile> { return this.service.verifyAge(uid, dto.method) }

  @Post('consent')
  createConsent(@Body() dto: CreateConsentDto): Promise<ParentalConsent> { return this.service.createParentalConsent(dto) }

  @Post('consent/:id/approve')
  approveConsent(@Param('id') id: string): Promise<ParentalConsent> { return this.service.approveConsent(id) }

  @Get('consent/:minorUserId')
  getConsents(@Param('minorUserId') uid: string): Promise<ParentalConsent[]> { return this.service.getConsents(uid) }

  @Post('check/:userId/time')
  checkTimeLimit(@Param('userId') uid: string, @Body() dto: CheckTimeDto) { return this.service.checkTimeLimit(uid, dto.sessionDurationMin) }

  @Post('check/:userId/spend')
  checkSpendLimit(@Param('userId') uid: string, @Body() dto: CheckSpendDto) { return this.service.checkSpendLimit(uid, dto.amount) }

  @Get('check/:userId/blindbox')
  checkBlindbox(@Param('userId') uid: string) { return this.service.checkBlindboxAccess(uid) }

  @Post('check/:userId/content')
  checkContent(@Param('userId') uid: string, @Body() dto: CheckContentDto) { return this.service.checkContentRating(uid, dto.rating) }

  @Post('record/:userId/time')
  recordTime(@Param('userId') uid: string, @Body() dto: RecordTimeDto): Promise<TimeUsageRecord> { return this.service.recordTimeUsage(uid, dto.sessionDurationMin) }

  @Post('record/:userId/spend')
  recordSpend(@Param('userId') uid: string, @Body() dto: RecordSpendDto): Promise<SpendRecord> { return this.service.recordSpend(uid, dto.amount, dto.category, dto.description) }

  @Get('report/:userId')
  getReport(@Param('userId') uid: string, @Query() q: ReportQueryDto) { return this.service.getUsageReport(uid, q.startDate, q.endDate) }
}
