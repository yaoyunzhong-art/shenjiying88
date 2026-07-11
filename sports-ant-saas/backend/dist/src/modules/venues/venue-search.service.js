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
var VenueSearchService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VenueSearchService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const venue_entity_1 = require("./entities/venue.entity");
const session_booking_entity_1 = require("../sessions/entities/session-booking.entity");
const session_entity_1 = require("../sessions/entities/session.entity");
let VenueSearchService = VenueSearchService_1 = class VenueSearchService {
    constructor(venuesRepository, sessionBookingsRepository, sessionsRepository) {
        this.venuesRepository = venuesRepository;
        this.sessionBookingsRepository = sessionBookingsRepository;
        this.sessionsRepository = sessionsRepository;
        this.logger = new common_1.Logger(VenueSearchService_1.name);
        this.EARTH_RADIUS_KM = 6371;
        this.statisticsCache = new Map();
        this.CACHE_TTL_MS = 5 * 60 * 1000;
    }
    async searchVenues(options) {
        const startTime = Date.now();
        try {
            if (Math.random() < 0.1) {
                this.cleanupExpiredCache();
            }
            this.logger.log('Starting venue search', {
                search: options.search,
                location: options.latitude && options.longitude
                    ? `${options.latitude},${options.longitude}`
                    : undefined,
                radiusKm: options.radiusKm,
                filters: this.getAppliedFilters(options),
            });
            const queryBuilder = this.venuesRepository.createQueryBuilder('venue');
            this.applyBaseConditions(queryBuilder, options);
            if (options.latitude && options.longitude) {
                this.applyLocationConditions(queryBuilder, options);
            }
            this.applyFacilityConditions(queryBuilder, options);
            this.applyOperationConditions(queryBuilder, options);
            this.applyPriceConditions(queryBuilder, options);
            const total = await queryBuilder.getCount();
            this.applyPaginationAndSorting(queryBuilder, options);
            const venues = await queryBuilder.getMany();
            const results = await this.processSearchResults(venues, options);
            const availableFilters = await this.getAvailableFilters(options);
            const searchTimeMs = Date.now() - startTime;
            this.logger.log('Venue search completed', {
                total,
                found: results.length,
                searchTimeMs,
                page: options.page || 1,
                limit: options.limit || 20,
            });
            return {
                total,
                page: options.page || 1,
                limit: options.limit || 20,
                totalPages: Math.ceil(total / (options.limit || 20)),
                results,
                filters: {
                    applied: options,
                    available: availableFilters,
                },
                metadata: {
                    searchTimeMs,
                    searchRadiusKm: options.radiusKm,
                    locationUsed: !!(options.latitude && options.longitude),
                },
            };
        }
        catch (error) {
            this.logger.error('Venue search failed', error.stack);
            throw error;
        }
    }
    async getVenueDetails(venueId, options) {
        try {
            const venue = await this.venuesRepository.findOne({
                where: { id: venueId },
                relations: options?.includeReviews ? ['reviews'] : [],
            });
            if (!venue) {
                throw new Error(`Venue not found: ${venueId}`);
            }
            const result = { venue };
            if (options?.includeAvailability) {
                result.availability = await this.getVenueAvailability(venueId, options.date);
            }
            result.statistics = await this.getVenueStatistics(venueId);
            if (options?.includeSimilar) {
                result.similarVenues = await this.findSimilarVenues(venue);
            }
            this.logger.log('Venue details retrieved', {
                venueId,
                includeAvailability: options?.includeAvailability,
                includeSimilar: options?.includeSimilar,
            });
            return result;
        }
        catch (error) {
            this.logger.error(`Failed to get venue details: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getPopularVenues(options) {
        try {
            const queryBuilder = this.venuesRepository.createQueryBuilder('venue');
            queryBuilder.where('venue.status = :status', { status: venue_entity_1.VenueStatus.ACTIVE });
            if (options?.city) {
                queryBuilder.andWhere('venue.city = :city', { city: options.city });
            }
            if (options?.type) {
                queryBuilder.andWhere('venue.type = :type', { type: options.type });
            }
            queryBuilder
                .orderBy('venue.rating', 'DESC')
                .addOrderBy('venue.reviewCount', 'DESC')
                .addOrderBy('venue.capacity', 'DESC');
            const limit = options?.limit || 10;
            queryBuilder.limit(limit);
            const venues = await queryBuilder.getMany();
            return venues.map((venue) => ({
                venue,
                relevanceScore: this.calculatePopularityScore(venue),
            }));
        }
        catch (error) {
            this.logger.error('Failed to get popular venues', error.stack);
            return [];
        }
    }
    async getVenueStatistics(venueId) {
        try {
            const cacheKey = `venue_stats_${venueId}`;
            const cached = this.statisticsCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
                this.logger.debug(`Returning cached statistics for venue ${venueId}`);
                return cached.data;
            }
            const venue = await this.venuesRepository.findOne({
                where: { id: venueId },
                select: ['rating', 'reviewCount', 'hourlyRate', 'capacity'],
            });
            if (!venue) {
                throw new Error(`Venue not found: ${venueId}`);
            }
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const sessions = await this.sessionsRepository.find({
                where: { venueId },
                select: ['id'],
            });
            const sessionIds = sessions ? sessions.map(session => session.id) : [];
            if (sessionIds.length === 0) {
                return {
                    totalBookings: 0,
                    totalRevenue: 0,
                    averageRating: venue.rating || 0,
                    reviewCount: venue.reviewCount || 0,
                    occupancyRate: 0,
                    peakHours: [],
                    monthlyTrend: [],
                };
            }
            const confirmedBookings = await this.sessionBookingsRepository.find({
                where: {
                    sessionId: (0, typeorm_2.In)(sessionIds),
                    status: session_booking_entity_1.BookingStatus.CONFIRMED,
                    bookingDate: (0, typeorm_2.MoreThanOrEqual)(thirtyDaysAgo),
                },
                select: ['id', 'paidAmount', 'bookingDate'],
                relations: ['session'],
            });
            const totalBookings = confirmedBookings.length;
            const totalRevenue = confirmedBookings.reduce((sum, booking) => sum + (Number(booking.paidAmount) || 0), 0);
            const totalSessions = await this.sessionsRepository.count({
                where: { venueId },
            });
            let occupancyRate = 0;
            if (totalSessions > 0 && venue.capacity > 0) {
                const totalAvailableSlots = totalSessions * 30;
                const maxPossibleBookings = totalAvailableSlots * venue.capacity;
                if (maxPossibleBookings > 0) {
                    occupancyRate = Math.round((totalBookings / maxPossibleBookings) * 100);
                }
            }
            occupancyRate = Math.max(0, Math.min(100, occupancyRate));
            const hourCounts = {};
            confirmedBookings.forEach(booking => {
                if (booking.session && booking.session.startTime) {
                    const hour = booking.session.startTime.getHours();
                    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
                }
            });
            const peakHours = Object.entries(hourCounts)
                .map(([hour, bookings]) => ({ hour: parseInt(hour), bookings }))
                .sort((a, b) => b.bookings - a.bookings)
                .slice(0, 5);
            const monthlyTrend = [];
            for (let i = 2; i >= 0; i--) {
                const monthStart = new Date();
                monthStart.setMonth(monthStart.getMonth() - i);
                monthStart.setDate(1);
                monthStart.setHours(0, 0, 0, 0);
                const monthEnd = new Date(monthStart);
                monthEnd.setMonth(monthEnd.getMonth() + 1);
                monthEnd.setMilliseconds(-1);
                const monthBookings = confirmedBookings.filter(booking => booking.bookingDate &&
                    booking.bookingDate >= monthStart &&
                    booking.bookingDate <= monthEnd);
                const monthRevenue = monthBookings.reduce((sum, booking) => sum + (Number(booking.paidAmount) || 0), 0);
                const monthStr = `${monthStart.getFullYear()}-${(monthStart.getMonth() + 1).toString().padStart(2, '0')}`;
                monthlyTrend.push({
                    month: monthStr,
                    bookings: monthBookings.length,
                    revenue: monthRevenue,
                });
            }
            const result = {
                totalBookings,
                totalRevenue,
                averageRating: venue.rating || 0,
                reviewCount: venue.reviewCount || 0,
                occupancyRate,
                peakHours,
                monthlyTrend,
            };
            this.statisticsCache.set(cacheKey, {
                data: result,
                timestamp: Date.now(),
            });
            this.logger.debug(`Cached statistics for venue ${venueId}`);
            return result;
        }
        catch (error) {
            this.logger.error(`Failed to get venue statistics: ${error.message}`, error.stack);
            return {
                totalBookings: 0,
                totalRevenue: 0,
                averageRating: 0,
                reviewCount: 0,
                occupancyRate: 0,
                peakHours: [],
                monthlyTrend: [],
            };
        }
    }
    async getVenueAvailability(venueId, date) {
        try {
            const targetDate = date || new Date();
            const availableSlots = [];
            for (let i = 9; i < 21; i += 2) {
                availableSlots.push({
                    date: targetDate,
                    startTime: `${i.toString().padStart(2, '0')}:00`,
                    endTime: `${(i + 2).toString().padStart(2, '0')}:00`,
                    price: 100 + (i - 9) * 20,
                });
            }
            return {
                isAvailable: availableSlots.length > 0,
                availableSlots,
                nextAvailableDate: targetDate,
            };
        }
        catch (error) {
            this.logger.error(`Failed to get venue availability: ${error.message}`, error.stack);
            throw error;
        }
    }
    async findSimilarVenues(venue) {
        try {
            const queryBuilder = this.venuesRepository.createQueryBuilder('v');
            queryBuilder
                .where('v.id != :venueId', { venueId: venue.id })
                .andWhere('v.city = :city', { city: venue.city })
                .andWhere('v.type = :type', { type: venue.type })
                .andWhere('v.status = :status', { status: venue_entity_1.VenueStatus.ACTIVE });
            if (venue.capacity) {
                const minCapacity = Math.floor(venue.capacity * 0.8);
                const maxCapacity = Math.ceil(venue.capacity * 1.2);
                queryBuilder.andWhere('v.capacity BETWEEN :minCapacity AND :maxCapacity', {
                    minCapacity,
                    maxCapacity,
                });
            }
            queryBuilder
                .orderBy('v.rating', 'DESC')
                .addOrderBy('ABS(v.capacity - :capacity)', 'ASC')
                .setParameter('capacity', venue.capacity || 0)
                .limit(5);
            const similarVenues = await queryBuilder.getMany();
            return similarVenues.map((v) => ({
                venue: v,
                relevanceScore: this.calculateSimilarityScore(venue, v),
            }));
        }
        catch (error) {
            this.logger.error('Failed to find similar venues', error.stack);
            return [];
        }
    }
    applyBaseConditions(queryBuilder, options) {
        if (!options.includeUnavailable) {
            queryBuilder.andWhere('venue.status = :status', {
                status: venue_entity_1.VenueStatus.ACTIVE,
            });
        }
        if (options.search) {
            queryBuilder.andWhere('(venue.name LIKE :search OR venue.description LIKE :search OR venue.address LIKE :search)', { search: `%${options.search}%` });
        }
        if (options.city) {
            queryBuilder.andWhere('venue.city = :city', { city: options.city });
        }
        if (options.province) {
            queryBuilder.andWhere('venue.province = :province', { province: options.province });
        }
        if (options.district) {
            queryBuilder.andWhere('venue.district = :district', { district: options.district });
        }
        if (options.type) {
            queryBuilder.andWhere('venue.type = :type', { type: options.type });
        }
        if (options.minCapacity !== undefined) {
            queryBuilder.andWhere('venue.capacity >= :minCapacity', {
                minCapacity: options.minCapacity,
            });
        }
        if (options.maxCapacity !== undefined) {
            queryBuilder.andWhere('venue.capacity <= :maxCapacity', {
                maxCapacity: options.maxCapacity,
            });
        }
        if (options.onlyFeatured) {
            queryBuilder.andWhere('venue.isFeatured = :isFeatured', {
                isFeatured: true,
            });
        }
        if (options.ownerId) {
            queryBuilder.andWhere('venue.ownerId = :ownerId', {
                ownerId: options.ownerId,
            });
        }
    }
    applyLocationConditions(queryBuilder, options) {
        if (!options.latitude || !options.longitude)
            return;
        const radiusKm = options.radiusKm || 10;
        const lat = options.latitude;
        const lng = options.longitude;
        const latDelta = radiusKm / 111;
        const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
        queryBuilder
            .andWhere('venue.latitude BETWEEN :minLat AND :maxLat', {
            minLat: lat - latDelta,
            maxLat: lat + latDelta,
        })
            .andWhere('venue.longitude BETWEEN :minLng AND :maxLng', {
            minLng: lng - lngDelta,
            maxLng: lng + lngDelta,
        })
            .addSelect(`(${this.EARTH_RADIUS_KM} * ACOS(` +
            `COS(RADIANS(:lat)) * COS(RADIANS(venue.latitude)) * ` +
            `COS(RADIANS(venue.longitude) - RADIANS(:lng)) + ` +
            `SIN(RADIANS(:lat)) * SIN(RADIANS(venue.latitude))))`, 'distance')
            .setParameter('lat', lat)
            .setParameter('lng', lng)
            .having('distance <= :radius')
            .setParameter('radius', radiusKm);
    }
    applyFacilityConditions(queryBuilder, options) {
        if (options.facilities && options.facilities.length > 0) {
            queryBuilder.andWhere('venue.facilities @> :facilities', {
                facilities: options.facilities,
            });
        }
        if (options.hasParking !== undefined) {
            queryBuilder.andWhere('venue.hasParking = :hasParking', {
                hasParking: options.hasParking,
            });
        }
        if (options.hasShower !== undefined) {
            queryBuilder.andWhere('venue.hasShower = :hasShower', {
                hasShower: options.hasShower,
            });
        }
        if (options.hasLocker !== undefined) {
            queryBuilder.andWhere('venue.hasLocker = :hasLocker', {
                hasLocker: options.hasLocker,
            });
        }
        if (options.hasWifi !== undefined) {
            queryBuilder.andWhere('venue.hasWifi = :hasWifi', {
                hasWifi: options.hasWifi,
            });
        }
        if (options.hasCafe !== undefined) {
            queryBuilder.andWhere('venue.hasCafe = :hasCafe', {
                hasCafe: options.hasCafe,
            });
        }
    }
    applyOperationConditions(queryBuilder, options) {
        if (options.allowOnlineBooking !== undefined) {
            queryBuilder.andWhere('venue.allowOnlineBooking = :allowOnlineBooking', {
                allowOnlineBooking: options.allowOnlineBooking,
            });
        }
        if (options.minOpeningHour !== undefined) {
            queryBuilder.andWhere('venue.openingHour <= :minOpeningHour', {
                minOpeningHour: options.minOpeningHour,
            });
        }
        if (options.maxClosingHour !== undefined) {
            queryBuilder.andWhere('venue.closingHour >= :maxClosingHour', {
                maxClosingHour: options.maxClosingHour,
            });
        }
        if (options.is24Hours !== undefined) {
            queryBuilder.andWhere('venue.is24Hours = :is24Hours', {
                is24Hours: options.is24Hours,
            });
        }
    }
    applyPriceConditions(queryBuilder, options) {
        if (options.minHourlyRate !== undefined) {
            queryBuilder.andWhere('venue.hourlyRate >= :minHourlyRate', {
                minHourlyRate: options.minHourlyRate,
            });
        }
        if (options.maxHourlyRate !== undefined) {
            queryBuilder.andWhere('venue.hourlyRate <= :maxHourlyRate', {
                maxHourlyRate: options.maxHourlyRate,
            });
        }
    }
    applyPaginationAndSorting(queryBuilder, options) {
        const page = options.page || 1;
        const limit = options.limit || 20;
        const offset = (page - 1) * limit;
        queryBuilder.skip(offset).take(limit);
        const sortBy = options.sortBy || 'name';
        const sortOrder = options.sortOrder || 'asc';
        switch (sortBy) {
            case 'distance':
                if (options.latitude && options.longitude) {
                    queryBuilder.orderBy('distance', sortOrder);
                }
                else {
                    queryBuilder.orderBy('venue.name', sortOrder);
                }
                break;
            case 'capacity':
                queryBuilder.orderBy('venue.capacity', sortOrder);
                break;
            case 'hourlyRate':
                queryBuilder.orderBy('venue.hourlyRate', sortOrder);
                break;
            case 'rating':
                queryBuilder.orderBy('venue.rating', sortOrder);
                break;
            default:
                queryBuilder.orderBy('venue.name', sortOrder);
        }
    }
    async processSearchResults(venues, options) {
        const results = [];
        for (const venue of venues) {
            const result = {
                venue,
                relevanceScore: this.calculateRelevanceScore(venue, options),
            };
            if (options.latitude && options.longitude && venue.latitude && venue.longitude) {
                result.distanceKm = this.calculateDistance(options.latitude, options.longitude, venue.latitude, venue.longitude);
            }
            if (options.date || options.startTime) {
                result.availability = await this.getVenueAvailability(venue.id, options.date);
            }
            result.pricing = venue.pricing || {
                hourlyRate: 0,
                dailyRate: 0,
                weeklyRate: 0,
                monthlyRate: 0,
                discountRate: 0,
            };
            results.push(result);
        }
        return results;
    }
    async getAvailableFilters(_options) {
        try {
            return {
                cities: ['上海', '北京', '广州', '深圳', '杭州', '成都'],
                provinces: ['上海市', '北京市', '广东省', '浙江省', '四川省'],
                types: [venue_entity_1.VenueType.GYM, venue_entity_1.VenueType.STADIUM, venue_entity_1.VenueType.COURT, venue_entity_1.VenueType.POOL, venue_entity_1.VenueType.OTHER],
                capacityRanges: [
                    { min: 0, max: 50 },
                    { min: 51, max: 100 },
                    { min: 101, max: 200 },
                    { min: 201, max: 500 },
                    { min: 501, max: 1000 },
                ],
                priceRanges: [
                    { min: 0, max: 100 },
                    { min: 101, max: 200 },
                    { min: 201, max: 500 },
                    { min: 501, max: 1000 },
                    { min: 1001, max: 5000 },
                ],
            };
        }
        catch (error) {
            this.logger.error('Failed to get available filters', error.stack);
            return {
                cities: [],
                provinces: [],
                types: [],
                capacityRanges: [],
                priceRanges: [],
            };
        }
    }
    calculateRelevanceScore(venue, options) {
        let score = 100;
        if (options.search) {
            const searchLower = options.search.toLowerCase();
            const nameMatch = venue.name.toLowerCase().includes(searchLower) ? 20 : 0;
            const descMatch = venue.description?.toLowerCase().includes(searchLower) ? 10 : 0;
            const addressMatch = venue.address?.toLowerCase().includes(searchLower) ? 15 : 0;
            score += nameMatch + descMatch + addressMatch;
        }
        if (options.latitude && options.longitude && venue.latitude && venue.longitude) {
            const distance = this.calculateDistance(options.latitude, options.longitude, venue.latitude, venue.longitude);
            if (distance <= 1)
                score += 30;
            else if (distance <= 5)
                score += 20;
            else if (distance <= 10)
                score += 10;
            else if (distance <= 20)
                score += 5;
        }
        if (venue.rating) {
            score += venue.rating * 5;
        }
        if (venue.isFeatured) {
            score += 15;
        }
        if (venue.allowOnlineBooking) {
            score += 10;
        }
        let facilityScore = 0;
        if (venue.hasParking)
            facilityScore += 5;
        if (venue.hasShower)
            facilityScore += 5;
        if (venue.hasLocker)
            facilityScore += 3;
        if (venue.hasWifi)
            facilityScore += 3;
        if (venue.hasCafe)
            facilityScore += 2;
        score += facilityScore;
        return Math.min(score, 200);
    }
    calculatePopularityScore(venue) {
        let score = 100;
        if (venue.rating) {
            score += venue.rating * 10;
        }
        if (venue.reviewCount) {
            score += Math.min(venue.reviewCount * 0.5, 50);
        }
        if (venue.capacity) {
            score += Math.min(venue.capacity * 0.01, 30);
        }
        if (venue.isFeatured) {
            score += 20;
        }
        return score;
    }
    calculateSimilarityScore(venue1, venue2) {
        let score = 100;
        if (venue1.type === venue2.type) {
            score += 20;
        }
        if (venue1.city === venue2.city) {
            score += 15;
        }
        if (venue1.capacity && venue2.capacity) {
            const capacityDiff = Math.abs(venue1.capacity - venue2.capacity);
            const capacityRatio = capacityDiff / Math.max(venue1.capacity, venue2.capacity);
            score += Math.max(0, 30 - capacityRatio * 100);
        }
        if (venue1.hourlyRate && venue2.hourlyRate) {
            const priceDiff = Math.abs(venue1.hourlyRate - venue2.hourlyRate);
            const priceRatio = priceDiff / Math.max(venue1.hourlyRate, venue2.hourlyRate);
            score += Math.max(0, 20 - priceRatio * 100);
        }
        let facilityMatch = 0;
        if (venue1.hasParking === venue2.hasParking)
            facilityMatch += 5;
        if (venue1.hasShower === venue2.hasShower)
            facilityMatch += 5;
        if (venue1.hasLocker === venue2.hasLocker)
            facilityMatch += 3;
        if (venue1.hasWifi === venue2.hasWifi)
            facilityMatch += 3;
        if (venue1.hasCafe === venue2.hasCafe)
            facilityMatch += 2;
        score += facilityMatch;
        return score;
    }
    calculateDistance(lat1, lon1, lat2, lon2) {
        if (lat1 === lat2 && lon1 === lon2) {
            return 0;
        }
        const latDiff = Math.abs(lat1 - lat2);
        const lonDiff = Math.abs(lon1 - lon2);
        if (latDiff < 0.001 && lonDiff < 0.001) {
            const approxDistance = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111.32;
            return Math.max(0.01, approxDistance);
        }
        const R = this.EARTH_RADIUS_KM;
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    getAppliedFilters(options) {
        const filters = {};
        Object.entries(options).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                filters[key] = value;
            }
        });
        return filters;
    }
    cleanupExpiredCache() {
        const now = Date.now();
        let cleanedCount = 0;
        for (const [key, value] of this.statisticsCache.entries()) {
            if (now - value.timestamp > this.CACHE_TTL_MS) {
                this.statisticsCache.delete(key);
                cleanedCount++;
            }
        }
        if (cleanedCount > 0) {
            this.logger.debug(`Cleaned ${cleanedCount} expired cache entries`);
        }
    }
    clearVenueCache(venueId) {
        if (venueId) {
            const cacheKey = `venue_stats_${venueId}`;
            this.statisticsCache.delete(cacheKey);
            this.logger.debug(`Cleared cache for venue ${venueId}`);
        }
        else {
            const count = this.statisticsCache.size;
            this.statisticsCache.clear();
            this.logger.debug(`Cleared all cache entries (${count} total)`);
        }
    }
};
exports.VenueSearchService = VenueSearchService;
exports.VenueSearchService = VenueSearchService = VenueSearchService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(venue_entity_1.Venue)),
    __param(1, (0, typeorm_1.InjectRepository)(session_booking_entity_1.SessionBooking)),
    __param(2, (0, typeorm_1.InjectRepository)(session_entity_1.Session)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], VenueSearchService);
//# sourceMappingURL=venue-search.service.js.map