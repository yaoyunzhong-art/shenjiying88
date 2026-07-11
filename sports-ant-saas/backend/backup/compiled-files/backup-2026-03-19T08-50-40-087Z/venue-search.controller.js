"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VenueSearchController = void 0;
var common_1 = require("@nestjs/common");
var VenueSearchController = function () {
    var _classDecorators = [(0, common_1.Controller)('api/v1/venues/search')];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var _instanceExtraInitializers = [];
    var _searchVenues_decorators;
    var _quickSearch_decorators;
    var _getVenueDetails_decorators;
    var _getPopularVenues_decorators;
    var _getVenueStatistics_decorators;
    var _getAvailableFilters_decorators;
    var _searchNearby_decorators;
    var _getSearchSuggestions_decorators;
    var _getSearchStats_decorators;
    var _testSearch_decorators;
    var VenueSearchController = _classThis = /** @class */ (function () {
        function VenueSearchController_1(venueSearchService) {
            this.venueSearchService = (__runInitializers(this, _instanceExtraInitializers), venueSearchService);
            this.logger = new common_1.Logger(VenueSearchController.name);
        }
        /**
         * 高级场馆搜索
         */
        VenueSearchController_1.prototype.searchVenues = function (body) {
            return __awaiter(this, void 0, void 0, function () {
                var result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log('Advanced venue search requested', {
                                search: body.search,
                                location: body.latitude && body.longitude
                                    ? "".concat(body.latitude, ",").concat(body.longitude)
                                    : undefined,
                                filters: Object.keys(body).length,
                            });
                            return [4 /*yield*/, this.venueSearchService.searchVenues(body)];
                        case 1:
                            result = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: result,
                                    timestamp: new Date().toISOString(),
                                }];
                    }
                });
            });
        };
        /**
         * 快速搜索（查询参数版）
         */
        VenueSearchController_1.prototype.quickSearch = function (query, city, type, lat, lng, radius, page, limit) {
            return __awaiter(this, void 0, void 0, function () {
                var options, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log('Quick venue search requested', {
                                query: query,
                                city: city,
                                type: type,
                                location: lat && lng ? "".concat(lat, ",").concat(lng) : undefined,
                            });
                            options = {
                                search: query,
                                city: city,
                                type: type,
                                page: page ? parseInt(page) : 1,
                                limit: limit ? parseInt(limit) : 20,
                            };
                            if (lat && lng) {
                                options.latitude = parseFloat(lat);
                                options.longitude = parseFloat(lng);
                                options.radiusKm = radius ? parseFloat(radius) : 10;
                            }
                            return [4 /*yield*/, this.venueSearchService.searchVenues(options)];
                        case 1:
                            result = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: result,
                                    timestamp: new Date().toISOString(),
                                }];
                    }
                });
            });
        };
        /**
         * 获取场馆详情（增强版）
         */
        VenueSearchController_1.prototype.getVenueDetails = function (venueId, includeAvailability, date, includeReviews, includeSimilar) {
            return __awaiter(this, void 0, void 0, function () {
                var options, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log('Enhanced venue details requested', {
                                venueId: venueId,
                                includeAvailability: includeAvailability === 'true',
                                includeSimilar: includeSimilar === 'true',
                                date: date,
                            });
                            options = {};
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
                            return [4 /*yield*/, this.venueSearchService.getVenueDetails(venueId, options)];
                        case 1:
                            result = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: result,
                                    timestamp: new Date().toISOString(),
                                }];
                    }
                });
            });
        };
        /**
         * 获取热门场馆
         */
        VenueSearchController_1.prototype.getPopularVenues = function (city, type, limit) {
            return __awaiter(this, void 0, void 0, function () {
                var options, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log('Popular venues requested', {
                                city: city,
                                type: type,
                                limit: limit,
                            });
                            options = {};
                            if (city)
                                options.city = city;
                            if (type)
                                options.type = type;
                            if (limit)
                                options.limit = parseInt(limit);
                            return [4 /*yield*/, this.venueSearchService.getPopularVenues(options)];
                        case 1:
                            result = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: result,
                                    timestamp: new Date().toISOString(),
                                }];
                    }
                });
            });
        };
        /**
         * 获取场馆统计
         */
        VenueSearchController_1.prototype.getVenueStatistics = function (venueId) {
            return __awaiter(this, void 0, void 0, function () {
                var result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log('Venue statistics requested', { venueId: venueId });
                            return [4 /*yield*/, this.venueSearchService.getVenueStatistics(venueId)];
                        case 1:
                            result = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: result,
                                    timestamp: new Date().toISOString(),
                                }];
                    }
                });
            });
        };
        /**
         * 获取可用过滤器
         */
        VenueSearchController_1.prototype.getAvailableFilters = function (city, type) {
            return __awaiter(this, void 0, void 0, function () {
                var searchOptions, filters, facilities;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log('Available filters requested', { city: city, type: type });
                            searchOptions = {};
                            if (city)
                                searchOptions.city = city;
                            if (type)
                                searchOptions.type = type;
                            return [4 /*yield*/, this.venueSearchService['getAvailableFilters'](searchOptions)];
                        case 1:
                            filters = _a.sent();
                            facilities = [
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
                            return [2 /*return*/, {
                                    success: true,
                                    data: __assign(__assign({}, filters), { facilities: facilities }),
                                    timestamp: new Date().toISOString(),
                                }];
                    }
                });
            });
        };
        /**
         * 地理位置搜索
         */
        VenueSearchController_1.prototype.searchNearby = function (lat, lng, radius, type, limit) {
            return __awaiter(this, void 0, void 0, function () {
                var options, result;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.logger.log('Nearby venues search requested', {
                                location: "".concat(lat, ",").concat(lng),
                                radius: radius,
                                type: type,
                            });
                            if (!lat || !lng) {
                                throw new Error('Latitude and longitude are required');
                            }
                            options = {
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
                            return [4 /*yield*/, this.venueSearchService.searchVenues(options)];
                        case 1:
                            result = _a.sent();
                            return [2 /*return*/, {
                                    success: true,
                                    data: result,
                                    timestamp: new Date().toISOString(),
                                }];
                    }
                });
            });
        };
        /**
         * 搜索建议（自动完成）
         */
        VenueSearchController_1.prototype.getSearchSuggestions = function (query, limit) {
            return __awaiter(this, void 0, void 0, function () {
                var suggestionLimit, suggestions, mockVenues, mockCities, mockTypes, mockFacilities, sortedSuggestions;
                return __generator(this, function (_a) {
                    this.logger.log('Search suggestions requested', { query: query, limit: limit });
                    if (!query || query.length < 2) {
                        return [2 /*return*/, {
                                success: true,
                                data: {
                                    query: query || '',
                                    suggestions: [],
                                },
                                timestamp: new Date().toISOString(),
                            }];
                    }
                    suggestionLimit = limit ? parseInt(limit) : 10;
                    suggestions = [];
                    mockVenues = [
                        { name: '上海体育馆', city: '上海', type: 'STADIUM' },
                        { name: '北京工人体育场', city: '北京', type: 'STADIUM' },
                        { name: '广州天河体育中心', city: '广州', type: 'STADIUM' },
                        { name: '深圳大运中心', city: '深圳', type: 'STADIUM' },
                        { name: '杭州黄龙体育中心', city: '杭州', type: 'STADIUM' },
                    ];
                    mockCities = ['上海', '北京', '广州', '深圳', '杭州', '成都', '南京', '武汉'];
                    mockTypes = ['健身房', '体育场', '球场', '游泳池', '训练馆'];
                    mockFacilities = ['停车场', '淋浴间', '储物柜', 'WiFi', '咖啡厅'];
                    // 场馆名称建议
                    mockVenues.forEach(function (venue) {
                        if (venue.name.toLowerCase().includes(query.toLowerCase())) {
                            suggestions.push({
                                type: 'venue',
                                value: venue.name,
                                display: "".concat(venue.name, " (").concat(venue.city, ")"),
                                count: Math.floor(Math.random() * 100) + 1,
                            });
                        }
                    });
                    // 城市建议
                    mockCities.forEach(function (city) {
                        if (city.toLowerCase().includes(query.toLowerCase())) {
                            suggestions.push({
                                type: 'city',
                                value: city,
                                display: "\u5728 ".concat(city, " \u641C\u7D22\u573A\u9986"),
                                count: Math.floor(Math.random() * 500) + 100,
                            });
                        }
                    });
                    // 类型建议
                    mockTypes.forEach(function (type) {
                        if (type.toLowerCase().includes(query.toLowerCase())) {
                            suggestions.push({
                                type: 'type',
                                value: type,
                                display: "".concat(type, " \u7C7B\u578B\u573A\u9986"),
                                count: Math.floor(Math.random() * 200) + 50,
                            });
                        }
                    });
                    // 设施建议
                    mockFacilities.forEach(function (facility) {
                        if (facility.toLowerCase().includes(query.toLowerCase())) {
                            suggestions.push({
                                type: 'facility',
                                value: facility,
                                display: "\u6709 ".concat(facility, " \u7684\u573A\u9986"),
                                count: Math.floor(Math.random() * 300) + 80,
                            });
                        }
                    });
                    sortedSuggestions = suggestions
                        .sort(function (a, b) { return (b.count || 0) - (a.count || 0); })
                        .slice(0, suggestionLimit);
                    return [2 /*return*/, {
                            success: true,
                            data: {
                                query: query,
                                suggestions: sortedSuggestions,
                            },
                            timestamp: new Date().toISOString(),
                        }];
                });
            });
        };
        /**
         * 搜索统计
         */
        VenueSearchController_1.prototype.getSearchStats = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    this.logger.log('Search statistics requested');
                    // 这里应该查询实际的搜索统计数据
                    // 为了简化，返回模拟数据
                    return [2 /*return*/, {
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
                        }];
                });
            });
        };
        /**
         * 搜索测试端点
         */
        VenueSearchController_1.prototype.testSearch = function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    this.logger.log('Search service test requested');
                    return [2 /*return*/, {
                            success: true,
                            data: {
                                service: 'venue-search',
                                version: '1.0.0',
                                status: 'operational',
                                endpoints: [
                                    { name: '高级搜索', path: '/api/v1/venues/search', method: 'POST', status: 'active' },
                                    { name: '快速搜索', path: '/api/v1/venues/search/quick', method: 'GET', status: 'active' },
                                    { name: '场馆详情', path: '/api/v1/venues/search/:id/details', method: 'GET', status: 'active' },
                                    { name: '热门场馆', path: '/api/v1/venues/search/popular', method: 'GET', status: 'active' },
                                    { name: '附近搜索', path: '/api/v1/venues/search/nearby', method: 'GET', status: 'active' },
                                    { name: '搜索建议', path: '/api/v1/venues/search/suggestions', method: 'GET', status: 'active' },
                                ],
                                performance: {
                                    averageSearchTimeMs: 125,
                                    successRate: 98.5,
                                    cacheHitRate: 65.2,
                                },
                            },
                            timestamp: new Date().toISOString(),
                        }];
                });
            });
        };
        return VenueSearchController_1;
    }());
    __setFunctionName(_classThis, "VenueSearchController");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _searchVenues_decorators = [(0, common_1.Post)(), (0, common_1.HttpCode)(common_1.HttpStatus.OK)];
        _quickSearch_decorators = [(0, common_1.Get)('quick')];
        _getVenueDetails_decorators = [(0, common_1.Get)(':id/details')];
        _getPopularVenues_decorators = [(0, common_1.Get)('popular')];
        _getVenueStatistics_decorators = [(0, common_1.Get)(':id/statistics')];
        _getAvailableFilters_decorators = [(0, common_1.Get)('filters/available')];
        _searchNearby_decorators = [(0, common_1.Get)('nearby')];
        _getSearchSuggestions_decorators = [(0, common_1.Get)('suggestions')];
        _getSearchStats_decorators = [(0, common_1.Get)('stats')];
        _testSearch_decorators = [(0, common_1.Get)('test')];
        __esDecorate(_classThis, null, _searchVenues_decorators, { kind: "method", name: "searchVenues", static: false, private: false, access: { has: function (obj) { return "searchVenues" in obj; }, get: function (obj) { return obj.searchVenues; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _quickSearch_decorators, { kind: "method", name: "quickSearch", static: false, private: false, access: { has: function (obj) { return "quickSearch" in obj; }, get: function (obj) { return obj.quickSearch; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getVenueDetails_decorators, { kind: "method", name: "getVenueDetails", static: false, private: false, access: { has: function (obj) { return "getVenueDetails" in obj; }, get: function (obj) { return obj.getVenueDetails; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getPopularVenues_decorators, { kind: "method", name: "getPopularVenues", static: false, private: false, access: { has: function (obj) { return "getPopularVenues" in obj; }, get: function (obj) { return obj.getPopularVenues; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getVenueStatistics_decorators, { kind: "method", name: "getVenueStatistics", static: false, private: false, access: { has: function (obj) { return "getVenueStatistics" in obj; }, get: function (obj) { return obj.getVenueStatistics; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getAvailableFilters_decorators, { kind: "method", name: "getAvailableFilters", static: false, private: false, access: { has: function (obj) { return "getAvailableFilters" in obj; }, get: function (obj) { return obj.getAvailableFilters; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _searchNearby_decorators, { kind: "method", name: "searchNearby", static: false, private: false, access: { has: function (obj) { return "searchNearby" in obj; }, get: function (obj) { return obj.searchNearby; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getSearchSuggestions_decorators, { kind: "method", name: "getSearchSuggestions", static: false, private: false, access: { has: function (obj) { return "getSearchSuggestions" in obj; }, get: function (obj) { return obj.getSearchSuggestions; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _getSearchStats_decorators, { kind: "method", name: "getSearchStats", static: false, private: false, access: { has: function (obj) { return "getSearchStats" in obj; }, get: function (obj) { return obj.getSearchStats; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(_classThis, null, _testSearch_decorators, { kind: "method", name: "testSearch", static: false, private: false, access: { has: function (obj) { return "testSearch" in obj; }, get: function (obj) { return obj.testSearch; } }, metadata: _metadata }, null, _instanceExtraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        VenueSearchController = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return VenueSearchController = _classThis;
}();
exports.VenueSearchController = VenueSearchController;
