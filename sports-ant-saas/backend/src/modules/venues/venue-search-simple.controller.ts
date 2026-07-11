import { Controller, Get, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { VenueSearchSimpleService } from './venue-search-simple.service';
import { VenueType, VenueStatus } from './entities/venue.entity';

@ApiTags('venues')
@Controller('venues/simple-search')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class VenueSearchSimpleController {
  private readonly logger = new Logger(VenueSearchSimpleController.name);

  constructor(
    private readonly venueSearchSimpleService: VenueSearchSimpleService,
  ) {}

  @Get()
  @ApiOperation({ summary: '简化场馆搜索' })
  @ApiQuery({ name: 'search', required: false, description: '搜索关键词' })
  @ApiQuery({ name: 'city', required: false, description: '城市' })
  @ApiQuery({ name: 'province', required: false, description: '省份' })
  @ApiQuery({ name: 'type', required: false, enum: VenueType, description: '场馆类型' })
  @ApiQuery({ name: 'status', required: false, enum: VenueStatus, description: '场馆状态' })
  @ApiQuery({ name: 'minCapacity', required: false, type: Number, description: '最小容量' })
  @ApiQuery({ name: 'maxCapacity', required: false, type: Number, description: '最大容量' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: '每页数量' })
  async search(
    @Query('search') search?: string,
    @Query('city') city?: string,
    @Query('province') province?: string,
    @Query('type') type?: VenueType,
    @Query('status') status?: VenueStatus,
    @Query('minCapacity') minCapacity?: string,
    @Query('maxCapacity') maxCapacity?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    this.logger.log(`Simple search request: search=${search}, city=${city}`);

    return this.venueSearchSimpleService.searchVenues({
      search,
      city,
      province,
      type,
      status,
      minCapacity: minCapacity ? parseInt(minCapacity, 10) : undefined,
      maxCapacity: maxCapacity ? parseInt(maxCapacity, 10) : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }
}
