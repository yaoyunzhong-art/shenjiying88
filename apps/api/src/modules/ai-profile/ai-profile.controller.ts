// ai-profile.controller.ts · WP-14 C端AI画像与营销引擎
// BS-0189~BS-0198

import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { AiProfileService } from './ai-profile.service';

@Controller('ai-profile')
export class AiProfileController {
  constructor(private readonly svc: AiProfileService) {}

  @Post('profile')
  createProfile(@Body() body: any): any {
    return this.svc.createOrUpdateProfile(body);
  }

  @Get('profile/:id')
  getProfile(@Param('id') id: string): any {
    return this.svc.getProfile(id);
  }

  @Get('profile/user/:userId')
  getProfileByUser(@Param('userId') userId: string): any {
    return this.svc.getProfileByUserId(userId);
  }

  @Get('profiles')
  listProfiles(@Query('storeId') storeId?: string): any {
    return { profiles: this.svc.listProfiles(storeId) };
  }

  @Get('segment/:tags')
  getSegmentUsers(@Param('tags') tags: string, @Query('storeId') storeId?: string): any {
    const tagList = tags.split(',').map(t => t.trim());
    return { users: this.svc.getSegmentUsers(tagList, storeId) };
  }

  @Post('timing/:userId')
  calculateTiming(@Param('userId') userId: string): any {
    return this.svc.calculateTiming(userId);
  }

  @Get('timing/:userId')
  getTiming(@Param('userId') userId: string): any {
    return this.svc.getTiming(userId);
  }

  @Post('recommendations/:userId')
  generateRecommendations(@Param('userId') userId: string, @Query('limit') limit?: string): any {
    return { recommendations: this.svc.generateContentRecommendations(userId, limit ? parseInt(limit, 10) : 5) };
  }

  @Get('recommendations/:userId')
  getRecommendations(@Param('userId') userId: string): any {
    return { recommendations: this.svc.getContentRecommendations(userId) };
  }

  @Post('campaigns')
  createCampaign(@Body() body: any): any {
    return this.svc.createCampaign(body);
  }

  @Post('campaigns/:id/launch')
  launchCampaign(@Param('id') id: string): any {
    return this.svc.launchCampaign(id);
  }

  @Post('campaigns/:id/complete')
  completeCampaign(@Param('id') id: string, @Body() body: any): any {
    return this.svc.completeCampaign(id, body);
  }

  @Get('campaigns')
  listCampaigns(@Query('status') status?: string): any {
    return { campaigns: this.svc.listCampaigns(status) };
  }

  @Get('campaigns/:id')
  getCampaign(@Param('id') id: string): any {
    return this.svc.getCampaign(id);
  }

  @Post('report/:storeId')
  generateReport(@Param('storeId') storeId: string): any {
    return this.svc.generateWeeklyReport(storeId);
  }

  @Get('report/:storeId')
  getReport(@Param('storeId') storeId: string): any {
    return this.svc.getWeeklyReport(storeId);
  }
}
