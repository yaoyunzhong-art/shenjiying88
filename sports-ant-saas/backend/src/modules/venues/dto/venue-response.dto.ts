import { ApiProperty } from '@nestjs/swagger';
import { Venue, VenueType, VenueStatus } from '../entities/venue.entity';

export class VenueResponseDto {
  constructor() {
    this.id = '';
    this.name = '';
    this.description = null;
    this.address = '';
    this.city = '';
    this.province = '';
    this.postalCode = '';
    this.country = '';
    this.latitude = null;
    this.longitude = null;
    this.type = VenueType.OTHER;
    this.capacity = 0;
    this.area = null;
    this.facilities = null;
    this.openingHours = null;
    this.contactPhone = '';
    this.contactEmail = '';
    this.status = VenueStatus.ACTIVE;
    this.allowOnlineBooking = false;
    this.bookingAdvanceHours = 0;
    this.cancellationPolicy = null;
    this.pricing = null;
    this.images = null;
    this.createdBy = '';
    this.ownerId = null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  @ApiProperty({ description: '场地ID' })
  id: string;

  @ApiProperty({ description: '场地名称' })
  name: string;

  @ApiProperty({ description: '场地描述', nullable: true })
  description: string | null;

  @ApiProperty({ description: '场地地址' })
  address: string;

  @ApiProperty({ description: '城市' })
  city: string;

  @ApiProperty({ description: '省份/州' })
  province: string;

  @ApiProperty({ description: '邮政编码' })
  postalCode: string;

  @ApiProperty({ description: '国家' })
  country: string;

  @ApiProperty({ description: '纬度', nullable: true })
  latitude: number | null;

  @ApiProperty({ description: '经度', nullable: true })
  longitude: number | null;

  @ApiProperty({ description: '场地类型', enum: VenueType })
  type: VenueType;

  @ApiProperty({ description: '最大容量' })
  capacity: number;

  @ApiProperty({ description: '场地面积（平方米）', nullable: true })
  area: number | null;

  @ApiProperty({ description: '设施列表', nullable: true, type: [String] })
  facilities: string[] | null;

  @ApiProperty({ description: '营业时间（JSON格式）', nullable: true })
  openingHours: Record<string, any> | null;

  @ApiProperty({ description: '联系方式' })
  contactPhone: string;

  @ApiProperty({ description: '联系邮箱' })
  contactEmail: string;

  @ApiProperty({ description: '场地状态', enum: VenueStatus })
  status: VenueStatus;

  @ApiProperty({ description: '是否支持在线预订' })
  allowOnlineBooking: boolean;

  @ApiProperty({ description: '预订提前时间（小时）' })
  bookingAdvanceHours: number;

  @ApiProperty({ description: '取消政策（JSON格式）', nullable: true })
  cancellationPolicy: Record<string, any> | null;

  @ApiProperty({ description: '价格信息（JSON格式）', nullable: true })
  pricing: Record<string, any> | null;

  @ApiProperty({ description: '图片URL列表', nullable: true, type: [String] })
  images: string[] | null;

  @ApiProperty({ description: '创建者ID' })
  createdBy?: string;

  @ApiProperty({ description: '所有者ID', nullable: true })
  ownerId: string | null;

  @ApiProperty({ description: '创建时间' })
  createdAt?: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt?: Date;

  @ApiProperty({ description: '距离（米）', nullable: true })
  distance?: number;

  @ApiProperty({ description: '平均评分', nullable: true })
  averageRating?: number;

  @ApiProperty({ description: '评论数量', nullable: true })
  reviewCount?: number;

  static fromEntity(venue: Venue): VenueResponseDto {
    const dto = new VenueResponseDto();
    dto.id = venue.id;
    dto.name = venue.name;
    dto.description = venue.description;
    dto.address = venue.address;
    dto.city = venue.city;
    dto.province = venue.province;
    dto.postalCode = venue.postalCode;
    dto.country = venue.country;
    dto.latitude = venue.latitude;
    dto.longitude = venue.longitude;
    dto.type = venue.type;
    dto.capacity = venue.capacity;
    dto.area = venue.area;
    dto.facilities = venue.facilities;
    dto.openingHours = venue.openingHours;
    dto.contactPhone = venue.contactPhone;
    dto.contactEmail = venue.contactEmail;
    dto.status = venue.status;
    dto.allowOnlineBooking = venue.allowOnlineBooking;
    dto.bookingAdvanceHours = venue.bookingAdvanceHours;
    dto.cancellationPolicy = venue.cancellationPolicy;
    dto.pricing = venue.pricing;
    dto.images = venue.images;
    dto.createdBy = venue.createdBy;
    dto.ownerId = venue.ownerId;
    dto.createdAt = venue.createdAt;
    dto.updatedAt = venue.updatedAt;

    // 虚拟字段
    if (venue.distance !== undefined) dto.distance = venue.distance;
    if (venue.averageRating !== undefined) dto.averageRating = venue.averageRating;
    if (venue.reviewCount !== undefined) dto.reviewCount = venue.reviewCount;

    return dto;
  }

  static fromEntities(venues: Venue[]): VenueResponseDto[] {
    return venues.map((venue) => this.fromEntity(venue));
  }
}
