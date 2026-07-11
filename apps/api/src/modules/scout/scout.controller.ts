import { Controller, Get, Param, Query } from '@nestjs/common'
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

  @Get('logs')
  logs(@Query('cityId') cityId?: string, @Query('limit') limit?: string) {
    return this.svc.getCollectionLogs(cityId, Number(limit)||20)
  }
}
