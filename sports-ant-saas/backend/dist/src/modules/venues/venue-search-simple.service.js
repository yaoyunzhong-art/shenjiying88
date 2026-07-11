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
var VenueSearchSimpleService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VenueSearchSimpleService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const venue_entity_1 = require("./entities/venue.entity");
let VenueSearchSimpleService = VenueSearchSimpleService_1 = class VenueSearchSimpleService {
    constructor(venuesRepository) {
        this.venuesRepository = venuesRepository;
        this.logger = new common_1.Logger(VenueSearchSimpleService_1.name);
    }
    async searchVenues(options) {
        const startTime = Date.now();
        try {
            this.logger.log('Starting simple venue search', {
                search: options.search,
                city: options.city,
                type: options.type,
            });
            const page = options.page || 1;
            const limit = options.limit || 10;
            const skip = (page - 1) * limit;
            const queryBuilder = this.venuesRepository.createQueryBuilder('venue');
            if (options.search) {
                queryBuilder.where('(venue.name LIKE :search OR venue.description LIKE :search OR venue.address LIKE :search)', { search: `%${options.search}%` });
            }
            if (options.city) {
                queryBuilder.andWhere('venue.city = :city', { city: options.city });
            }
            if (options.province) {
                queryBuilder.andWhere('venue.province = :province', { province: options.province });
            }
            if (options.type) {
                queryBuilder.andWhere('venue.type = :type', { type: options.type });
            }
            if (options.status) {
                queryBuilder.andWhere('venue.status = :status', { status: options.status });
            }
            if (options.minCapacity !== undefined) {
                queryBuilder.andWhere('venue.capacity >= :minCapacity', { minCapacity: options.minCapacity });
            }
            if (options.maxCapacity !== undefined) {
                queryBuilder.andWhere('venue.capacity <= :maxCapacity', { maxCapacity: options.maxCapacity });
            }
            queryBuilder.skip(skip).take(limit);
            queryBuilder.orderBy('venue.createdAt', 'DESC');
            const [venues, total] = await queryBuilder.getManyAndCount();
            const results = venues.map(venue => ({
                venue,
                relevanceScore: 1.0,
            }));
            const totalPages = Math.ceil(total / limit);
            const searchTimeMs = Date.now() - startTime;
            this.logger.log(`Simple venue search completed`, {
                total,
                page,
                limit,
                totalPages,
                searchTimeMs,
            });
            return {
                total,
                page,
                limit,
                totalPages,
                results,
            };
        }
        catch (error) {
            this.logger.error('Simple venue search failed', error);
            throw error;
        }
    }
};
exports.VenueSearchSimpleService = VenueSearchSimpleService;
exports.VenueSearchSimpleService = VenueSearchSimpleService = VenueSearchSimpleService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(venue_entity_1.Venue)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], VenueSearchSimpleService);
//# sourceMappingURL=venue-search-simple.service.js.map