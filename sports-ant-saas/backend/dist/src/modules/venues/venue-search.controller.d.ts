import { VenueSearchService, VenueSearchOptions, VenueSearchResponse } from './venue-search.service';
export declare class VenueSearchController {
    private readonly venueSearchService;
    private readonly logger;
    constructor(venueSearchService: VenueSearchService);
    searchVenues(body: VenueSearchOptions): Promise<{
        success: boolean;
        data: VenueSearchResponse;
        timestamp: string;
    }>;
    quickSearch(query?: string, city?: string, type?: string, lat?: string, lng?: string, radius?: string, page?: string, limit?: string): Promise<{
        success: boolean;
        data: VenueSearchResponse;
        timestamp: string;
    }>;
    getVenueDetails(venueId: string, includeAvailability?: string, date?: string, includeReviews?: string, includeSimilar?: string): Promise<{
        success: boolean;
        data: any;
        timestamp: string;
    }>;
    getPopularVenues(city?: string, type?: string, limit?: string): Promise<{
        success: boolean;
        data: Array<{
            venue: any;
            relevanceScore: number;
        }>;
        timestamp: string;
    }>;
    getVenueStatistics(venueId: string): Promise<{
        success: boolean;
        data: any;
        timestamp: string;
    }>;
    getAvailableFilters(city?: string, type?: string): Promise<{
        success: boolean;
        data: {
            cities: string[];
            provinces: string[];
            types: string[];
            capacityRanges: Array<{
                min: number;
                max: number;
            }>;
            priceRanges: Array<{
                min: number;
                max: number;
            }>;
            facilities: string[];
        };
        timestamp: string;
    }>;
    searchNearby(lat: string, lng: string, radius?: string, type?: string, limit?: string): Promise<{
        success: boolean;
        data: VenueSearchResponse;
        timestamp: string;
    }>;
    getSearchSuggestions(query: string, limit?: string): Promise<{
        success: boolean;
        data: {
            query: string;
            suggestions: Array<{
                type: 'venue' | 'city' | 'type' | 'facility';
                value: string;
                display: string;
                count?: number;
            }>;
        };
        timestamp: string;
    }>;
    getSearchStats(): Promise<{
        success: boolean;
        data: {
            totalSearches: number;
            popularSearches: Array<{
                query: string;
                count: number;
            }>;
            popularCities: Array<{
                city: string;
                count: number;
            }>;
            popularTypes: Array<{
                type: string;
                count: number;
            }>;
            searchTrend: Array<{
                date: string;
                count: number;
            }>;
        };
        timestamp: string;
    }>;
    testSearch(): Promise<{
        success: boolean;
        data: {
            service: string;
            version: string;
            status: 'operational' | 'degraded' | 'failed';
            endpoints: Array<{
                name: string;
                path: string;
                method: string;
                status: 'active' | 'inactive';
            }>;
            performance: {
                averageSearchTimeMs: number;
                successRate: number;
                cacheHitRate: number;
            };
        };
        timestamp: string;
    }>;
}
