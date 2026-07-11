import { Repository } from 'typeorm';
import { Venue, VenueStatus, VenueType } from './entities/venue.entity';
import { SessionBooking } from '../sessions/entities/session-booking.entity';
import { Session } from '../sessions/entities/session.entity';
export interface VenueSearchOptions {
    search?: string;
    latitude?: number;
    longitude?: number;
    radiusKm?: number;
    city?: string;
    province?: string;
    district?: string;
    type?: VenueType;
    status?: VenueStatus;
    minCapacity?: number;
    maxCapacity?: number;
    facilities?: string[];
    hasParking?: boolean;
    hasShower?: boolean;
    hasLocker?: boolean;
    hasWifi?: boolean;
    hasCafe?: boolean;
    allowOnlineBooking?: boolean;
    minOpeningHour?: number;
    maxClosingHour?: number;
    is24Hours?: boolean;
    minHourlyRate?: number;
    maxHourlyRate?: number;
    date?: Date;
    startTime?: string;
    endTime?: string;
    durationHours?: number;
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'capacity' | 'hourlyRate' | 'distance' | 'rating';
    sortOrder?: 'asc' | 'desc';
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
            capacityRanges: Array<{
                min: number;
                max: number;
            }>;
            priceRanges: Array<{
                min: number;
                max: number;
            }>;
        };
    };
    metadata: {
        searchTimeMs: number;
        searchRadiusKm?: number;
        locationUsed?: boolean;
    };
}
export declare class VenueSearchService {
    private venuesRepository;
    private sessionBookingsRepository;
    private sessionsRepository;
    private readonly logger;
    private readonly EARTH_RADIUS_KM;
    private statisticsCache;
    private readonly CACHE_TTL_MS;
    constructor(venuesRepository: Repository<Venue>, sessionBookingsRepository: Repository<SessionBooking>, sessionsRepository: Repository<Session>);
    searchVenues(options: VenueSearchOptions): Promise<VenueSearchResponse>;
    getVenueDetails(venueId: string, options?: {
        includeAvailability?: boolean;
        date?: Date;
        includeReviews?: boolean;
        includeSimilar?: boolean;
    }): Promise<{
        venue: Venue;
        availability?: any;
        similarVenues?: VenueSearchResult[];
        statistics?: any;
    }>;
    getPopularVenues(options?: {
        limit?: number;
        city?: string;
        type?: VenueType;
    }): Promise<VenueSearchResult[]>;
    getVenueStatistics(venueId: string): Promise<{
        totalBookings: number;
        totalRevenue: number;
        averageRating: number;
        reviewCount: number;
        occupancyRate: number;
        peakHours: Array<{
            hour: number;
            bookings: number;
        }>;
        monthlyTrend: Array<{
            month: string;
            bookings: number;
            revenue: number;
        }>;
    }>;
    private getVenueAvailability;
    private findSimilarVenues;
    private applyBaseConditions;
    private applyLocationConditions;
    private applyFacilityConditions;
    private applyOperationConditions;
    private applyPriceConditions;
    private applyPaginationAndSorting;
    private processSearchResults;
    private getAvailableFilters;
    private calculateRelevanceScore;
    private calculatePopularityScore;
    private calculateSimilarityScore;
    private calculateDistance;
    private getAppliedFilters;
    private cleanupExpiredCache;
    clearVenueCache(venueId?: string): void;
}
