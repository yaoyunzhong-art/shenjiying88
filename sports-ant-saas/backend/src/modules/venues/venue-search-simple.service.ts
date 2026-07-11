import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Venue, VenueStatus, VenueType } from './entities/venue.entity';

export interface VenueSearchOptions {
  search?: string;
  city?: string;
  province?: string;
  type?: VenueType;
  status?: VenueStatus;
  minCapacity?: number;
  maxCapacity?: number;
  page?: number;
  limit?: number;
}

export interface VenueSearchResult {
  venue: Venue;
  relevanceScore: number;
}

export interface VenueSearchResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  results: VenueSearchResult[];
}

@Injectable()
export class VenueSearchSimpleService {
  private readonly logger = new Logger(VenueSearchSimpleService.name);

  constructor(
    @InjectRepository(Venue)
    private venuesRepository: Repository<Venue>,
  ) {}

  /**
   * 简化场馆搜索 - 仅支持基本搜索功能
   */
  async searchVenues(options: VenueSearchOptions): Promise<VenueSearchResponse> {
    const startTime = Date.now();
    
    try {
      this.logger.log('Starting simple venue search', {
        search: options.search,
        city: options.city,
        type: options.type,
      });
      
      const page = options.page || 1;
      const limit = options.limit || 10;
      const skip = (page - 1) * limit;
      
      // 构建查询
      const queryBuilder = this.venuesRepository.createQueryBuilder('venue');
      
      // 基本搜索条件
      if (options.search) {
        queryBuilder.where(
          '(venue.name LIKE :search OR venue.description LIKE :search OR venue.address LIKE :search)',
          { search: `%${options.search}%` }
        );
      }
      
      if (options.city) {
        queryBuilder.andWhere('venue.city = :city', { city: options.city });
      }
      
      if (options.province) {
        queryBuilder.andWhere('venue.province = :province', { province: options.province });
      }
      
      if (options.type) {
        queryBuilder.andWhere('venue.type = :type', { type: options.type });
      }
      
      if (options.status) {
        queryBuilder.andWhere('venue.status = :status', { status: options.status });
      }
      
      if (options.minCapacity !== undefined) {
        queryBuilder.andWhere('venue.capacity >= :minCapacity', { minCapacity: options.minCapacity });
      }
      
      if (options.maxCapacity !== undefined) {
        queryBuilder.andWhere('venue.capacity <= :maxCapacity', { maxCapacity: options.maxCapacity });
      }
      
      // 分页
      queryBuilder.skip(skip).take(limit);
      
      // 排序
      queryBuilder.orderBy('venue.createdAt', 'DESC');
      
      // 执行查询
      const [venues, total] = await queryBuilder.getManyAndCount();
      
      // 转换结果
      const results: VenueSearchResult[] = venues.map(venue => ({
        venue,
        relevanceScore: 1.0, // 简化版本，固定相关度分数
      }));
      
      const totalPages = Math.ceil(total / limit);
      const searchTimeMs = Date.now() - startTime;
      
      this.logger.log(`Simple venue search completed`, {
        total,
        page,
        limit,
        totalPages,
        searchTimeMs,
      });
      
      return {
        total,
        page,
        limit,
        totalPages,
        results,
      };
      
    } catch (error) {
      this.logger.error('Simple venue search failed', error);
      throw error;
    }
  }
}