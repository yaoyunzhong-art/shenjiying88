import { User } from '../../users/entities/user.entity';
import { Device } from '../../devices/entities/device.entity';
import { Member } from '../../members/entities/member.entity';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { Session } from '../../sessions/entities/session.entity';
import { Coach } from '../../sessions/entities/coach.entity';
export declare enum VenueStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    MAINTENANCE = "maintenance",
    CLOSED = "closed"
}
export declare enum VenueType {
    GYM = "gym",
    STADIUM = "stadium",
    COURT = "court",
    POOL = "pool",
    OTHER = "other",
    INDOOR = "indoor",
    OUTDOOR = "outdoor",
    MIXED = "mixed"
}
export declare class Venue {
    id: string;
    generateId(): void;
    name: string;
    description: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
    latitude: number;
    longitude: number;
    type: VenueType;
    capacity: number;
    area: number;
    facilities: string[];
    openingHours: Record<string, any>;
    contactPhone: string;
    contactEmail: string;
    status: VenueStatus;
    allowOnlineBooking: boolean;
    bookingAdvanceHours: number;
    cancellationPolicy: Record<string, any>;
    pricing: Record<string, any>;
    hourlyRate: number;
    rating: number;
    reviewCount: number;
    isFeatured: boolean;
    hasParking: boolean;
    hasShower: boolean;
    hasLocker: boolean;
    hasWifi: boolean;
    hasCafe: boolean;
    images: string[];
    createdBy: string;
    ownerId: string;
    owner: User;
    devices: Device[];
    members: Member[];
    tickets: Ticket[];
    sessions: Session[];
    coaches: Coach[];
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date;
    distance?: number;
    averageRating?: number;
    constructor();
}
