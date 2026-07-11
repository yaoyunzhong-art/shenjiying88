import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual, In } from 'typeorm';
import { Venue, VenueStatus, VenueType } from './entities/venue.entity';
import { SessionBooking, BookingStatus } from '../sessions/entities/session-booking.entity';
import { Session } from '../sessions/entities/session.entity';

export interface VenueSearchOptions {
  // 基础搜索
  search?: string;

  // 地理位置
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  city?: string;
  province?: string;
  district?: string;

  // 场馆属性
  type?: VenueType;
  status?: VenueStatus;
  minCapacity?: number;
  maxCapacity?: number;

  // 设施条件
  facilities?: string[];
  hasParking?: boolean;
  hasShower?: boolean;
  hasLocker?: boolean;
  hasWifi?: boolean;
  hasCafe?: boolean;

  // 运营条件
  allowOnlineBooking?: boolean;
  minOpeningHour?: number; // 0-23
  maxClosingHour?: number; // 0-23
  is24Hours?: boolean;

  // 价格范围
  minHourlyRate?: number;
  maxHourlyRate?: number;

  // 时间可用性
  date?: Date;
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  durationHours?: number;

  // 分页和排序
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'capacity' | 'hourlyRate' | 'distance' | 'rating';
  sortOrder?: 'asc' | 'desc';

  // 高级选项
  includeUnavailable?: boolean;
  onlyFeatured?: boolean;
  ownerId?: string;
}

export interface VenueSearchResult {
  venue: Venue;
  distanceKm?: number;
  relevanceScore: number;
  availability?: {
    isAvailable: boolean;
    availableSlots?: Array<{
      date: Date;
      startTime: string;
      endTime: string;
      price: number;
    }>;
    nextAvailableDate?: Date;
  };
  pricing?: {
    hourlyRate: number;
    dailyRate?: number;
    weeklyRate?: number;
    monthlyRate?: number;
    discountRate?: number;
  };
}

export interface VenueSearchResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  results: VenueSearchResult[];
  filters: {
    applied: Partial<VenueSearchOptions>;
    available: {
      cities: string[];
      provinces: string[];
      types: VenueType[];
      capacityRanges: Array<{ min: number; max: number }>;
      priceRanges: Array<{ min: number; max: number }>;
    };
  };
  metadata: {
    searchTimeMs: number;
    searchRadiusKm?: number;
    locationUsed?: boolean;
  };
}

@Injectable()
export class VenueSearchService {
  private readonly logger = new Logger(VenueSearchService.name);
  private readonly EARTH_RADIUS_KM = 6371;
  
  // 添加统计缓存（内存缓存，生产环境应考虑Redis）
  private statisticsCache = new Map<string, {
    data: any;
    timestamp: number;
  }>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5分钟缓存
  
  // 简化优化：移除复杂缓存，使用算法优化
  // 性能测试显示复杂缓存反而降低性能，使用简化方案

  constructor(
    @InjectRepository(Venue)
    private venuesRepository: Repository<Venue>,
    @InjectRepository(SessionBooking)
    private sessionBookingsRepository: Repository<SessionBooking>,
    @InjectRepository(Session)
    private sessionsRepository: Repository<Session>,
  ) {}

  /**
   * 高级场馆搜索
   */
  async searchVenues(options: VenueSearchOptions): Promise<VenueSearchResponse> {
    const startTime = Date.now();

    try {
      // 定期清理过期缓存（每10次搜索清理一次）
      if (Math.random() < 0.1) { // 10%的概率清理缓存
        this.cleanupExpiredCache();
      }
      
      this.logger.log('Starting venue search', {
        search: options.search,
        location:
          options.latitude && options.longitude
            ? `${options.latitude},${options.longitude}`
            : undefined,
        radiusKm: options.radiusKm,
        filters: this.getAppliedFilters(options),
      });

      // 构建查询条件
      const queryBuilder = this.venuesRepository.createQueryBuilder('venue');

      // 应用基础条件
      this.applyBaseConditions(queryBuilder, options);

      // 应用地理位置条件
      if (options.latitude && options.longitude) {
        this.applyLocationConditions(queryBuilder, options);
      }

      // 应用设施条件
      this.applyFacilityConditions(queryBuilder, options);

      // 应用运营条件
      this.applyOperationConditions(queryBuilder, options);

      // 应用价格条件
      this.applyPriceConditions(queryBuilder, options);

      // 获取总数
      const total = await queryBuilder.getCount();

      // 应用分页和排序
      this.applyPaginationAndSorting(queryBuilder, options);

      // 执行查询
      const venues = await queryBuilder.getMany();

      // 处理结果
      const results = await this.processSearchResults(venues, options);

      // 获取可用过滤器
      const availableFilters = await this.getAvailableFilters(options);

      const searchTimeMs = Date.now() - startTime;

      this.logger.log('Venue search completed', {
        total,
        found: results.length,
        searchTimeMs,
        page: options.page || 1,
        limit: options.limit || 20,
      });

      return {
        total,
        page: options.page || 1,
        limit: options.limit || 20,
        totalPages: Math.ceil(total / (options.limit || 20)),
        results,
        filters: {
          applied: options,
          available: availableFilters,
        },
        metadata: {
          searchTimeMs,
          searchRadiusKm: options.radiusKm,
          locationUsed: !!(options.latitude && options.longitude),
        },
      };
    } catch (error: any) {
      this.logger.error('Venue search failed', error.stack);
      throw error;
    }
  }

