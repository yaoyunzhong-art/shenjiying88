import { Repository } from 'typeorm';
import { Venue, VenueStatus, VenueType } from './entities/venue.entity';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { VenueResponseDto } from './dto/venue-response.dto';
export interface FindVenuesOptions {
    city?: string;
    province?: string;
    type?: VenueType;
    status?: VenueStatus;
    minCapacity?: number;
    maxCapacity?: number;
    allowOnlineBooking?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    latitude?: number;
    longitude?: number;
    radius?: number;
}
export declare class VenuesService {
    private venuesRepository;
    constructor(venuesRepository: Repository<Venue>);
    create(createVenueDto: CreateVenueDto, userId: string): Promise<VenueResponseDto>;
    findAll(options?: FindVenuesOptions): Promise<{
        venues: VenueResponseDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<VenueResponseDto>;
    update(id: string, updateVenueDto: UpdateVenueDto, userId: string): Promise<VenueResponseDto>;
    remove(id: string, userId: string): Promise<void>;
    getMyVenues(userId: string, page?: number, limit?: number): Promise<{
        venues: VenueResponseDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    changeStatus(id: string, status: VenueStatus, userId: string): Promise<VenueResponseDto>;
    getStats(): Promise<{
        total: number;
        byStatus: Record<string, number>;
        byType: Record<string, number>;
        byCity: Record<string, number>;
    }>;
    searchNearby(latitude: number, longitude: number, radius: number, options?: Omit<FindVenuesOptions, 'latitude' | 'longitude' | 'radius'>): Promise<VenueResponseDto[]>;
    private calculateDistance;
    private toRad;
}
