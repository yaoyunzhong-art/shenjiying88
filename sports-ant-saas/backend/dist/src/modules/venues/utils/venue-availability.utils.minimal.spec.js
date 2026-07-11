"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const venue_availability_utils_1 = require("./venue-availability.utils");
describe('Venue Availability Utils - Minimal Tests', () => {
    const mockSimpleVenue = {
        id: 'venue-123',
        name: 'Test Venue',
        status: 'active',
        capacity: 50,
        openingHours: null,
    };
    const baseOptions = {
        date: new Date('2026-03-31'),
        startTime: '10:00',
        endTime: '12:00',
    };
    describe('checkVenueAvailability', () => {
        it('should return available for active venue', () => {
            const result = (0, venue_availability_utils_1.checkVenueAvailability)(mockSimpleVenue, baseOptions);
            expect(result.status).toBe(venue_availability_utils_1.VenueAvailabilityStatus.AVAILABLE);
            expect(result.isAvailable).toBe(true);
        });
        it('should return closed for inactive venue', () => {
            const inactiveVenue = { ...mockSimpleVenue, status: 'inactive' };
            const result = (0, venue_availability_utils_1.checkVenueAvailability)(inactiveVenue, baseOptions);
            expect(result.status).toBe(venue_availability_utils_1.VenueAvailabilityStatus.CLOSED);
            expect(result.isAvailable).toBe(false);
            expect(result.reason).toBe('场地未启用');
        });
        it('should return maintenance for venue under maintenance', () => {
            const maintenanceVenue = {
                ...mockSimpleVenue,
                status: 'maintenance',
            };
            const result = (0, venue_availability_utils_1.checkVenueAvailability)(maintenanceVenue, baseOptions);
            expect(result.status).toBe(venue_availability_utils_1.VenueAvailabilityStatus.MAINTENANCE);
            expect(result.isAvailable).toBe(false);
            expect(result.reason).toBe('场地正在维护中');
        });
        it('should return available when venue has no opening hours', () => {
            const options = {
                ...baseOptions,
                startTime: '07:00',
                endTime: '08:00',
            };
            const result = (0, venue_availability_utils_1.checkVenueAvailability)(mockSimpleVenue, options);
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
            const result = (0, venue_availability_utils_1.checkVenueAvailability)(venueWithHours, options);
            expect(result.isAvailable).toBe(false);
            expect(result.reason).toBe('不在营业时间内');
        });
    });
    describe('calculateNextAvailableTime', () => {
        it('should return current time for available venue', () => {
            const currentTime = new Date('2026-03-31T10:00:00');
            const result = (0, venue_availability_utils_1.calculateNextAvailableTime)(mockSimpleVenue, currentTime);
            expect(result).toEqual(currentTime);
        });
        it('should return null for inactive venue', () => {
            const inactiveVenue = { ...mockSimpleVenue, status: 'inactive' };
            const result = (0, venue_availability_utils_1.calculateNextAvailableTime)(inactiveVenue);
            expect(result).toBeNull();
        });
    });
    describe('validateVenueCapacity', () => {
        it('should return true when capacity is sufficient', () => {
            const result = (0, venue_availability_utils_1.validateVenueCapacity)(mockSimpleVenue, 30);
            expect(result).toBe(true);
        });
        it('should return false when capacity is insufficient', () => {
            const result = (0, venue_availability_utils_1.validateVenueCapacity)(mockSimpleVenue, 60);
            expect(result).toBe(false);
        });
        it('should return false for inactive venue', () => {
            const inactiveVenue = { ...mockSimpleVenue, status: 'inactive' };
            const result = (0, venue_availability_utils_1.validateVenueCapacity)(inactiveVenue, 10);
            expect(result).toBe(false);
        });
    });
});
//# sourceMappingURL=venue-availability.utils.minimal.spec.js.map