import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Venue, VenueStatus, VenueType } from './entities/venue.entity';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { VenueResponseDto } from './dto/venue-response.dto';

export interface FindVenuesOptions {
  city?: string;
  province?: string;
  type?: VenueType;
  status?: VenueStatus;
  minCapacity?: number;
  maxCapacity?: number;
  allowOnlineBooking?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  latitude?: number;
  longitude?: number;
  radius?: number; // 半径（公里）
}

@Injectable()
export class VenuesService {
  constructor(
    @InjectRepository(Venue)
    private venuesRepository: Repository<Venue>,
  ) {}

  async create(createVenueDto: CreateVenueDto, userId: string): Promise<VenueResponseDto> {
    // 检查邮箱是否已存在
    const existingVenue = await this.venuesRepository.findOne({
      where: { contactEmail: createVenueDto.contactEmail },
    });

    if (existingVenue) {
      throw new BadRequestException('该邮箱已被其他场地使用');
    }

    const venue = this.venuesRepository.create({
      ...createVenueDto,
      id: uuidv4(), // 手动生成UUID
      createdBy: userId,
      ownerId: createVenueDto.ownerId || userId,
    });

    const savedVenue = await this.venuesRepository.save(venue);
    return VenueResponseDto.fromEntity(savedVenue);
  }

  async findAll(options: FindVenuesOptions = {}): Promise<{
    venues: VenueResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      city,
      province,
      type,
      status,
      minCapacity,
      maxCapacity,
      allowOnlineBooking,
      search,
      page = 1,
      limit = 10,
      latitude,
      longitude,
      radius,
    } = options;

    const query = this.venuesRepository.createQueryBuilder('venue');

    // 基本过滤条件
    if (city) query.andWhere('venue.city = :city', { city });
    if (province) query.andWhere('venue.province = :province', { province });
    if (type) query.andWhere('venue.type = :type', { type });
    if (status) query.andWhere('venue.status = :status', { status });
    if (allowOnlineBooking !== undefined) {
      query.andWhere('venue.allowOnlineBooking = :allowOnlineBooking', { allowOnlineBooking });
    }

    // 容量范围过滤
    if (minCapacity !== undefined) {
      query.andWhere('venue.capacity >= :minCapacity', { minCapacity });
    }
    if (maxCapacity !== undefined) {
      query.andWhere('venue.capacity <= :maxCapacity', { maxCapacity });
    }

