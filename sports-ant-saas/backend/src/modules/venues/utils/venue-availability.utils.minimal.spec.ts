import {
  checkVenueAvailability,
  calculateNextAvailableTime,
  validateVenueCapacity,
  VenueAvailabilityStatus,
  VenueAvailabilityOptions,
} from './venue-availability.utils';

describe('Venue Availability Utils - Minimal Tests', () => {
  // 简化mock数据，避免复杂的Venue类型问题
  const mockSimpleVenue = {
    id: 'venue-123',
    name: 'Test Venue',
    status: 'active',
    capacity: 50,
    openingHours: null,
  };

  const baseOptions: VenueAvailabilityOptions = {
    date: new Date('2026-03-31'),
    startTime: '10:00',
    endTime: '12:00',
  };

  describe('checkVenueAvailability', () => {
    it('should return available for active venue', () => {
      const result = checkVenueAvailability(mockSimpleVenue as any, baseOptions);
      expect(result.status).toBe(VenueAvailabilityStatus.AVAILABLE);
      expect(result.isAvailable).toBe(true);
    });

    it('should return closed for inactive venue', () => {
      const inactiveVenue = { ...mockSimpleVenue, status: 'inactive' };
      const result = checkVenueAvailability(inactiveVenue as any, baseOptions);
      expect(result.status).toBe(VenueAvailabilityStatus.CLOSED);
      expect(result.isAvailable).toBe(false);
      expect(result.reason).toBe('场地未启用');
    });

    it('should return maintenance for venue under maintenance', () => {
      const maintenanceVenue = {
        ...mockSimpleVenue,
        status: 'maintenance',
      };
      const result = checkVenueAvailability(maintenanceVenue as any, baseOptions);
      expect(result.status).toBe(VenueAvailabilityStatus.MAINTENANCE);
      expect(result.isAvailable).toBe(false);
      expect(result.reason).toBe('场地正在维护中');
    });

    it('should return available when venue has no opening hours', () => {
      const options = {
        ...baseOptions,
        startTime: '07:00',
        endTime: '08:00',
      };
      const result = checkVenueAvailability(mockSimpleVenue as any, options);
      // 由于venue.openingHours为null，默认全天营业，所以应该返回available
      expect(result.isAvailable).toBe(true);
    });

    it('should return closed when outside business hours for venue with opening hours', () => {
      const venueWithHours = {
        ...mockSimpleVenue,
        openingHours: { monday: { open: '09:00', close: '21:00' } },
      };
      const options = {
        ...baseOptions,
        startTime: '07:00',
        endTime: '08:00',
      };
      const result = checkVenueAvailability(venueWithHours as any, options);
      // 由于有营业时间设置，07:00-08:00应该返回closed
      expect(result.isAvailable).toBe(false);
      expect(result.reason).toBe('不在营业时间内');
    });
  });

  describe('calculateNextAvailableTime', () => {
    it('should return current time for available venue', () => {
      const currentTime = new Date('2026-03-31T10:00:00');
      const result = calculateNextAvailableTime(mockSimpleVenue as any, currentTime);
      expect(result).toEqual(currentTime);
    });

    it('should return null for inactive venue', () => {
      const inactiveVenue = { ...mockSimpleVenue, status: 'inactive' };
      const result = calculateNextAvailableTime(inactiveVenue as any);
      expect(result).toBeNull();
    });
  });

  describe('validateVenueCapacity', () => {
    it('should return true when capacity is sufficient', () => {
      const result = validateVenueCapacity(mockSimpleVenue as any, 30);
      expect(result).toBe(true);
    });

    it('should return false when capacity is insufficient', () => {
      const result = validateVenueCapacity(mockSimpleVenue as any, 60);
      expect(result).toBe(false);
    });

    it('should return false for inactive venue', () => {
      const inactiveVenue = { ...mockSimpleVenue, status: 'inactive' };
      const result = validateVenueCapacity(inactiveVenue as any, 10);
      expect(result).toBe(false);
    });
  });
});