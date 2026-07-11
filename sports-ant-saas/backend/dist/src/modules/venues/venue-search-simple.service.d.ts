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
export declare class VenueSearchSimpleService {
    private venuesRepository;
    private readonly logger;
    constructor(venuesRepository: Repository<Venue>);
    searchVenues(options: VenueSearchOptions): Promise<VenueSearchResponse>;
}
