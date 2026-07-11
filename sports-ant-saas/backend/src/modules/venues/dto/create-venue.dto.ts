import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  IsEmail,
  IsPhoneNumber,
  IsArray,
  IsNumber,
  Min,
  Max,
  IsJSON,
  IsBoolean,
} from 'class-validator';
import { VenueType, VenueStatus } from '../entities/venue.entity';

export class CreateVenueDto {
  @ApiProperty({ description: '场地名称' })
  @IsString()
  @IsNotEmpty()
  name: string = '';

  @ApiProperty({ description: '场地描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: '场地地址' })
  @IsString()
  @IsNotEmpty()
  address: string = '';

  @ApiProperty({ description: '城市' })
  @IsString()
  @IsNotEmpty()
  city: string = '';

  @ApiProperty({ description: '省份/州' })
  @IsString()
  @IsNotEmpty()
  province: string = '';

  @ApiProperty({ description: '邮政编码' })
  @IsString()
  @IsNotEmpty()
  postalCode: string = '';

  @ApiProperty({ description: '国家', default: '中国' })
  @IsString()
  @IsOptional()
  country?: string = '中国';

  @ApiProperty({ description: '纬度', required: false })
  @IsNumber()
  @Min(-90)
  @Max(90)
  @IsOptional()
  latitude?: number;

  @ApiProperty({ description: '经度', required: false })
  @IsNumber()
  @Min(-180)
  @Max(180)
  @IsOptional()
  longitude?: number;

  @ApiProperty({ description: '场地类型', enum: VenueType })
  @IsEnum(VenueType)
  type: VenueType = VenueType.GYM;

  @ApiProperty({ description: '最大容量' })
  @IsInt()
  @Min(1)
  capacity: number = 10;

  @ApiProperty({ description: '场地面积（平方米）', required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  area?: number;

  @ApiProperty({ description: '设施列表', required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  facilities?: string[];

  @ApiProperty({ description: '营业时间（JSON格式）', required: false })
  @IsJSON()
  @IsOptional()
  openingHours?: Record<string, any>;

  @ApiProperty({ description: '联系方式' })
  @IsPhoneNumber('CN')
  contactPhone: string = '';

  @ApiProperty({ description: '联系邮箱' })
  @IsEmail()
  contactEmail: string = '';

  @ApiProperty({ description: '场地状态', enum: VenueStatus, default: VenueStatus.ACTIVE })
  @IsEnum(VenueStatus)
  @IsOptional()
  status?: VenueStatus = VenueStatus.ACTIVE;

  @ApiProperty({ description: '是否支持在线预订', default: true })
  @IsBoolean()
  @IsOptional()
  allowOnlineBooking?: boolean = true;

  @ApiProperty({ description: '预订提前时间（小时）', default: 24 })
  @IsInt()
  @Min(1)
  @IsOptional()
  bookingAdvanceHours?: number = 24;

  @ApiProperty({ description: '取消政策（JSON格式）', required: false })
  @IsJSON()
  @IsOptional()
  cancellationPolicy?: Record<string, any>;

  @ApiProperty({ description: '价格信息（JSON格式）', required: false })
  @IsJSON()
  @IsOptional()
  pricing?: Record<string, any>;

  @ApiProperty({ description: '图片URL列表', required: false, type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({ description: '所有者ID', required: false })
  @IsString()
  @IsOptional()
  ownerId?: string;
}
