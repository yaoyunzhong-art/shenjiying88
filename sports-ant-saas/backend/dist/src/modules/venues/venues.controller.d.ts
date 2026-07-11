import { Request as ExpressRequest } from 'express';
import { VenuesService, FindVenuesOptions } from './venues.service';
import { CreateVenueDto } from './dto/create-venue.dto';
import { UpdateVenueDto } from './dto/update-venue.dto';
import { VenueResponseDto } from './dto/venue-response.dto';
import { VenueStatus, VenueType } from './entities/venue.entity';
export declare class VenuesController {
    private readonly venuesService;
    constructor(venuesService: VenuesService);
    create(createVenueDto: CreateVenueDto, req: ExpressRequest & {
        user: any;
    }): Promise<VenueResponseDto>;
    getStats(): Promise<{
        total: number;
        byStatus: Record<string, number>;
        byType: Record<string, number>;
        byCity: Record<string, number>;
    }>;
    searchNearby(latitude: number, longitude: number, radius: number, city?: string, type?: VenueType): Promise<VenueResponseDto[]>;
    getMyVenues(req: ExpressRequest & {
        user: any;
    }, page?: number, limit?: number): Promise<{
        venues: VenueResponseDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findAll(query: FindVenuesOptions): Promise<{
        venues: VenueResponseDto[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    findOne(id: string): Promise<VenueResponseDto>;
    update(id: string, updateVenueDto: UpdateVenueDto, req: ExpressRequest & {
        user: any;
    }): Promise<VenueResponseDto>;
    remove(id: string, req: ExpressRequest & {
        user: any;
    }): Promise<void>;
    changeStatus(id: string, status: VenueStatus, req: ExpressRequest & {
        user: any;
    }): Promise<VenueResponseDto>;
}
