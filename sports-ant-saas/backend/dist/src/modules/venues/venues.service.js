"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VenuesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const venue_entity_1 = require("./entities/venue.entity");
const venue_response_dto_1 = require("./dto/venue-response.dto");
let VenuesService = class VenuesService {
    constructor(venuesRepository) {
        this.venuesRepository = venuesRepository;
    }
    async create(createVenueDto, userId) {
        const existingVenue = await this.venuesRepository.findOne({
            where: { contactEmail: createVenueDto.contactEmail },
        });
        if (existingVenue) {
            throw new common_1.BadRequestException('该邮箱已被其他场地使用');
        }
        const venue = this.venuesRepository.create({
            ...createVenueDto,
            id: (0, uuid_1.v4)(),
            createdBy: userId,
            ownerId: createVenueDto.ownerId || userId,
        });
        const savedVenue = await this.venuesRepository.save(venue);
        return venue_response_dto_1.VenueResponseDto.fromEntity(savedVenue);
    }
    async findAll(options = {}) {
        const { city, province, type, status, minCapacity, maxCapacity, allowOnlineBooking, search, page = 1, limit = 10, latitude, longitude, radius, } = options;
        const query = this.venuesRepository.createQueryBuilder('venue');
        if (city)
            query.andWhere('venue.city = :city', { city });
        if (province)
            query.andWhere('venue.province = :province', { province });
        if (type)
            query.andWhere('venue.type = :type', { type });
        if (status)
            query.andWhere('venue.status = :status', { status });
        if (allowOnlineBooking !== undefined) {
            query.andWhere('venue.allowOnlineBooking = :allowOnlineBooking', { allowOnlineBooking });
        }
        if (minCapacity !== undefined) {
            query.andWhere('venue.capacity >= :minCapacity', { minCapacity });
        }
        if (maxCapacity !== undefined) {
            query.andWhere('venue.capacity <= :maxCapacity', { maxCapacity });
        }
        if (search) {
            query.andWhere('(venue.name LIKE :search OR venue.description LIKE :search OR venue.address LIKE :search)', { search: `%${search}%` });
        }
        if (latitude && longitude && radius) {
            const latDelta = radius / 111;
            const lngDelta = radius / (111 * Math.cos(latitude * (Math.PI / 180)));
            query.andWhere('venue.latitude BETWEEN :minLat AND :maxLat', {
                minLat: latitude - latDelta,
                maxLat: latitude + latDelta,
            });
            query.andWhere('venue.longitude BETWEEN :minLng AND :maxLng', {
                minLng: longitude - lngDelta,
                maxLng: longitude + lngDelta,
            });
        }
        const total = await query.getCount();
        const skip = (page - 1) * limit;
        query.skip(skip).take(limit);
        query.orderBy('venue.createdAt', 'DESC');
        const venues = await query.getMany();
        if (latitude && longitude) {
            venues.forEach((venue) => {
                if (venue.latitude && venue.longitude) {
                    venue.distance = this.calculateDistance(latitude, longitude, venue.latitude, venue.longitude);
                }
            });
        }
        return {
            venues: venue_response_dto_1.VenueResponseDto.fromEntities(venues),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async findOne(id) {
        const venue = await this.venuesRepository.findOne({
            where: { id },
        });
        if (!venue) {
            throw new common_1.NotFoundException(`场地 ${id} 不存在`);
        }
        return venue_response_dto_1.VenueResponseDto.fromEntity(venue);
    }
    async update(id, updateVenueDto, userId) {
        const venue = await this.venuesRepository.findOne({
            where: { id },
        });
        if (!venue) {
            throw new common_1.NotFoundException(`场地 ${id} 不存在`);
        }
        if (venue.createdBy !== userId && venue.ownerId !== userId) {
            throw new common_1.ForbiddenException('无权修改此场地');
        }
        if (updateVenueDto.contactEmail && updateVenueDto.contactEmail !== venue.contactEmail) {
            const existingVenue = await this.venuesRepository.findOne({
                where: { contactEmail: updateVenueDto.contactEmail },
            });
            if (existingVenue && existingVenue.id !== id) {
                throw new common_1.BadRequestException('该邮箱已被其他场地使用');
            }
        }
        Object.assign(venue, updateVenueDto);
        const updatedVenue = await this.venuesRepository.save(venue);
        return venue_response_dto_1.VenueResponseDto.fromEntity(updatedVenue);
    }
    async remove(id, userId) {
        const venue = await this.venuesRepository.findOne({
            where: { id },
        });
        if (!venue) {
            throw new common_1.NotFoundException(`场地 ${id} 不存在`);
        }
        if (venue.createdBy !== userId && venue.ownerId !== userId) {
            throw new common_1.ForbiddenException('无权删除此场地');
        }
        venue.deletedAt = new Date();
        venue.status = venue_entity_1.VenueStatus.CLOSED;
        await this.venuesRepository.save(venue);
    }
    async getMyVenues(userId, page = 1, limit = 10) {
        const query = this.venuesRepository
            .createQueryBuilder('venue')
            .where('venue.createdBy = :userId OR venue.ownerId = :userId', { userId })
            .andWhere('venue.deletedAt IS NULL');
        const total = await query.getCount();
        const skip = (page - 1) * limit;
        const venues = await query.skip(skip).take(limit).orderBy('venue.createdAt', 'DESC').getMany();
        return {
            venues: venue_response_dto_1.VenueResponseDto.fromEntities(venues),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async changeStatus(id, status, userId) {
        const venue = await this.venuesRepository.findOne({
            where: { id },
        });
        if (!venue) {
            throw new common_1.NotFoundException(`场地 ${id} 不存在`);
        }
        if (venue.createdBy !== userId && venue.ownerId !== userId) {
            throw new common_1.ForbiddenException('无权修改此场地状态');
        }
        venue.status = status;
        const updatedVenue = await this.venuesRepository.save(venue);
        return venue_response_dto_1.VenueResponseDto.fromEntity(updatedVenue);
    }
    async getStats() {
        const venues = await this.venuesRepository
            .createQueryBuilder('venue')
            .where('venue.deletedAt IS NULL')
            .select(['venue.status', 'venue.type', 'venue.city'])
            .getMany();
        const byStatus = {};
        const byType = {};
        const byCity = {};
        for (const v of venues) {
            byStatus[v.status] = (byStatus[v.status] || 0) + 1;
            byType[v.type] = (byType[v.type] || 0) + 1;
            if (v.city) {
                byCity[v.city] = (byCity[v.city] || 0) + 1;
            }
        }
        return { total: venues.length, byStatus, byType, byCity };
    }
    async searchNearby(latitude, longitude, radius, options = {}) {
        const { venues } = await this.findAll({
            ...options,
            latitude,
            longitude,
            radius,
        });
        return venues.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) *
                Math.cos(this.toRad(lat2)) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    toRad(degrees) {
        return degrees * (Math.PI / 180);
    }
};
exports.VenuesService = VenuesService;
exports.VenuesService = VenuesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(venue_entity_1.Venue)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], VenuesService);
//# sourceMappingURL=venues.service.js.map