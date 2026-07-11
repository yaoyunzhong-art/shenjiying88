import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../modules/auth/guards/jwt-auth.guard';
import { VenuesService, FindVenuesOptions } from './venues.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { VenueResponseDto } from './dto/venue-response.dto';
import { VenueStatus, VenueType } from './entities/venue.entity';
import { CacheInterceptor } from '../../common/cache.interceptor';

@ApiTags('venues')
@Controller('venues')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  @Post()
  @ApiOperation({ summary: '创建场馆' })
  @ApiResponse({ status: 201, description: '场馆创建成功', type: VenueResponseDto })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async create(
    @Body() createVenueDto: CreateVenueDto,
    @Request() req: ExpressRequest & { user: any },
  ): Promise<VenueResponseDto> {
    return this.venuesService.create(createVenueDto, req.user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: '场馆统计' })
  @ApiResponse({ status: 200, description: '返回场馆统计数据' })
  async getStats() {
    return this.venuesService.getStats();
  }

  @Get('nearby')
  @ApiOperation({ summary: '搜索附近场地' })
  @ApiResponse({ status: 200, description: '返回附近场地列表', type: [VenueResponseDto] })
  @ApiQuery({ name: 'latitude', required: true, description: '纬度' })
  @ApiQuery({ name: 'longitude', required: true, description: '经度' })
  @ApiQuery({ name: 'radius', required: true, description: '搜索半径（公里）' })
  @ApiQuery({ name: 'city', required: false, description: '城市' })
  @ApiQuery({ name: 'type', required: false, enum: VenueType, description: '场地类型' })
  async searchNearby(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
    @Query('radius') radius: number,
    @Query('city') city?: string,
    @Query('type') type?: VenueType,
  ) {
    return this.venuesService.searchNearby(
      parseFloat(latitude as any),
      parseFloat(longitude as any),
      parseFloat(radius as any),
      { city, type },
    );
  }

  @Get('my')
  @ApiOperation({ summary: '获取我的场地' })
  @ApiResponse({ status: 200, description: '返回我的场地列表', type: [VenueResponseDto] })
  @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量', example: 10 })
  async getMyVenues(
    @Request() req: ExpressRequest & { user: any },
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.venuesService.getMyVenues(
      req.user.id,
      parseInt(page as any, 10),
      parseInt(limit as any, 10),
    );
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @ApiOperation({ summary: '场馆列表' })
  @ApiResponse({ status: 200, description: '返回场馆列表', type: [VenueResponseDto] })
  @ApiQuery({ name: 'city', required: false, description: '城市' })
  @ApiQuery({ name: 'province', required: false, description: '省份' })
  @ApiQuery({ name: 'type', required: false, enum: VenueType, description: '场地类型' })
  @ApiQuery({ name: 'status', required: false, enum: VenueStatus, description: '场地状态' })
  @ApiQuery({ name: 'minCapacity', required: false, description: '最小容量' })
  @ApiQuery({ name: 'maxCapacity', required: false, description: '最大容量' })
  @ApiQuery({ name: 'allowOnlineBooking', required: false, description: '是否支持在线预订' })
  @ApiQuery({ name: 'search', required: false, description: '搜索关键词' })
  @ApiQuery({ name: 'page', required: false, description: '页码', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量', example: 10 })
  @ApiQuery({ name: 'latitude', required: false, description: '纬度' })
  @ApiQuery({ name: 'longitude', required: false, description: '经度' })
  @ApiQuery({ name: 'radius', required: false, description: '搜索半径（公里）' })
  async findAll(@Query() query: FindVenuesOptions) {
    return this.venuesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: '场馆详情' })
  @ApiResponse({ status: 200, description: '返回场馆详情', type: VenueResponseDto })
  @ApiResponse({ status: 404, description: '场馆不存在' })
  async findOne(@Param('id') id: string): Promise<VenueResponseDto> {
    return this.venuesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新场馆' })
  @ApiResponse({ status: 200, description: '场馆更新成功', type: VenueResponseDto })
  @ApiResponse({ status: 403, description: '无权修改此场馆' })
  @ApiResponse({ status: 404, description: '场馆不存在' })
  async update(
    @Param('id') id: string,
    @Body() updateVenueDto: UpdateVenueDto,
    @Request() req: ExpressRequest & { user: any },
  ): Promise<VenueResponseDto> {
    return this.venuesService.update(id, updateVenueDto, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除场馆' })
  @ApiResponse({ status: 204, description: '场馆删除成功' })
  @ApiResponse({ status: 403, description: '无权删除此场馆' })
  @ApiResponse({ status: 404, description: '场馆不存在' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: any },
  ): Promise<void> {
    return this.venuesService.remove(id, req.user.id);
  }

  @Put(':id/status')
  @ApiOperation({ summary: '设置营业状态' })
  @ApiResponse({ status: 200, description: '状态修改成功', type: VenueResponseDto })
  @ApiResponse({ status: 403, description: '无权修改此场馆状态' })
  @ApiResponse({ status: 404, description: '场馆不存在' })
  async changeStatus(
    @Param('id') id: string,
    @Body('status') status: VenueStatus,
    @Request() req: ExpressRequest & { user: any },
  ): Promise<VenueResponseDto> {
    return this.venuesService.changeStatus(id, status, req.user.id);
  }
}
