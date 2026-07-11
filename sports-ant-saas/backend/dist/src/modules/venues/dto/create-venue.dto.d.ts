import { VenueType, VenueStatus } from '../entities/venue.entity';
export declare class CreateVenueDto {
    name: string;
    description?: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    type: VenueType;
    capacity: number;
    area?: number;
    facilities?: string[];
    openingHours?: Record<string, any>;
    contactPhone: string;
    contactEmail: string;
    status?: VenueStatus;
    allowOnlineBooking?: boolean;
    bookingAdvanceHours?: number;
    cancellationPolicy?: Record<string, any>;
    pricing?: Record<string, any>;
    images?: string[];
    ownerId?: string;
}