    // 搜索条件
    if (search) {
      query.andWhere(
        '(venue.name LIKE :search OR venue.description LIKE :search OR venue.address LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // 地理位置过滤（简单矩形范围，实际生产环境应使用PostGIS等）
    if (latitude && longitude && radius) {
      // 简化的距离计算（近似值）
      const latDelta = radius / 111; // 1度纬度约111公里
      const lngDelta = radius / (111 * Math.cos(latitude * (Math.PI / 180)));

      query.andWhere('venue.latitude BETWEEN :minLat AND :maxLat', {
        minLat: latitude - latDelta,
        maxLat: latitude + latDelta,
      });
      query.andWhere('venue.longitude BETWEEN :minLng AND :maxLng', {
        minLng: longitude - lngDelta,
        maxLng: longitude + lngDelta,
      });
    }

    // 计算总数
    const total = await query.getCount();

    // 分页
    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    // 排序
    query.orderBy('venue.createdAt', 'DESC');

    const venues = await query.getMany();

    // 计算距离（如果提供了坐标）
    if (latitude && longitude) {
      venues.forEach((venue) => {
        if (venue.latitude && venue.longitude) {
          venue.distance = this.calculateDistance(
            latitude,
            longitude,
            venue.latitude,
            venue.longitude,
          );
        }
      });
    }

    return {
      venues: VenueResponseDto.fromEntities(venues),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<VenueResponseDto> {
    const venue = await this.venuesRepository.findOne({
      where: { id },
    });

    if (!venue) {
      throw new NotFoundException(`场地 ${id} 不存在`);
    }

    return VenueResponseDto.fromEntity(venue);
  }

  async update(
    id: string,
    updateVenueDto: UpdateVenueDto,
    userId: string,
  ): Promise<VenueResponseDto> {
    const venue = await this.venuesRepository.findOne({
      where: { id },
    });

    if (!venue) {
      throw new NotFoundException(`场地 ${id} 不存在`);
    }

    // 检查权限：只有创建者或所有者可以修改
    if (venue.createdBy !== userId && venue.ownerId !== userId) {
      throw new ForbiddenException('无权修改此场地');
    }

    // 如果修改邮箱，检查是否与其他场地冲突
    if (updateVenueDto.contactEmail && updateVenueDto.contactEmail !== venue.contactEmail) {
      const existingVenue = await this.venuesRepository.findOne({
        where: { contactEmail: updateVenueDto.contactEmail },
      });

      if (existingVenue && existingVenue.id !== id) {
        throw new BadRequestException('该邮箱已被其他场地使用');
      }
    }

    Object.assign(venue, updateVenueDto);
    const updatedVenue = await this.venuesRepository.save(venue);
    return VenueResponseDto.fromEntity(updatedVenue);
  }

  async remove(id: string, userId: string): Promise<void> {
    const venue = await this.venuesRepository.findOne({
      where: { id },
    });

    if (!venue) {
      throw new NotFoundException(`场地 ${id} 不存在`);
    }

    // 检查权限：只有创建者或所有者可以删除
    if (venue.createdBy !== userId && venue.ownerId !== userId) {
      throw new ForbiddenException('无权删除此场地');
    }

    // 软删除
    venue.deletedAt = new Date();
    venue.status = VenueStatus.CLOSED;
    await this.venuesRepository.save(venue);
  }

  async getMyVenues(
    userId: string,
    page = 1,
    limit = 10,
  ): Promise<{
    venues: VenueResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const query = this.venuesRepository
      .createQueryBuilder('venue')
      .where('venue.createdBy = :userId OR venue.ownerId = :userId', { userId })
      .andWhere('venue.deletedAt IS NULL');

    const total = await query.getCount();
    const skip = (page - 1) * limit;

    const venues = await query.skip(skip).take(limit).orderBy('venue.createdAt', 'DESC').getMany();

    return {
      venues: VenueResponseDto.fromEntities(venues),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async changeStatus(id: string, status: VenueStatus, userId: string): Promise<VenueResponseDto> {
    const venue = await this.venuesRepository.findOne({
      where: { id },
    });

    if (!venue) {
      throw new NotFoundException(`场地 ${id} 不存在`);
    }

    // 检查权限：只有创建者或所有者可以修改状态
    if (venue.createdBy !== userId && venue.ownerId !== userId) {
      throw new ForbiddenException('无权修改此场地状态');
    }

    venue.status = status;
    const updatedVenue = await this.venuesRepository.save(venue);
    return VenueResponseDto.fromEntity(updatedVenue);
  }

  async getStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    byCity: Record<string, number>;
  }> {
    const venues = await this.venuesRepository
      .createQueryBuilder('venue')
      .where('venue.deletedAt IS NULL')
      .select(['venue.status', 'venue.type', 'venue.city'])
      .getMany();

    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byCity: Record<string, number> = {};

    for (const v of venues) {
      byStatus[v.status] = (byStatus[v.status] || 0) + 1;
      byType[v.type] = (byType[v.type] || 0) + 1;
      if (v.city) {
        byCity[v.city] = (byCity[v.city] || 0) + 1;
      }
    }

    return { total: venues.length, byStatus, byType, byCity };
  }

  async searchNearby(
    latitude: number,
    longitude: number,
    radius: number,
    options: Omit<FindVenuesOptions, 'latitude' | 'longitude' | 'radius'> = {},
  ): Promise<VenueResponseDto[]> {
    const { venues } = await this.findAll({
      ...options,
      latitude,
      longitude,
      radius,
    });

    // 按距离排序
    return venues.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  // 计算两个坐标之间的距离（公里）
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // 地球半径（公里）
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
