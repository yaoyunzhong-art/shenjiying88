import { Venue } from '../entities/venue.entity';
export declare enum VenueAvailabilityStatus {
    AVAILABLE = "available",
    BOOKED = "booked",
    MAINTENANCE = "maintenance",
    CLOSED = "closed"
}
export interface VenueAvailabilityOptions {
    date: Date;
    startTime: string;
    endTime: string;
    ignoreMaintenance?: boolean;
}
export interface VenueAvailabilityResult {
    status: VenueAvailabilityStatus;
    isAvailable: boolean;
    reason?: string;
    nextAvailableTime?: Date;
}
export declare function checkVenueAvailability(venue: Venue, options: VenueAvailabilityOptions): VenueAvailabilityResult;
export declare function calculateNextAvailableTime(venue: Venue, currentTime?: Date): Date | null;
export declare function validateVenueCapacity(venue: Venue, requiredCapacity: number): boolean;
export declare function getRecommendedTimeSlots(venue: Venue, durationMinutes: number, date?: Date): Array<{
    startTime: string;
    endTime: string;
}>;
export declare function calculateVenueUtilization(venue: Venue, bookedHours: number, periodHours: number): number;
