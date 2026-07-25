// ai-profile.controller.ts · WP-14 C端AI画像与营销引擎
// BS-0189~BS-0198

import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AiProfileService } from './ai-profile.service';
import { TenantGuard } from '../agent/tenant.guard';
import type { UserProfile, TimingRecommendation, ContentRecommendation, MarketingCampaignPlan, WeeklyReport } from './ai-profile.entity';

@Controller('ai-profile')
@UseGuards(TenantGuard)
export class AiProfileController {
  constructor(private readonly svc: AiProfileService) {}

  @Post('profile')
  createProfile(@Body() body: Parameters<AiProfileService['createOrUpdateProfile']>[0]): UserProfile {
    return this.svc.createOrUpdateProfile(body);
  }

  @Get('profile/:id')
  getProfile(@Param('id') id: string): UserProfile | undefined {
    return this.svc.getProfile(id);
  }

  @Get('profile/user/:userId')
  getProfileByUser(@Param('userId') userId: string): UserProfile | undefined {
    return this.svc.getProfileByUserId(userId);
  }

  @Get('profiles')
  listProfiles(@Query('storeId') storeId?: string): { profiles: UserProfile[] } {
    return { profiles: this.svc.listProfiles(storeId) };
  }

  @Get('segment/:tags')
  getSegmentUsers(@Param('tags') tags: string, @Query('storeId') storeId?: string): { users: UserProfile[] } {
    const tagList = tags.split(',').map(t => t.trim());
    return { users: this.svc.getSegmentUsers(tagList, storeId) };
  }

  @Post('timing/:userId')
  calculateTiming(@Param('userId') userId: string): TimingRecommendation | undefined {
    return this.svc.calculateTiming(userId);
  }

  @Get('timing/:userId')
  getTiming(@Param('userId') userId: string): TimingRecommendation | undefined {
    return this.svc.getTiming(userId);
  }

  @Post('recommendations/:userId')
  generateRecommendations(@Param('userId') userId: string, @Query('limit') limit?: string): { recommendations: ContentRecommendation[] } {
    return { recommendations: this.svc.generateContentRecommendations(userId, limit ? parseInt(limit, 10) : 5) };
  }

  @Get('recommendations/:userId')
  getRecommendations(@Param('userId') userId: string): { recommendations: ContentRecommendation[] } {
    return { recommendations: this.svc.getContentRecommendations(userId) };
  }

  @Post('campaigns')
  createCampaign(@Body() body: Parameters<AiProfileService['createCampaign']>[0]): MarketingCampaignPlan {
    return this.svc.createCampaign(body);
  }

  @Post('campaigns/:id/launch')
  launchCampaign(@Param('id') id: string): MarketingCampaignPlan | undefined {
    return this.svc.launchCampaign(id);
  }

  @Post('campaigns/:id/complete')
  completeCampaign(@Param('id') id: string, @Body() body: Parameters<AiProfileService['completeCampaign']>[1]): MarketingCampaignPlan | undefined {
    return this.svc.completeCampaign(id, body);
  }

  @Get('campaigns')
  listCampaigns(@Query('status') status?: string): { campaigns: MarketingCampaignPlan[] } {
    return { campaigns: this.svc.listCampaigns(status) };
  }

  @Get('campaigns/:id')
  getCampaign(@Param('id') id: string): MarketingCampaignPlan | undefined {
    return this.svc.getCampaign(id);
  }

  @Post('report/:storeId')
  generateReport(@Param('storeId') storeId: string): WeeklyReport {
    return this.svc.generateWeeklyReport(storeId);
  }

  @Get('report/:storeId')
  getReport(@Param('storeId') storeId: string): WeeklyReport | undefined {
    return this.svc.getWeeklyReport(storeId);
  }
}
