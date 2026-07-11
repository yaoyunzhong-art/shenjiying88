import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreateVenueDto } from './create-venue.dto';
import { VenueType, VenueStatus } from '../entities/venue.entity';

describe('CreateVenueDto', () => {
  const validDto = (overrides: Partial<CreateVenueDto> = {}): CreateVenueDto =>
    plainToInstance(CreateVenueDto, {
      name: '中央体育场',
      address: '北京市朝阳区体育路1号',
      city: '北京',
      province: '北京',
      postalCode: '100000',
      type: VenueType.GYM,
      capacity: 100,
      contactPhone: '13800138000',
      contactEmail: 'venue@example.com',
      ...overrides,
    });

  const errorsOf = (dto: CreateVenueDto) => {
    const validationErrors = validateSync(dto);
    return validationErrors.map((e) => ({
      property: e.property,
      constraints: e.constraints,
    }));
  };

  describe('required fields', () => {
    it('should pass with all required fields', () => {
      const errors = errorsOf(validDto());
      expect(errors).toHaveLength(0);
    });

    it('should fail when name is empty', () => {
      const errors = errorsOf(validDto({ name: '' }));
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    });

    it('should fail when name is missing', () => {
      const dto = plainToInstance(CreateVenueDto, {
        address: '北京市朝阳区体育路1号',
        city: '北京',
        province: '北京',
        postalCode: '100000',
        type: VenueType.GYM,
        capacity: 100,
        contactPhone: '13800138000',
        contactEmail: 'venue@example.com',
      });
      const errors = errorsOf(dto);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
    });

    it('should fail when address is empty', () => {
      const errors = errorsOf(validDto({ address: '' }));
      expect(errors.some((e) => e.property === 'address')).toBe(true);
    });

    it('should fail when address is missing', () => {
      const dto = plainToInstance(CreateVenueDto, {
        name: '中央体育场',
        city: '北京',
        province: '北京',
        postalCode: '100000',
        type: VenueType.GYM,
        capacity: 100,
        contactPhone: '13800138000',
        contactEmail: 'venue@example.com',
      });
      const errors = errorsOf(dto);
      expect(errors.some((e) => e.property === 'address')).toBe(true);
    });

    it('should fail when city is empty', () => {
      const errors = errorsOf(validDto({ city: '' }));
      expect(errors.some((e) => e.property === 'city')).toBe(true);
    });

    it('should fail when province is empty', () => {
      const errors = errorsOf(validDto({ province: '' }));
      expect(errors.some((e) => e.property === 'province')).toBe(true);
    });

    it('should fail when postalCode is empty', () => {
      const errors = errorsOf(validDto({ postalCode: '' }));
      expect(errors.some((e) => e.property === 'postalCode')).toBe(true);
    });

    it('should fail when contactPhone is empty', () => {
      const errors = errorsOf(validDto({ contactPhone: '' }));
      expect(errors.some((e) => e.property === 'contactPhone')).toBe(true);
    });

    it('should fail when contactEmail is empty', () => {
      const errors = errorsOf(validDto({ contactEmail: '' }));
      expect(errors.some((e) => e.property === 'contactEmail')).toBe(true);
    });

    it('should fail when all required fields are missing', () => {
      const dto = plainToInstance(CreateVenueDto, {});
      const errors = errorsOf(dto);
      expect(errors.length).toBeGreaterThanOrEqual(7);
    });
  });

  describe('venue type validation', () => {
    it('should pass with valid VenueType values', () => {
      for (const vt of Object.values(VenueType)) {
        const errors = errorsOf(validDto({ type: vt }));
        expect(errors.filter((e) => e.property === 'type')).toHaveLength(0);
      }
    });

    it('should fail with invalid venue type', () => {
      const errors = errorsOf(validDto({ type: 'invalid_type' as VenueType }));
      expect(errors.some((e) => e.property === 'type')).toBe(true);
    });

    it('should default to GYM', () => {
      const dto = plainToInstance(CreateVenueDto, {});
      expect(dto.type).toBe(VenueType.GYM);
    });
  });

  describe('venue status validation', () => {
    it('should pass with valid VenueStatus values', () => {
      for (const vs of Object.values(VenueStatus)) {
        const errors = errorsOf(validDto({ status: vs }));
        expect(errors.filter((e) => e.property === 'status')).toHaveLength(0);
      }
    });

    it('should fail with invalid status', () => {
      const errors = errorsOf(validDto({ status: 'deleted' as VenueStatus }));
      expect(errors.some((e) => e.property === 'status')).toBe(true);
    });

    it('should default to ACTIVE', () => {
      const dto = plainToInstance(CreateVenueDto, {});
      expect(dto.status).toBe(VenueStatus.ACTIVE);
    });
  });

  describe('GPS coordinates', () => {
    it('should pass with valid latitude and longitude', () => {
      const errors = errorsOf(validDto({ latitude: 39.9042, longitude: 116.4074 }));
      expect(errors).toHaveLength(0);
    });

    it('should pass when coordinates are omitted', () => {
      const errors = errorsOf(validDto());
      expect(errors).toHaveLength(0);
    });

    it('should fail when latitude exceeds 90', () => {
      const errors = errorsOf(validDto({ latitude: 91 }));
      expect(errors.some((e) => e.property === 'latitude')).toBe(true);
    });

    it('should fail when latitude is below -90', () => {
      const errors = errorsOf(validDto({ latitude: -91 }));
      expect(errors.some((e) => e.property === 'latitude')).toBe(true);
    });

    it('should fail when longitude exceeds 180', () => {
      const errors = errorsOf(validDto({ longitude: 181 }));
      expect(errors.some((e) => e.property === 'longitude')).toBe(true);
    });

    it('should fail when longitude is below -180', () => {
      const errors = errorsOf(validDto({ longitude: -181 }));
      expect(errors.some((e) => e.property === 'longitude')).toBe(true);
    });

    it('should pass with boundary values', () => {
      const errors = errorsOf(validDto({ latitude: 90, longitude: 180 }));
      expect(errors).toHaveLength(0);
    });
  });

  describe('capacity validation', () => {
    it('should pass with positive capacity', () => {
      const errors = errorsOf(validDto({ capacity: 500 }));
      expect(errors.filter((e) => e.property === 'capacity')).toHaveLength(0);
    });

    it('should fail when capacity is 0', () => {
      const errors = errorsOf(validDto({ capacity: 0 }));
      expect(errors.some((e) => e.property === 'capacity')).toBe(true);
    });

    it('should fail when capacity is negative', () => {
      const errors = errorsOf(validDto({ capacity: -1 }));
      expect(errors.some((e) => e.property === 'capacity')).toBe(true);
    });

    it('should fail when capacity is not an integer', () => {
      const errors = errorsOf(validDto({ capacity: 10.5 as unknown as number }));
      expect(errors.some((e) => e.property === 'capacity')).toBe(true);
    });
  });

  describe('contact phone validation', () => {
    it('should pass with valid Chinese phone number', () => {
      const errors = errorsOf(validDto({ contactPhone: '13912345678' }));
      expect(errors.filter((e) => e.property === 'contactPhone')).toHaveLength(0);
    });

    it('should fail with non-Chinese phone format', () => {
      const errors = errorsOf(validDto({ contactPhone: '12345' }));
      expect(errors.some((e) => e.property === 'contactPhone')).toBe(true);
    });
  });

  describe('contact email validation', () => {
    it('should pass with valid email', () => {
      const errors = errorsOf(validDto({ contactEmail: 'info@sportsant.com' }));
      expect(errors.filter((e) => e.property === 'contactEmail')).toHaveLength(0);
    });

    it('should fail with invalid email', () => {
      const errors = errorsOf(validDto({ contactEmail: 'not-an-email' }));
      expect(errors.some((e) => e.property === 'contactEmail')).toBe(true);
    });
  });

  describe('optional fields', () => {
    it('should pass with description', () => {
      const errors = errorsOf(validDto({ description: '一个现代化的综合体育场馆' }));
      expect(errors).toHaveLength(0);
    });

    it('should pass with facilities array', () => {
      const errors = errorsOf(validDto({ facilities: ['WiFi', '更衣室', '停车场'] }));
      expect(errors).toHaveLength(0);
    });

    it('should fail when facilities contains non-string elements', () => {
      const errors = errorsOf(validDto({ facilities: [123 as unknown as string] }));
      expect(errors.some((e) => e.property === 'facilities')).toBe(true);
    });

    it('should pass with images array', () => {
      const errors = errorsOf(validDto({ images: ['https://img.example.com/1.jpg'] }));
      expect(errors).toHaveLength(0);
    });

    it('should pass with openingHours as JSON string', () => {
      const errors = errorsOf(validDto({ openingHours: '{"mon":"08:00-22:00"}' as unknown as Record<string, any> }));
      expect(errors).toHaveLength(0);
    });

    it('should fail when openingHours is not valid JSON', () => {
      const errors = errorsOf(validDto({ openingHours: 'not-json' as unknown as Record<string, any> }));
      expect(errors.some((e) => e.property === 'openingHours')).toBe(true);
    });

    it('should pass with pricing as JSON string', () => {
      const errors = errorsOf(validDto({ pricing: '{"hourly":100}' as unknown as Record<string, any> }));
      expect(errors).toHaveLength(0);
    });

    it('should pass with cancellationPolicy as JSON string', () => {
      const errors = errorsOf(validDto({ cancellationPolicy: '{"freeCancelHours":24}' as unknown as Record<string, any> }));
      expect(errors).toHaveLength(0);
    });

    it('should pass with area', () => {
      const errors = errorsOf(validDto({ area: 2000 }));
      expect(errors).toHaveLength(0);
    });

    it('should fail when area is 0', () => {
      const errors = errorsOf(validDto({ area: 0 }));
      expect(errors.some((e) => e.property === 'area')).toBe(true);
    });

    it('should pass with allowOnlineBooking', () => {
      const errors = errorsOf(validDto({ allowOnlineBooking: false }));
      expect(errors).toHaveLength(0);
    });

    it('should fail when allowOnlineBooking is not boolean', () => {
      const errors = errorsOf(validDto({ allowOnlineBooking: 'yes' as unknown as boolean }));
      expect(errors.some((e) => e.property === 'allowOnlineBooking')).toBe(true);
    });

    it('should pass with bookingAdvanceHours', () => {
      const errors = errorsOf(validDto({ bookingAdvanceHours: 48 }));
      expect(errors).toHaveLength(0);
    });

    it('should fail when bookingAdvanceHours is 0', () => {
      const errors = errorsOf(validDto({ bookingAdvanceHours: 0 }));
      expect(errors.some((e) => e.property === 'bookingAdvanceHours')).toBe(true);
    });

    it('should pass with ownerId', () => {
      const errors = errorsOf(validDto({ ownerId: 'user-uuid-123' }));
      expect(errors).toHaveLength(0);
    });

    it('should pass with country', () => {
      const errors = errorsOf(validDto({ country: '中国' }));
      expect(errors).toHaveLength(0);
    });
  });

  describe('default values', () => {
    it('should default country to "中国"', () => {
      const dto = plainToInstance(CreateVenueDto, {});
      expect(dto.country).toBe('中国');
    });

    it('should default allowOnlineBooking to true', () => {
      const dto = plainToInstance(CreateVenueDto, {});
      expect(dto.allowOnlineBooking).toBe(true);
    });

    it('should default bookingAdvanceHours to 24', () => {
      const dto = plainToInstance(CreateVenueDto, {});
      expect(dto.bookingAdvanceHours).toBe(24);
    });

    it('should default capacity to 10', () => {
      const dto = plainToInstance(CreateVenueDto, {});
      expect(dto.capacity).toBe(10);
    });
  });

  describe('full valid payload', () => {
    it('should pass with all fields provided', () => {
      const errors = errorsOf(
        validDto({
          name: '奥林匹克体育中心',
          description: '国际标准综合体育场馆',
          address: '北京市朝阳区安定路甲3号',
          city: '北京',
          province: '北京市',
          postalCode: '100101',
          country: '中国',
          latitude: 39.9842,
          longitude: 116.3968,
          type: VenueType.STADIUM,
          capacity: 80000,
          area: 250000,
          facilities: ['WiFi', '更衣室', '停车场', 'VIP包厢'],
          openingHours: '{"mon":"06:00-22:00"}' as unknown as Record<string, any>,
          contactPhone: '13912345678',
          contactEmail: 'info@olympic.cn',
          status: VenueStatus.ACTIVE,
          allowOnlineBooking: true,
          bookingAdvanceHours: 48,
          cancellationPolicy: '{"freeCancelHours":24}' as unknown as Record<string, any>,
          pricing: '{"hourly":500}' as unknown as Record<string, any>,
          images: ['https://img.example.com/venue1.jpg'],
          ownerId: 'user-uuid-001',
        }),
      );
      expect(errors).toHaveLength(0);
    });

    it('should pass with minimal required fields', () => {
      const dto = plainToInstance(CreateVenueDto, {
        name: '小型健身房',
        address: '上海市浦东新区张江路100号',
        city: '上海',
        province: '上海',
        postalCode: '200120',
        type: VenueType.GYM,
        capacity: 30,
        contactPhone: '13800138000',
        contactEmail: 'gym@example.com',
      });
      const errors = errorsOf(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