  /**
   * 根据ID获取场馆详情（带增强信息）
   */
  async getVenueDetails(
    venueId: string,
    options?: {
      includeAvailability?: boolean;
      date?: Date;
      includeReviews?: boolean;
      includeSimilar?: boolean;
    },
  ): Promise<{
    venue: Venue;
    availability?: any;
    similarVenues?: VenueSearchResult[];
    statistics?: any;
  }> {
    try {
      const venue = await this.venuesRepository.findOne({
        where: { id: venueId },
        relations: options?.includeReviews ? ['reviews'] : [],
      });

      if (!venue) {
        throw new Error(`Venue not found: ${venueId}`);
      }

      const result: any = { venue };

      // 获取可用性信息
      if (options?.includeAvailability) {
        result.availability = await this.getVenueAvailability(venueId, options.date);
      }

      // 获取统计数据
      result.statistics = await this.getVenueStatistics(venueId);

      // 获取相似场馆
      if (options?.includeSimilar) {
        result.similarVenues = await this.findSimilarVenues(venue);
      }

      this.logger.log('Venue details retrieved', {
        venueId,
        includeAvailability: options?.includeAvailability,
        includeSimilar: options?.includeSimilar,
      });

      return result;
    } catch (error: any) {
      this.logger.error(`Failed to get venue details: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 获取热门场馆（基于搜索和预订数据）
   */
  async getPopularVenues(options?: {
    limit?: number;
    city?: string;
    type?: VenueType;
  }): Promise<VenueSearchResult[]> {
    try {
      const queryBuilder = this.venuesRepository.createQueryBuilder('venue');

      // 基础条件：只显示活跃场馆
      queryBuilder.where('venue.status = :status', { status: VenueStatus.ACTIVE });

      // 按城市过滤
      if (options?.city) {
        queryBuilder.andWhere('venue.city = :city', { city: options.city });
      }

      // 按类型过滤
      if (options?.type) {
        queryBuilder.andWhere('venue.type = :type', { type: options.type });
      }

      // 排序：按评分和预订量（模拟）
      queryBuilder
        .orderBy('venue.rating', 'DESC')
        .addOrderBy('venue.reviewCount', 'DESC')
        .addOrderBy('venue.capacity', 'DESC');

      // 限制数量
      const limit = options?.limit || 10;
      queryBuilder.limit(limit);

      const venues = await queryBuilder.getMany();

      return venues.map((venue) => ({
        venue,
        relevanceScore: this.calculatePopularityScore(venue),
      }));
    } catch (error: any) {
      this.logger.error('Failed to get popular venues', error.stack);
      return [];
    }
  }

  /**
   * 获取场馆统计
   */
  async getVenueStatistics(venueId: string): Promise<{
    totalBookings: number;
    totalRevenue: number;
    averageRating: number;
    reviewCount: number;
    occupancyRate: number;
    peakHours: Array<{ hour: number; bookings: number }>;
    monthlyTrend: Array<{ month: string; bookings: number; revenue: number }>;
  }> {
    try {
      // 检查缓存
      const cacheKey = `venue_stats_${venueId}`;
      const cached = this.statisticsCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
        this.logger.debug(`Returning cached statistics for venue ${venueId}`);
        return cached.data;
      }
      // 获取场馆信息
      const venue = await this.venuesRepository.findOne({
        where: { id: venueId },
        select: ['rating', 'reviewCount', 'hourlyRate', 'capacity'],
      });

      if (!venue) {
        throw new Error(`Venue not found: ${venueId}`);
      }

      // 获取过去30天的预订数据
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // 获取该场馆的课程ID
      const sessions = await this.sessionsRepository.find({
        where: { venueId },
        select: ['id'],
      });
      const sessionIds = sessions ? sessions.map(session => session.id) : [];

      // 如果没有课程，返回基础数据
      if (sessionIds.length === 0) {
        return {
          totalBookings: 0,
          totalRevenue: 0,
          averageRating: venue.rating || 0,
          reviewCount: venue.reviewCount || 0,
          occupancyRate: 0,
          peakHours: [],
          monthlyTrend: [],
        };
      }

      // 获取总预订数和总收入
      const confirmedBookings = await this.sessionBookingsRepository.find({
        where: {
          sessionId: In(sessionIds),
          status: BookingStatus.CONFIRMED,
          bookingDate: MoreThanOrEqual(thirtyDaysAgo),
        },
        select: ['id', 'paidAmount', 'bookingDate'],
        relations: ['session'], // 关联session以获取startTime
      });

      const totalBookings = confirmedBookings.length;
      const totalRevenue = confirmedBookings.reduce((sum, booking) => sum + (Number(booking.paidAmount) || 0), 0);

      // 计算占用率（基于场馆容量、时间段和预订数）
      // 更合理的计算方法：基于实际可预订时间段
      const totalSessions = await this.sessionsRepository.count({
        where: { venueId },
      });
      
      let occupancyRate = 0;
      if (totalSessions > 0 && venue.capacity > 0) {
        // 假设每个课程平均2小时，每天营业12小时，30天
        const totalAvailableSlots = totalSessions * 30; // 简化：每个课程在30天内都有机会被预订
        const maxPossibleBookings = totalAvailableSlots * venue.capacity;
        
        if (maxPossibleBookings > 0) {
          occupancyRate = Math.round((totalBookings / maxPossibleBookings) * 100);
        }
      }
      
      // 限制在0-100之间
      occupancyRate = Math.max(0, Math.min(100, occupancyRate));

      // 计算高峰时段
      const hourCounts: Record<number, number> = {};
      confirmedBookings.forEach(booking => {
        if (booking.session && booking.session.startTime) {
          const hour = booking.session.startTime.getHours();
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        }
      });

      const peakHours = Object.entries(hourCounts)
        .map(([hour, bookings]) => ({ hour: parseInt(hour), bookings }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5);

      // 计算月度趋势（过去3个月）
      const monthlyTrend = [];
      for (let i = 2; i >= 0; i--) {
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - i);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setMilliseconds(-1);

        const monthBookings = confirmedBookings.filter(booking => 
          booking.bookingDate && 
          booking.bookingDate >= monthStart && 
          booking.bookingDate <= monthEnd
        );

        const monthRevenue = monthBookings.reduce((sum, booking) => sum + (Number(booking.paidAmount) || 0), 0);

        const monthStr = `${monthStart.getFullYear()}-${(monthStart.getMonth() + 1).toString().padStart(2, '0')}`;
        monthlyTrend.push({
          month: monthStr,
          bookings: monthBookings.length,
          revenue: monthRevenue,
        });
      }

      const result = {
        totalBookings,
        totalRevenue,
        averageRating: venue.rating || 0,
        reviewCount: venue.reviewCount || 0,
        occupancyRate,
        peakHours,
        monthlyTrend,
      };
      
      // 保存到缓存
      this.statisticsCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });
      
      this.logger.debug(`Cached statistics for venue ${venueId}`);
      return result;
    } catch (error: any) {
      this.logger.error(`Failed to get venue statistics: ${error.message}`, error.stack);
      // 出错时返回基础数据
      return {
        totalBookings: 0,
        totalRevenue: 0,
        averageRating: 0,
        reviewCount: 0,
        occupancyRate: 0,
        peakHours: [],
        monthlyTrend: [],
      };
    }
  }

  /**
   * 获取场馆可用性
   */
  private async getVenueAvailability(
    venueId: string,
    date?: Date,
  ): Promise<{
    isAvailable: boolean;
    availableSlots: Array<{
      date: Date;
      startTime: string;
      endTime: string;
      price: number;
    }>;
    nextAvailableDate?: Date;
  }> {
    try {
      // 这里应该查询实际的可用性数据
      // 为了简化，返回模拟数据
      const targetDate = date || new Date();
      const availableSlots = [];

      // 生成一些模拟时间段
      for (let i = 9; i < 21; i += 2) {
        // 9:00-21:00，每2小时一个时间段
        availableSlots.push({
          date: targetDate,
          startTime: `${i.toString().padStart(2, '0')}:00`,
          endTime: `${(i + 2).toString().padStart(2, '0')}:00`,
          price: 100 + (i - 9) * 20, // 价格随时间递增
        });
      }

      return {
        isAvailable: availableSlots.length > 0,
        availableSlots,
        nextAvailableDate: targetDate,
      };
    } catch (error: any) {
      this.logger.error(`Failed to get venue availability: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 查找相似场馆
   */
  private async findSimilarVenues(venue: Venue): Promise<VenueSearchResult[]> {
    try {
      const queryBuilder = this.venuesRepository.createQueryBuilder('v');

      // 相同城市和类型
      queryBuilder
        .where('v.id != :venueId', { venueId: venue.id })
        .andWhere('v.city = :city', { city: venue.city })
        .andWhere('v.type = :type', { type: venue.type })
        .andWhere('v.status = :status', { status: VenueStatus.ACTIVE });

      // 容量相似（±20%）
      if (venue.capacity) {
        const minCapacity = Math.floor(venue.capacity * 0.8);
        const maxCapacity = Math.ceil(venue.capacity * 1.2);
        queryBuilder.andWhere('v.capacity BETWEEN :minCapacity AND :maxCapacity', {
          minCapacity,
          maxCapacity,
        });
      }

      // 按评分和相似度排序
      queryBuilder
        .orderBy('v.rating', 'DESC')
        .addOrderBy('ABS(v.capacity - :capacity)', 'ASC')
        .setParameter('capacity', venue.capacity || 0)
        .limit(5);

      const similarVenues = await queryBuilder.getMany();

      return similarVenues.map((v) => ({
        venue: v,
        relevanceScore: this.calculateSimilarityScore(venue, v),
      }));
    } catch (error: any) {
      this.logger.error('Failed to find similar venues', error.stack);
      return [];
    }
  }

  /**
   * 应用基础查询条件
   */
  private applyBaseConditions(queryBuilder: any, options: VenueSearchOptions): void {
    // 状态过滤（默认只显示活跃场馆）
    if (!options.includeUnavailable) {
      queryBuilder.andWhere('venue.status = :status', {
        status: VenueStatus.ACTIVE,
      });
    }

    // 文本搜索
    if (options.search) {
      queryBuilder.andWhere(
        '(venue.name LIKE :search OR venue.description LIKE :search OR venue.address LIKE :search)',
        { search: `%${options.search}%` },
      );
    }

    // 城市过滤
    if (options.city) {
      queryBuilder.andWhere('venue.city = :city', { city: options.city });
    }

    // 省份过滤
    if (options.province) {
      queryBuilder.andWhere('venue.province = :province', { province: options.province });
    }

    // 区域过滤
    if (options.district) {
      queryBuilder.andWhere('venue.district = :district', { district: options.district });
    }

    // 类型过滤
    if (options.type) {
      queryBuilder.andWhere('venue.type = :type', { type: options.type });
    }

    // 容量范围
    if (options.minCapacity !== undefined) {
      queryBuilder.andWhere('venue.capacity >= :minCapacity', {
        minCapacity: options.minCapacity,
      });
    }

    if (options.maxCapacity !== undefined) {
      queryBuilder.andWhere('venue.capacity <= :maxCapacity', {
        maxCapacity: options.maxCapacity,
      });
    }

    // 特色场馆
    if (options.onlyFeatured) {
      queryBuilder.andWhere('venue.isFeatured = :isFeatured', {
        isFeatured: true,
      });
    }

    // 所有者过滤
    if (options.ownerId) {
      queryBuilder.andWhere('venue.ownerId = :ownerId', {
        ownerId: options.ownerId,
      });
    }
  }

  /**
   * 应用地理位置条件
   */
  private applyLocationConditions(queryBuilder: any, options: VenueSearchOptions): void {
    if (!options.latitude || !options.longitude) return;

    const radiusKm = options.radiusKm || 10; // 默认10公里

    // 计算边界框（优化性能）
    const lat = options.latitude;
    const lng = options.longitude;

    // 1度纬度约111公里
    const latDelta = radiusKm / 111;
    // 1度经度在赤道约111公里，随纬度变化
    const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

    queryBuilder
      .andWhere('venue.latitude BETWEEN :minLat AND :maxLat', {
        minLat: lat - latDelta,
        maxLat: lat + latDelta,
      })
      .andWhere('venue.longitude BETWEEN :minLng AND :maxLng', {
        minLng: lng - lngDelta,
        maxLng: lng + lngDelta,
      })
      .addSelect(
        `(${this.EARTH_RADIUS_KM} * ACOS(` +
        `COS(RADIANS(:lat)) * COS(RADIANS(venue.latitude)) * ` +
        `COS(RADIANS(venue.longitude) - RADIANS(:lng)) + ` +
        `SIN(RADIANS(:lat)) * SIN(RADIANS(venue.latitude))))`,
        'distance',
      )
      .setParameter('lat', lat)
      .setParameter('lng', lng)
      .having('distance <= :radius')
      .setParameter('radius', radiusKm);
  }

  /**
   * 应用设施条件
   */
  private applyFacilityConditions(queryBuilder: any, options: VenueSearchOptions): void {
    if (options.facilities && options.facilities.length > 0) {
      queryBuilder.andWhere('venue.facilities @> :facilities', {
        facilities: options.facilities,
      });
    }

    if (options.hasParking !== undefined) {
      queryBuilder.andWhere('venue.hasParking = :hasParking', {
        hasParking: options.hasParking,
      });
    }

    if (options.hasShower !== undefined) {
      queryBuilder.andWhere('venue.hasShower = :hasShower', {
        hasShower: options.hasShower,
      });
    }

    if (options.hasLocker !== undefined) {
      queryBuilder.andWhere('venue.hasLocker = :hasLocker', {
        hasLocker: options.hasLocker,
      });
    }

    if (options.hasWifi !== undefined) {
      queryBuilder.andWhere('venue.hasWifi = :hasWifi', {
        hasWifi: options.hasWifi,
      });
    }

    if (options.hasCafe !== undefined) {
      queryBuilder.andWhere('venue.hasCafe = :hasCafe', {
        hasCafe: options.hasCafe,
      });
    }
  }

  /**
   * 应用运营条件
   */
  private applyOperationConditions(queryBuilder: any, options: VenueSearchOptions): void {
    if (options.allowOnlineBooking !== undefined) {
      queryBuilder.andWhere('venue.allowOnlineBooking = :allowOnlineBooking', {
        allowOnlineBooking: options.allowOnlineBooking,
      });
    }

    if (options.minOpeningHour !== undefined) {
      queryBuilder.andWhere('venue.openingHour <= :minOpeningHour', {
        minOpeningHour: options.minOpeningHour,
      });
    }

    if (options.maxClosingHour !== undefined) {
      queryBuilder.andWhere('venue.closingHour >= :maxClosingHour', {
        maxClosingHour: options.maxClosingHour,
      });
    }

    if (options.is24Hours !== undefined) {
      queryBuilder.andWhere('venue.is24Hours = :is24Hours', {
        is24Hours: options.is24Hours,
      });
    }
  }

  /**
   * 应用价格条件
   */
  private applyPriceConditions(queryBuilder: any, options: VenueSearchOptions): void {
    if (options.minHourlyRate !== undefined) {
      queryBuilder.andWhere('venue.hourlyRate >= :minHourlyRate', {
        minHourlyRate: options.minHourlyRate,
      });
    }

    if (options.maxHourlyRate !== undefined) {
      queryBuilder.andWhere('venue.hourlyRate <= :maxHourlyRate', {
        maxHourlyRate: options.maxHourlyRate,
      });
    }
  }

  /**
   * 应用分页和排序
   */
  private applyPaginationAndSorting(queryBuilder: any, options: VenueSearchOptions): void {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const offset = (page - 1) * limit;

    queryBuilder.skip(offset).take(limit);

    // 应用排序
    const sortBy = options.sortBy || 'name';
    const sortOrder = options.sortOrder || 'asc';

    switch (sortBy) {
      case 'distance':
        if (options.latitude && options.longitude) {
          queryBuilder.orderBy('distance', sortOrder);
        } else {
          queryBuilder.orderBy('venue.name', sortOrder);
        }
        break;
      case 'capacity':
        queryBuilder.orderBy('venue.capacity', sortOrder);
        break;
      case 'hourlyRate':
        queryBuilder.orderBy('venue.hourlyRate', sortOrder);
        break;
      case 'rating':
        queryBuilder.orderBy('venue.rating', sortOrder);
        break;
      default:
        queryBuilder.orderBy('venue.name', sortOrder);
    }
  }

  /**
   * 处理搜索结果
   */
  private async processSearchResults(
    venues: Venue[],
    options: VenueSearchOptions,
  ): Promise<VenueSearchResult[]> {
    const results: VenueSearchResult[] = [];

    for (const venue of venues) {
      const result: VenueSearchResult = {
        venue,
        relevanceScore: this.calculateRelevanceScore(venue, options),
      };

      // 计算距离（如果提供了位置）
      if (options.latitude && options.longitude && venue.latitude && venue.longitude) {
        result.distanceKm = this.calculateDistance(
          options.latitude,
          options.longitude,
          venue.latitude,
          venue.longitude,
        );
      }

      // 获取可用性信息（如果提供了时间）
      if (options.date || options.startTime) {
        result.availability = await this.getVenueAvailability(venue.id, options.date);
      }

      // 获取价格信息
      result.pricing = (venue.pricing as {
        hourlyRate: number;
        dailyRate?: number;
        weeklyRate?: number;
        monthlyRate?: number;
        discountRate?: number;
      }) || {
        hourlyRate: 0,
        dailyRate: 0,
        weeklyRate: 0,
        monthlyRate: 0,
        discountRate: 0,
      };

      results.push(result);
    }

    return results;
  }

  /**
   * 获取可用过滤器
   */
  private async getAvailableFilters(_options: VenueSearchOptions): Promise<{
    cities: string[];
    provinces: string[];
    types: VenueType[];
    capacityRanges: Array<{ min: number; max: number }>;
    priceRanges: Array<{ min: number; max: number }>;
  }> {
    try {
      // 这里应该查询数据库获取实际可用的过滤器
      // 为了简化，返回模拟数据
      return {
        cities: ['上海', '北京', '广州', '深圳', '杭州', '成都'],
        provinces: ['上海市', '北京市', '广东省', '浙江省', '四川省'],
        types: [VenueType.GYM, VenueType.STADIUM, VenueType.COURT, VenueType.POOL, VenueType.OTHER],
        capacityRanges: [
          { min: 0, max: 50 },
          { min: 51, max: 100 },
          { min: 101, max: 200 },
          { min: 201, max: 500 },
          { min: 501, max: 1000 },
        ],
        priceRanges: [
          { min: 0, max: 100 },
          { min: 101, max: 200 },
          { min: 201, max: 500 },
          { min: 501, max: 1000 },
          { min: 1001, max: 5000 },
        ],
      };
    } catch (error: any) {
      this.logger.error('Failed to get available filters', error.stack);
      return {
        cities: [],
        provinces: [],
        types: [],
        capacityRanges: [],
        priceRanges: [],
      };
    }
  }

  /**
   * 计算相关性分数
   */
  private calculateRelevanceScore(venue: Venue, options: VenueSearchOptions): number {
    let score = 100;

    // 文本搜索匹配度
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      const nameMatch = venue.name.toLowerCase().includes(searchLower) ? 20 : 0;
      const descMatch = venue.description?.toLowerCase().includes(searchLower) ? 10 : 0;
      const addressMatch = venue.address?.toLowerCase().includes(searchLower) ? 15 : 0;
      score += nameMatch + descMatch + addressMatch;
    }

    // 距离分数（越近分数越高）
    if (options.latitude && options.longitude && venue.latitude && venue.longitude) {
      const distance = this.calculateDistance(
        options.latitude,
        options.longitude,
        venue.latitude,
        venue.longitude,
      );

      if (distance <= 1)
        score += 30; // 1公里内
      else if (distance <= 5)
        score += 20; // 5公里内
      else if (distance <= 10)
        score += 10; // 10公里内
      else if (distance <= 20) score += 5; // 20公里内
    }

    // 评分分数
    if (venue.rating) {
      score += venue.rating * 5; // 每1星加5分
    }

    // 特色场馆加分
    if (venue.isFeatured) {
      score += 15;
    }

    // 在线预订加分
    if (venue.allowOnlineBooking) {
      score += 10;
    }

    // 设施完善度加分
    let facilityScore = 0;
    if (venue.hasParking) facilityScore += 5;
    if (venue.hasShower) facilityScore += 5;
    if (venue.hasLocker) facilityScore += 3;
    if (venue.hasWifi) facilityScore += 3;
    if (venue.hasCafe) facilityScore += 2;
    score += facilityScore;

    return Math.min(score, 200); // 最大200分
  }

  /**
   * 计算流行度分数
   */
  private calculatePopularityScore(venue: Venue): number {
    let score = 100;

    // 评分权重
    if (venue.rating) {
      score += venue.rating * 10; // 每1星加10分
    }

    // 评论数量权重
    if (venue.reviewCount) {
      score += Math.min(venue.reviewCount * 0.5, 50); // 每1条评论加0.5分，最多50分
    }

    // 容量权重（越大越受欢迎）
    if (venue.capacity) {
      score += Math.min(venue.capacity * 0.01, 30); // 每100容量加1分，最多30分
    }

    // 特色场馆权重
    if (venue.isFeatured) {
      score += 20;
    }

    return score;
  }

  /**
   * 计算相似度分数
   */
  private calculateSimilarityScore(venue1: Venue, venue2: Venue): number {
    let score = 100;

    // 类型相同
    if (venue1.type === venue2.type) {
      score += 20;
    }

    // 城市相同
    if (venue1.city === venue2.city) {
      score += 15;
    }

    // 容量相似度
    if (venue1.capacity && venue2.capacity) {
      const capacityDiff = Math.abs(venue1.capacity - venue2.capacity);
      const capacityRatio = capacityDiff / Math.max(venue1.capacity, venue2.capacity);
      score += Math.max(0, 30 - capacityRatio * 100); // 差异越大分数越低
    }

    // 价格相似度
    if (venue1.hourlyRate && venue2.hourlyRate) {
      const priceDiff = Math.abs(venue1.hourlyRate - venue2.hourlyRate);
      const priceRatio = priceDiff / Math.max(venue1.hourlyRate, venue2.hourlyRate);
      score += Math.max(0, 20 - priceRatio * 100);
    }

    // 设施相似度
    let facilityMatch = 0;
    if (venue1.hasParking === venue2.hasParking) facilityMatch += 5;
    if (venue1.hasShower === venue2.hasShower) facilityMatch += 5;
    if (venue1.hasLocker === venue2.hasLocker) facilityMatch += 3;
    if (venue1.hasWifi === venue2.hasWifi) facilityMatch += 3;
    if (venue1.hasCafe === venue2.hasCafe) facilityMatch += 2;
    score += facilityMatch;

    return score;
  }

  /**
   * 计算两点之间的距离（公里）
   * 使用智能缓存和优化算法提高性能
   */
  /**
   * 计算两点之间的距离（公里）
   * 使用优化的Haversine公式，简化实现提高性能
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    // 快速检查：如果是同一点，直接返回0
    if (lat1 === lat2 && lon1 === lon2) {
      return 0;
    }

    // 对于非常近的点（<100米），使用快速近似
    const latDiff = Math.abs(lat1 - lat2);
    const lonDiff = Math.abs(lon1 - lon2);
    if (latDiff < 0.001 && lonDiff < 0.001) { // 约100米
      // 使用平面近似，避免复杂计算
      const approxDistance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111.32;
      return Math.max(0.01, approxDistance); // 至少10米
    }

    // 使用优化的Haversine公式
    const R = this.EARTH_RADIUS_KM;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * 获取应用的过滤器
   */
  private getAppliedFilters(options: VenueSearchOptions): Record<string, any> {
    const filters: Record<string, any> = {};

    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        filters[key] = value;
      }
    });

    return filters;
  }

  /**
   * 清理过期的缓存
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, value] of this.statisticsCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL_MS) {
        this.statisticsCache.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      this.logger.debug(`Cleaned ${cleanedCount} expired cache entries`);
    }
  }

  /**
   * 手动清除指定场馆的缓存
   */
  clearVenueCache(venueId?: string): void {
    if (venueId) {
      const cacheKey = `venue_stats_${venueId}`;
      this.statisticsCache.delete(cacheKey);
      this.logger.debug(`Cleared cache for venue ${venueId}`);
    } else {
      // 清除所有缓存
      const count = this.statisticsCache.size;
      this.statisticsCache.clear();
      this.logger.debug(`Cleared all cache entries (${count} total)`);
    }
  }
}
