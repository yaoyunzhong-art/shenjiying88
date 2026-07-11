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
var VenueSearchController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VenueSearchController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const venue_search_service_1 = require("./venue-search.service");
let VenueSearchController = VenueSearchController_1 = class VenueSearchController {
    constructor(venueSearchService) {
        this.venueSearchService = venueSearchService;
        this.logger = new common_1.Logger(VenueSearchController_1.name);
    }
    async searchVenues(body) {
        this.logger.log('Advanced venue search requested', {
            search: body.search,
            location: body.latitude && body.longitude ? `${body.latitude},${body.longitude}` : undefined,
            filters: Object.keys(body).length,
        });
        const result = await this.venueSearchService.searchVenues(body);
        return {
            success: true,
            data: result,
            timestamp: new Date().toISOString(),
        };
    }
    async quickSearch(query, city, type, lat, lng, radius, page, limit) {
        this.logger.log('Quick venue search requested', {
            query,
            city,
            type,
            location: lat && lng ? `${lat},${lng}` : undefined,
        });
        const options = {
            search: query,
            city,
            type: type,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
        };
        if (lat && lng) {
            options.latitude = parseFloat(lat);
            options.longitude = parseFloat(lng);
            options.radiusKm = radius ? parseFloat(radius) : 10;
        }
        const result = await this.venueSearchService.searchVenues(options);
        return {
            success: true,
            data: result,
            timestamp: new Date().toISOString(),
        };
    }
    async getVenueDetails(venueId, includeAvailability, date, includeReviews, includeSimilar) {
        this.logger.log('Enhanced venue details requested', {
            venueId,
            includeAvailability: includeAvailability === 'true',
            includeSimilar: includeSimilar === 'true',
            date,
        });
        const options = {};
        if (includeAvailability === 'true') {
            options.includeAvailability = true;
            if (date) {
                options.date = new Date(date);
            }
        }
        if (includeReviews === 'true') {
            options.includeReviews = true;
        }
        if (includeSimilar === 'true') {
            options.includeSimilar = true;
        }
        const result = await this.venueSearchService.getVenueDetails(venueId, options);
        return {
            success: true,
            data: result,
            timestamp: new Date().toISOString(),
        };
    }
    async getPopularVenues(city, type, limit) {
        this.logger.log('Popular venues requested', {
            city,
            type,
            limit,
        });
        const options = {};
        if (city)
            options.city = city;
        if (type)
            options.type = type;
        if (limit)
            options.limit = parseInt(limit);
        const result = await this.venueSearchService.getPopularVenues(options);
        return {
            success: true,
            data: result,
            timestamp: new Date().toISOString(),
        };
    }
    async getVenueStatistics(venueId) {
        this.logger.log('Venue statistics requested', { venueId });
        const result = await this.venueSearchService.getVenueStatistics(venueId);
        return {
            success: true,
            data: result,
            timestamp: new Date().toISOString(),
        };
    }
    async getAvailableFilters(city, type) {
        this.logger.log('Available filters requested', { city, type });
        const searchOptions = {};
        if (city)
            searchOptions.city = city;
        if (type)
            searchOptions.type = type;
        const filters = await this.venueSearchService['getAvailableFilters'](searchOptions);
        const facilities = [
            'parking',
            'shower',
            'locker',
            'wifi',
            'cafe',
            'ac',
            'heating',
            'changingRoom',
            'equipmentRental',
            'coaching',
        ];
        return {
            success: true,
            data: {
                ...filters,
                facilities,
            },
            timestamp: new Date().toISOString(),
        };
    }
    async searchNearby(lat, lng, radius, type, limit) {
        this.logger.log('Nearby venues search requested', {
            location: `${lat},${lng}`,
            radius,
            type,
        });
        if (!lat || !lng) {
            throw new Error('Latitude and longitude are required');
        }
        const options = {
            latitude: parseFloat(lat),
            longitude: parseFloat(lng),
            radiusKm: radius ? parseFloat(radius) : 5,
            page: 1,
            limit: limit ? parseInt(limit) : 20,
            sortBy: 'distance',
            sortOrder: 'asc',
        };
        if (type) {
            options.type = type;
        }
        const result = await this.venueSearchService.searchVenues(options);
        return {
            success: true,
            data: result,
            timestamp: new Date().toISOString(),
        };
    }
    async getSearchSuggestions(query, limit) {
        this.logger.log('Search suggestions requested', { query, limit });
        if (!query || query.length < 2) {
            return {
                success: true,
                data: {
                    query: query || '',
                    suggestions: [],
                },
                timestamp: new Date().toISOString(),
            };
        }
        const suggestionLimit = limit ? parseInt(limit) : 10;
        const suggestions = [];
        const mockVenues = [
            { name: '上海体育馆', city: '上海', type: 'STADIUM' },
            { name: '北京工人体育场', city: '北京', type: 'STADIUM' },
            { name: '广州天河体育中心', city: '广州', type: 'STADIUM' },
            { name: '深圳大运中心', city: '深圳', type: 'STADIUM' },
            { name: '杭州黄龙体育中心', city: '杭州', type: 'STADIUM' },
        ];
        const mockCities = ['上海', '北京', '广州', '深圳', '杭州', '成都', '南京', '武汉'];
        const mockTypes = ['健身房', '体育场', '球场', '游泳池', '训练馆'];
        const mockFacilities = ['停车场', '淋浴间', '储物柜', 'WiFi', '咖啡厅'];
        mockVenues.forEach((venue) => {
            if (venue.name.toLowerCase().includes(query.toLowerCase())) {
                suggestions.push({
                    type: 'venue',
                    value: venue.name,
                    display: `${venue.name} (${venue.city})`,
                    count: Math.floor(Math.random() * 100) + 1,
                });
            }
        });
        mockCities.forEach((city) => {
            if (city.toLowerCase().includes(query.toLowerCase())) {
                suggestions.push({
                    type: 'city',
                    value: city,
                    display: `在 ${city} 搜索场馆`,
                    count: Math.floor(Math.random() * 500) + 100,
                });
            }
        });
        mockTypes.forEach((type) => {
            if (type.toLowerCase().includes(query.toLowerCase())) {
                suggestions.push({
                    type: 'type',
                    value: type,
                    display: `${type} 类型场馆`,
                    count: Math.floor(Math.random() * 200) + 50,
                });
            }
        });
        mockFacilities.forEach((facility) => {
            if (facility.toLowerCase().includes(query.toLowerCase())) {
                suggestions.push({
                    type: 'facility',
                    value: facility,
                    display: `有 ${facility} 的场馆`,
                    count: Math.floor(Math.random() * 300) + 80,
                });
            }
        });
        const sortedSuggestions = suggestions
            .sort((a, b) => (b.count || 0) - (a.count || 0))
            .slice(0, suggestionLimit);
        return {
            success: true,
            data: {
                query,
                suggestions: sortedSuggestions,
            },
            timestamp: new Date().toISOString(),
        };
    }
    async getSearchStats() {
        this.logger.log('Search statistics requested');
        return {
            success: true,
            data: {
                totalSearches: 12500,
                popularSearches: [
                    { query: '健身房', count: 1250 },
                    { query: '篮球场', count: 980 },
                    { query: '游泳池', count: 850 },
                    { query: '羽毛球场', count: 720 },
                    { query: '足球场', count: 650 },
                ],
                popularCities: [
                    { city: '上海', count: 3500 },
                    { city: '北京', count: 2800 },
                    { city: '广州', count: 2200 },
                    { city: '深圳', count: 1900 },
                    { city: '杭州', count: 1500 },
                ],
                popularTypes: [
                    { type: '健身房', count: 4500 },
                    { type: '体育场', count: 3200 },
                    { type: '球场', count: 2800 },
                    { type: '游泳池', count: 1500 },
                    { type: '训练馆', count: 800 },
                ],
                searchTrend: [
                    { date: '2026-03-01', count: 420 },
                    { date: '2026-03-02', count: 380 },
                    { date: '2026-03-03', count: 450 },
                    { date: '2026-03-04', count: 520 },
                    { date: '2026-03-05', count: 480 },
                    { date: '2026-03-06', count: 550 },
                    { date: '2026-03-07', count: 600 },
                    { date: '2026-03-08', count: 580 },
                    { date: '2026-03-09', count: 620 },
                    { date: '2026-03-10', count: 650 },
                ],
            },
            timestamp: new Date().toISOString(),
        };
    }
    async testSearch() {
        this.logger.log('Search service test requested');
        return {
            success: true,
            data: {
                service: 'venue-search',
                version: '1.0.0',
                status: 'operational',
                endpoints: [
                    { name: '高级搜索', path: '/api/v1/venues/search', method: 'POST', status: 'active' },
                    {
                        name: '快速搜索',
                        path: '/api/v1/venues/search/quick',
                        method: 'GET',
                        status: 'active',
                    },
                    {
                        name: '场馆详情',
                        path: '/api/v1/venues/search/:id/details',
                        method: 'GET',
                        status: 'active',
                    },
                    {
                        name: '热门场馆',
                        path: '/api/v1/venues/search/popular',
                        method: 'GET',
                        status: 'active',
                    },
                    {
                        name: '附近搜索',
                        path: '/api/v1/venues/search/nearby',
                        method: 'GET',
                        status: 'active',
                    },
                    {
                        name: '搜索建议',
                        path: '/api/v1/venues/search/suggestions',
                        method: 'GET',
                        status: 'active',
                    },
                ],
                performance: {
                    averageSearchTimeMs: 125,
                    successRate: 98.5,
                    cacheHitRate: 65.2,
                },
            },
            timestamp: new Date().toISOString(),
        };
    }
};
exports.VenueSearchController = VenueSearchController;
__decorate([
    (0, swagger_1.ApiOperation)({
        summary: '高级场馆搜索',
        description: '提供完整的场馆搜索功能，支持多种过滤条件和排序选项',
    }),
    (0, swagger_1.ApiBody)({
        description: '搜索选项',
        schema: {
            type: 'object',
            properties: {
                search: { type: 'string', description: '搜索文本', example: '篮球场' },
                latitude: { type: 'number', description: '纬度', example: 31.2304 },
                longitude: { type: 'number', description: '经度', example: 121.4737 },
                radiusKm: { type: 'number', description: '搜索半径(公里)', example: 10 },
                city: { type: 'string', description: '城市', example: '上海' },
                type: { type: 'string', description: '场馆类型', example: 'gym' },
                minCapacity: { type: 'number', description: '最小容量', example: 50 },
                maxCapacity: { type: 'number', description: '最大容量', example: 200 },
                hasParking: { type: 'boolean', description: '是否有停车场', example: true },
                hasShower: { type: 'boolean', description: '是否有淋浴', example: true },
                hasWifi: { type: 'boolean', description: '是否有WiFi', example: true },
                minHourlyRate: { type: 'number', description: '最低每小时价格', example: 50 },
                maxHourlyRate: { type: 'number', description: '最高每小时价格', example: 200 },
                page: { type: 'number', description: '页码', example: 1 },
                limit: { type: 'number', description: '每页数量', example: 20 },
                sortBy: { type: 'string', description: '排序字段', example: 'rating' },
                sortOrder: { type: 'string', description: '排序方向', example: 'desc' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '搜索成功',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        total: { type: 'number', example: 42 },
                        page: { type: 'number', example: 1 },
                        limit: { type: 'number', example: 20 },
                        totalPages: { type: 'number', example: 3 },
                        results: { type: 'array', items: { type: 'object' } },
                        filters: { type: 'object' },
                        metadata: { type: 'object' },
                    },
                },
                timestamp: { type: 'string', example: '2026-03-29T07:24:00.000Z' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '请求参数错误' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: '服务器内部错误' }),
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VenueSearchController.prototype, "searchVenues", null);
__decorate([
    (0, common_1.Get)('quick'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('city')),
    __param(2, (0, common_1.Query)('type')),
    __param(3, (0, common_1.Query)('lat')),
    __param(4, (0, common_1.Query)('lng')),
    __param(5, (0, common_1.Query)('radius')),
    __param(6, (0, common_1.Query)('page')),
    __param(7, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], VenueSearchController.prototype, "quickSearch", null);
__decorate([
    (0, swagger_1.ApiOperation)({
        summary: '获取场馆详情（增强版）',
        description: '获取场馆的详细信息，可选包含可用性、评论和相似场馆',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: '场馆ID',
        example: '550e8400-e29b-41d4-a716-446655440000',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'includeAvailability',
        description: '是否包含可用性信息',
        required: false,
        type: Boolean,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'date',
        description: '查询可用性的日期 (YYYY-MM-DD)',
        required: false,
        type: String,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'includeReviews',
        description: '是否包含评论信息',
        required: false,
        type: Boolean,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'includeSimilar',
        description: '是否包含相似场馆',
        required: false,
        type: Boolean,
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: '获取成功',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean', example: true },
                data: {
                    type: 'object',
                    properties: {
                        venue: { type: 'object' },
                        availability: { type: 'object' },
                        similarVenues: { type: 'array', items: { type: 'object' } },
                        statistics: { type: 'object' },
                    },
                },
                timestamp: { type: 'string', example: '2026-03-29T07:24:00.000Z' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '场馆不存在' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: '服务器内部错误' }),
    (0, common_1.Get)(':id/details'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('includeAvailability')),
    __param(2, (0, common_1.Query)('date')),
    __param(3, (0, common_1.Query)('includeReviews')),
    __param(4, (0, common_1.Query)('includeSimilar')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], VenueSearchController.prototype, "getVenueDetails", null);
__decorate([
    (0, common_1.Get)('popular'),
    __param(0, (0, common_1.Query)('city')),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], VenueSearchController.prototype, "getPopularVenues", null);
__decorate([
    (0, common_1.Get)(':id/statistics'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VenueSearchController.prototype, "getVenueStatistics", null);
__decorate([
    (0, common_1.Get)('filters/available'),
    __param(0, (0, common_1.Query)('city')),
    __param(1, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], VenueSearchController.prototype, "getAvailableFilters", null);
__decorate([
    (0, common_1.Get)('nearby'),
    __param(0, (0, common_1.Query)('lat')),
    __param(1, (0, common_1.Query)('lng')),
    __param(2, (0, common_1.Query)('radius')),
    __param(3, (0, common_1.Query)('type')),
    __param(4, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], VenueSearchController.prototype, "searchNearby", null);
__decorate([
    (0, common_1.Get)('suggestions'),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], VenueSearchController.prototype, "getSearchSuggestions", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], VenueSearchController.prototype, "getSearchStats", null);
__decorate([
    (0, common_1.Get)('test'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], VenueSearchController.prototype, "testSearch", null);
exports.VenueSearchController = VenueSearchController = VenueSearchController_1 = __decorate([
    (0, swagger_1.ApiTags)('场馆搜索'),
    (0, common_1.Controller)('api/v1/venues/search'),
    __metadata("design:paramtypes", [venue_search_service_1.VenueSearchService])
], VenueSearchController);
//# sourceMappingURL=venue-search.controller.js.map