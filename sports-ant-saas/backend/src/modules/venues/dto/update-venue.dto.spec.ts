import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { UpdateVenueDto } from './update-venue.dto';
import { VenueType, VenueStatus } from '../entities/venue.entity';

describe('UpdateVenueDto', () => {
  const dtoInstance = (overrides: Record<string, any> = {}) =>
    plainToInstance(UpdateVenueDto, overrides);

  const errorsOf = (dto: UpdateVenueDto) => {
    const validationErrors = validateSync(dto);
    return validationErrors.map((e) => ({
      property: e.property,
      constraints: e.constraints,
    }));
  };

  const validPartial = () =>
    dtoInstance({
      name: '更新后的场馆',
      address: '北京市朝阳区体育路1号',
      city: '北京',
      province: '北京',
      postalCode: '100000',
      contactPhone: '13800138000',
      contactEmail: 'venue@example.com',
    });

  describe('PartialType behavior with inherited defaults', () => {
    /**
     * PartialType 继承 CreateVenueDto 的默认值（如 name: ''、contactPhone: '' 等）。
     * 传入空对象时，这些默认值会被激活。@IsNotEmpty() 对空字符串 '' 仍然报错。
     * 因此 UpdateVenueDto 不全量替换时，应提供满足必填校验的基础字段。
     */
    it('should fail with empty object because defaults include empty strings', () => {
      const errors = errorsOf(dtoInstance({}));
      // name/address/city/province/postalCode default '' 触发了 IsNotEmpty
      // contactPhone '' 触发 IsPhoneNumber, contactEmail '' 触发 IsEmail
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.property === 'name')).toBe(true);
      expect(errors.some((e) => e.property === 'address')).toBe(true);
      expect(errors.some((e) => e.property === 'contactPhone')).toBe(true);
      expect(errors.some((e) => e.property === 'contactEmail')).toBe(true);
    });

    it('should pass with valid partial fields (explicitly passing valid values)', () => {
      const errors = errorsOf(validPartial());
      expect(errors).toHaveLength(0);
    });

    it('should pass when overriding only a single field', () => {
      const errors = errorsOf(
        dtoInstance({
          name: '更新后的场馆',
          address: '北京市朝阳区体育路1号',
          city: '北京',
          province: '北京',
          postalCode: '100000',
          contactPhone: '13800138000',
          contactEmail: 'venue@example.com',
          description: '更新描述',
        }),
      );
      expect(errors).toHaveLength(0);
    });
  });

  describe('field validation still applies when values provided', () => {
    it('should fail when capacity is below min', () => {
      const errors = errorsOf(
        dtoInstance({ ...validPartial(), capacity: 0 }),
      );
      expect(errors.some((e) => e.property === 'capacity')).toBe(true);
    });

    it('should fail when type is invalid enum value', () => {
      const errors = errorsOf(
        dtoInstance({ ...validPartial(), type: 'INVALID_TYPE' }),
      );
      expect(errors.some((e) => e.property === 'type')).toBe(true);
    });

    it('should fail when contactEmail is invalid format', () => {
      const errors = errorsOf(
        dtoInstance({ ...validPartial(), contactEmail: 'not-an-email' }),
      );
      expect(errors.some((e) => e.property === 'contactEmail')).toBe(true);
    });

    it('should fail when latitude is below -90', () => {
      const errors = errorsOf(
        dtoInstance({ ...validPartial(), latitude: -91 }),
      );
      expect(errors.some((e) => e.property === 'latitude')).toBe(true);
    });

    it('should fail when longitude is above 180', () => {
      const errors = errorsOf(
        dtoInstance({ ...validPartial(), longitude: 181 }),
      );
      expect(errors.some((e) => e.property === 'longitude')).toBe(true);
    });

    it('should fail when status is invalid enum value', () => {
      const errors = errorsOf(
        dtoInstance({ ...validPartial(), status: 'UNKNOWN_STATUS' }),
      );
      expect(errors.some((e) => e.property === 'status')).toBe(true);
    });

    it('should fail when facilities contains non-string elements', () => {
      const errors = errorsOf(
        dtoInstance({ ...validPartial(), facilities: [123, 456] }),
      );
      expect(errors.some((e) => e.property === 'facilities')).toBe(true);
    });
  });

  describe('valid partial updates with base fields satisfied', () => {
    it('should accept valid latitude and longitude update', () => {
      const errors = errorsOf(
        dtoInstance({ ...validPartial(), latitude: 39.9, longitude: 116.4 }),
      );
      expect(errors).toHaveLength(0);
    });

    it('should accept valid contact info update', () => {
      const errors = errorsOf(
        dtoInstance({
          ...validPartial(),
          contactPhone: '13900139000',
          contactEmail: 'updated@example.com',
        }),
      );
      expect(errors).toHaveLength(0);
    });

    it('should accept status change', () => {
      const errors = errorsOf(
        dtoInstance({ ...validPartial(), status: VenueStatus.MAINTENANCE }),
      );
      expect(errors).toHaveLength(0);
    });

    it('should accept type change', () => {
      const errors = errorsOf(
        dtoInstance({ ...validPartial(), type: VenueType.STADIUM }),
      );
      expect(errors).toHaveLength(0);
    });

    it('should accept boolean field changes', () => {
      const errors = errorsOf(
        dtoInstance({ ...validPartial(), allowOnlineBooking: false }),
      );
      expect(errors).toHaveLength(0);
    });

    it('should accept capacity update', () => {
      const errors = errorsOf(
        dtoInstance({ ...validPartial(), capacity: 500 }),
      );
      expect(errors).toHaveLength(0);
    });

    it('should accept ownerId update', () => {
      const errors = errorsOf(
        dtoInstance({ ...validPartial(), ownerId: 'user-uuid-999' }),
      );
      expect(errors).toHaveLength(0);
    });
  });
});
