import { Controller, Get, Param, Post, Body, Query } from '@nestjs/common'
import { ScoutService } from './scout.service'

@Controller('scout')
export class ScoutController {
  constructor(private svc: ScoutService) {}

  @Get('cities')
  cities(@Query('tier') tier?: string) { return this.svc.getCities(tier) }

  @Get('venues')
  venues(
    @Query('city') city?: string,
    @Query('category') category?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) { return this.svc.getVenues(city, category, Number(limit)||50, Number(offset)||0) }

  @Get('venues/search')
  searchVenues(@Query('q') q: string, @Query('limit') limit?: string) {
    return this.svc.searchVenues(q, Number(limit)||20)
  }

  @Get('venues/:id/prices')
  prices(@Param('id') id: string) { return this.svc.getPrices(Number(id)) }

  @Get('venues/:id/devices')
  devices(@Param('id') id: string) { return this.svc.getDevices(Number(id)) }

  @Get('venues/:id/membership')
  membership(@Param('id') id: string) { return this.svc.getMembership(Number(id)) }

  @Get('venues/:id/reviews')
  reviews(@Param('id') id: string, @Query('sentiment') sentiment?: string) {
    return this.svc.getReviews(Number(id), sentiment)
  }

  @Get('venues/:id/activities')
  activities(@Param('id') id: string) { return this.svc.getActivities(Number(id)) }

  @Post('compare')
  compare(@Body() body: { venueIds: number[] }) {
    return this.svc.compareVenues(body.venueIds)
  }

  @Post('compare/summary')
  compareSummary(@Body() body: { venueIds: number[] }) {
    return this.svc.getComparisonSummary(body.venueIds)
  }

  @Post('snapshot')
  snapshot(@Body() body: { city: string }) {
    return this.svc.batchSnapshot(body.city)
  }

  @Get('stats/region')
  regionStats() { return this.svc.getRegionStats() }

  @Get('stats/progress')
  progress() { return this.svc.getCollectionProgress() }

  @Get('recent-updated')
  recentUpdated(@Query('limit') limit?: string) {
    return this.svc.getRecentUpdated(Number(limit)||10)
  }

  @Get('logs')
  logs(@Query('cityId') cityId?: string, @Query('limit') limit?: string) {
    return this.svc.getCollectionLogs(cityId, Number(limit)||20)
  }
}
