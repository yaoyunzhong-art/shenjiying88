"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const typeorm_1 = require("@nestjs/typeorm");
const venue_search_service_1 = require("./venue-search.service");
const venue_entity_1 = require("./entities/venue.entity");
const session_booking_entity_1 = require("../sessions/entities/session-booking.entity");
const session_entity_1 = require("../sessions/entities/session.entity");
const createMockVenue = (overrides = {}) => {
    const baseVenue = new venue_entity_1.Venue();
    Object.assign(baseVenue, {
        id: 'test-venue-1',
        name: '测试场馆',
        description: '这是一个测试场馆描述',
        address: '测试地址123号',
        city: '上海',
        province: '上海市',
        postalCode: '200000',
        country: '中国',
        latitude: 31.2304,
        longitude: 121.4737,
        type: venue_entity_1.VenueType.GYM,
        capacity: 100,
        area: 500,
        facilities: ['篮球场', '健身房', '游泳池'],
        openingHours: { weekday: '09:00-22:00', weekend: '10:00-20:00' },
        contactPhone: '13800138000',
        contactEmail: 'test@example.com',
        status: venue_entity_1.VenueStatus.ACTIVE,
        allowOnlineBooking: true,
        bookingAdvanceHours: 24,
        cancellationPolicy: { refundable: true, deadline: 2 },
        pricing: { hourlyRate: 100, dailyRate: 800 },
        images: ['venue1.jpg', 'venue2.jpg'],
        createdBy: 'admin',
        ownerId: 'owner-1',
        createdAt: new Date('2026-03-28T10:00:00Z'),
        updatedAt: new Date('2026-03-28T10:00:00Z'),
        deletedAt: null,
        hourlyRate: 100,
        rating: 4.5,
        reviewCount: 42,
        isFeatured: true,
        hasParking: true,
        hasShower: true,
        hasLocker: true,
        hasWifi: true,
        hasCafe: true,
        distance: 0,
        averageRating: 4.5,
    });
    Object.assign(baseVenue, overrides);
    return baseVenue;
};
const createMockQueryBuilder = (mockData = []) => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    setParameter: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    having: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue(mockData),
    getCount: jest.fn().mockResolvedValue(mockData.length),
});
describe('VenueSearchService', () => {
    let service;
    let venueRepository;
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                venue_search_service_1.VenueSearchService,
                {
                    provide: (0, typeorm_1.getRepositoryToken)(venue_entity_1.Venue),
                    useValue: {
                        createQueryBuilder: jest.fn(() => createMockQueryBuilder()),
                        findOne: jest.fn(),
                        find: jest.fn(),
                        count: jest.fn(),
                    },
                },
                {
                    provide: (0, typeorm_1.getRepositoryToken)(session_booking_entity_1.SessionBooking),
                    useValue: {
                        find: jest.fn(),
                    },
                },
                {
                    provide: (0, typeorm_1.getRepositoryToken)(session_entity_1.Session),
                    useValue: {
                        find: jest.fn(),
                        count: jest.fn(),
                    },
                },
            ],
        }).compile();
        service = module.get(venue_search_service_1.VenueSearchService);
        venueRepository = module.get((0, typeorm_1.getRepositoryToken)(venue_entity_1.Venue));
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('searchVenues', () => {
        it('should return venues with default options', async () => {
            const mockVenues = [
                createMockVenue({ id: 'venue-1', name: '场馆A' }),
                createMockVenue({ id: 'venue-2', name: '场馆B' }),
            ];
            const mockQueryBuilder = createMockQueryBuilder(mockVenues);
            jest.spyOn(venueRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder);
            const result = await service.searchVenues({});
            expect(result).toBeDefined();
            expect(result.total).toBe(2);
            expect(result.results).toHaveLength(2);
            expect(result.results[0].venue.name).toBe('场馆A');
            expect(result.results[1].venue.name).toBe('场馆B');
            expect(result.page).toBe(1);
            expect(result.limit).toBe(20);
        });
        it('should filter by search text', async () => {
            const mockVenues = [createMockVenue({ name: '篮球场馆' })];
            const mockQueryBuilder = createMockQueryBuilder(mockVenues);
            jest.spyOn(venueRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder);
            const result = await service.searchVenues({ search: '篮球' });
            expect(result).toBeDefined();
            expect(result.total).toBe(1);
            expect(result.results[0].venue.name).toBe('篮球场馆');
            expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
        });
        it('should filter by location and radius', async () => {
            const mockVenues = [createMockVenue({ city: '上海' })];
            const mockQueryBuilder = createMockQueryBuilder(mockVenues);
            jest.spyOn(venueRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder);
            const result = await service.searchVenues({
                latitude: 31.2304,
                longitude: 121.4737,
                radiusKm: 10,
            });
            expect(result).toBeDefined();
            expect(result.total).toBe(1);
            expect(result.metadata.locationUsed).toBe(true);
            expect(result.metadata.searchRadiusKm).toBe(10);
        });
        it('should apply pagination correctly', async () => {
            const mockVenues = Array.from({ length: 5 }, (_, i) => createMockVenue({ id: `venue-${i}`, name: `场馆${i}` }));
            const mockQueryBuilder = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                setParameter: jest.fn().mockReturnThis(),
                addSelect: jest.fn().mockReturnThis(),
                having: jest.fn().mockReturnThis(),
                skip: jest.fn().mockReturnThis(),
                take: jest.fn().mockReturnThis(),
                limit: jest.fn().mockReturnThis(),
                orderBy: jest.fn().mockReturnThis(),
                addOrderBy: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(mockVenues.slice(3, 6)),
                getCount: jest.fn().mockResolvedValue(5),
            };
            jest.spyOn(venueRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder);
            const result = await service.searchVenues({
                page: 2,
                limit: 3,
            });
            expect(result).toBeDefined();
            expect(result.total).toBe(5);
            expect(result.results).toHaveLength(2);
            expect(result.page).toBe(2);
            expect(result.limit).toBe(3);
            expect(result.totalPages).toBe(2);
            expect(mockQueryBuilder.skip).toHaveBeenCalledWith(3);
            expect(mockQueryBuilder.take).toHaveBeenCalledWith(3);
        });
        it('should sort by rating correctly', async () => {
            const mockVenues = [
                createMockVenue({ id: 'venue-1', rating: 4.0 }),
                createMockVenue({ id: 'venue-2', rating: 4.8 }),
            ];
            const mockQueryBuilder = createMockQueryBuilder(mockVenues);
            jest.spyOn(venueRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder);
            const result = await service.searchVenues({
                sortBy: 'rating',
                sortOrder: 'desc',
            });
            expect(result).toBeDefined();
            expect(mockQueryBuilder.orderBy).toHaveBeenCalled();
        });
    });
    describe('getVenueDetails', () => {
        it('should return venue details for valid ID', async () => {
            const mockVenue = createMockVenue({ id: 'test-venue-123' });
            jest.spyOn(venueRepository, 'findOne').mockResolvedValue(mockVenue);
            const result = await service.getVenueDetails('test-venue-123');
            expect(result).toBeDefined();
            expect(result.venue.id).toBe('test-venue-123');
            expect(result.venue.name).toBe('测试场馆');
            expect(venueRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'test-venue-123' },
                relations: [],
            });
        });
        it('should include reviews when requested', async () => {
            const mockVenue = createMockVenue();
            jest.spyOn(venueRepository, 'findOne').mockResolvedValue(mockVenue);
            const result = await service.getVenueDetails('test-venue-123', {
                includeReviews: true,
            });
            expect(result).toBeDefined();
            expect(venueRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'test-venue-123' },
                relations: ['reviews'],
            });
        });
        it('should include similar venues when requested', async () => {
            const mockVenue = createMockVenue({ city: '上海', type: venue_entity_1.VenueType.GYM });
            jest.spyOn(venueRepository, 'findOne').mockResolvedValue(mockVenue);
            jest.spyOn(service, 'findSimilarVenues').mockResolvedValue([
                { venue: createMockVenue({ id: 'similar-1' }), relevanceScore: 85 },
            ]);
            const result = await service.getVenueDetails('test-venue-123', {
                includeSimilar: true,
            });
            expect(result).toBeDefined();
            expect(result.similarVenues).toBeDefined();
            expect(result.similarVenues).toHaveLength(1);
            expect(result.similarVenues[0].venue.id).toBe('similar-1');
        });
        it('should throw error for invalid venue ID', async () => {
            jest.spyOn(venueRepository, 'findOne').mockResolvedValue(null);
            await expect(service.getVenueDetails('invalid-id')).rejects.toThrow('Venue not found: invalid-id');
        });
    });
    describe('getPopularVenues', () => {
        it('should return popular venues with default limit', async () => {
            const mockVenues = [
                createMockVenue({ id: 'popular-1', rating: 4.8 }),
                createMockVenue({ id: 'popular-2', rating: 4.7 }),
                createMockVenue({ id: 'popular-3', rating: 4.6 }),
            ];
            const mockQueryBuilder = createMockQueryBuilder(mockVenues);
            jest.spyOn(venueRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder);
            const result = await service.getPopularVenues();
            expect(result).toBeDefined();
            expect(result).toHaveLength(3);
            expect(result[0].venue.rating).toBe(4.8);
            expect(result[0].relevanceScore).toBeGreaterThan(0);
            expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith('venue.rating', 'DESC');
        });
        it('should filter by city when specified', async () => {
            const mockVenues = [createMockVenue({ city: '北京' })];
            const mockQueryBuilder = createMockQueryBuilder(mockVenues);
            jest.spyOn(venueRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder);
            const result = await service.getPopularVenues({ city: '北京' });
            expect(result).toBeDefined();
            expect(result).toHaveLength(1);
            expect(result[0].venue.city).toBe('北京');
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('venue.city = :city', { city: '北京' });
        });
        it('should filter by type when specified', async () => {
            const mockVenues = [createMockVenue({ type: venue_entity_1.VenueType.POOL })];
            const mockQueryBuilder = createMockQueryBuilder(mockVenues);
            jest.spyOn(venueRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder);
            const result = await service.getPopularVenues({ type: venue_entity_1.VenueType.POOL });
            expect(result).toBeDefined();
            expect(result).toHaveLength(1);
            expect(result[0].venue.type).toBe(venue_entity_1.VenueType.POOL);
        });
        it('should respect limit parameter', async () => {
            const mockVenues = Array.from({ length: 15 }, (_, i) => createMockVenue({ id: `venue-${i}` })).slice(0, 5);
            const mockQueryBuilder = createMockQueryBuilder(mockVenues);
            jest.spyOn(venueRepository, 'createQueryBuilder').mockReturnValue(mockQueryBuilder);
            const result = await service.getPopularVenues({ limit: 5 });
            expect(result).toBeDefined();
            expect(result).toHaveLength(5);
            expect(mockQueryBuilder.limit).toHaveBeenCalledWith(5);
        });
    });
    describe('getVenueStatistics', () => {
        it('should return venue statistics with real data', async () => {
            const mockVenue = createMockVenue({
                id: 'test-venue-123',
                rating: 4.5,
                reviewCount: 42,
                capacity: 100,
                hourlyRate: 100
            });
            const mockSessions = [
                { id: 'session-1' },
                { id: 'session-2' },
            ];
            const mockBookings = [
                {
                    id: 'booking-1',
                    paidAmount: 200,
                    bookingDate: new Date('2026-03-15T10:00:00Z'),
                    session: { startTime: new Date('2026-03-15T14:00:00Z') },
                    status: session_booking_entity_1.BookingStatus.CONFIRMED
                },
                {
                    id: 'booking-2',
                    paidAmount: 150,
                    bookingDate: new Date('2026-03-20T10:00:00Z'),
                    session: { startTime: new Date('2026-03-20T18:00:00Z') },
                    status: session_booking_entity_1.BookingStatus.CONFIRMED
                },
            ];
            jest.spyOn(venueRepository, 'findOne').mockResolvedValue(mockVenue);
            const sessionRepository = {
                find: jest.fn().mockResolvedValue(mockSessions),
                count: jest.fn().mockResolvedValue(10),
            };
            const sessionBookingRepository = {
                find: jest.fn().mockResolvedValue(mockBookings),
            };
            const moduleRef = service;
            moduleRef.sessionsRepository = sessionRepository;
            moduleRef.sessionBookingsRepository = sessionBookingRepository;
            const result = await service.getVenueStatistics('test-venue-123');
            expect(result).toBeDefined();
            expect(result.totalBookings).toBe(2);
            expect(result.totalRevenue).toBe(350);
            expect(result.averageRating).toBe(4.5);
            expect(result.reviewCount).toBe(42);
            expect(result.occupancyRate).toBeGreaterThanOrEqual(0);
            expect(result.peakHours.length).toBeLessThanOrEqual(5);
            expect(result.monthlyTrend.length).toBeLessThanOrEqual(3);
        });
        it('should return zero statistics for venue with no sessions', async () => {
            const mockVenue = createMockVenue({
                id: 'test-venue-no-sessions',
                rating: 0,
                reviewCount: 0,
                capacity: 50
            });
            jest.spyOn(venueRepository, 'findOne').mockResolvedValue(mockVenue);
            const sessionRepository = {
                find: jest.fn().mockResolvedValue([]),
                count: jest.fn().mockResolvedValue(0),
            };
            const sessionBookingRepository = {
                find: jest.fn().mockResolvedValue([]),
            };
            const moduleRef = service;
            moduleRef.sessionsRepository = sessionRepository;
            moduleRef.sessionBookingsRepository = sessionBookingRepository;
            const result = await service.getVenueStatistics('test-venue-no-sessions');
            expect(result).toBeDefined();
            expect(result.totalBookings).toBe(0);
            expect(result.totalRevenue).toBe(0);
            expect(result.averageRating).toBe(0);
            expect(result.reviewCount).toBe(0);
            expect(result.occupancyRate).toBe(0);
            expect(result.peakHours).toHaveLength(0);
            expect(result.monthlyTrend).toHaveLength(0);
        });
        it('should handle errors gracefully', async () => {
            jest.spyOn(venueRepository, 'findOne').mockRejectedValue(new Error('Database error'));
            const result = await service.getVenueStatistics('error-venue');
            expect(result).toBeDefined();
            expect(result.totalBookings).toBe(0);
            expect(result.totalRevenue).toBe(0);
        });
    });
});
//# sourceMappingURL=venue-search.service.spec.js.map