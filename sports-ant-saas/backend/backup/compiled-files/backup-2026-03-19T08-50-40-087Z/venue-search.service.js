"use strict";
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
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
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
exports.VenueSearchService = void 0;
var common_1 = require("@nestjs/common");
var venue_entity_1 = require("./entities/venue.entity");
var VenueSearchService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var VenueSearchService = _classThis = /** @class */ (function () {
        function VenueSearchService_1(venuesRepository) {
            this.venuesRepository = venuesRepository;
            this.logger = new common_1.Logger(VenueSearchService.name);
            this.EARTH_RADIUS_KM = 6371;
        }
        /**
         * 高级场馆搜索
         */
        VenueSearchService_1.prototype.searchVenues = function (options) {
            return __awaiter(this, void 0, void 0, function () {
                var startTime, queryBuilder, total, venues, results, availableFilters, searchTimeMs, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            startTime = Date.now();
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 6, , 7]);
                            this.logger.log('Starting venue search', {
                                search: options.search,
                                location: options.latitude && options.longitude
                                    ? "".concat(options.latitude, ",").concat(options.longitude)
                                    : undefined,
                                radiusKm: options.radiusKm,
                                filters: this.getAppliedFilters(options),
                            });
                            queryBuilder = this.venuesRepository.createQueryBuilder('venue');
                            // 应用基础条件
                            this.applyBaseConditions(queryBuilder, options);
                            // 应用地理位置条件
                            if (options.latitude && options.longitude) {
                                this.applyLocationConditions(queryBuilder, options);
                            }
                            // 应用设施条件
                            this.applyFacilityConditions(queryBuilder, options);
                            // 应用运营条件
                            this.applyOperationConditions(queryBuilder, options);
                            // 应用价格条件
                            this.applyPriceConditions(queryBuilder, options);
                            return [4 /*yield*/, queryBuilder.getCount()];
                        case 2:
                            total = _a.sent();
                            // 应用分页和排序
                            this.applyPaginationAndSorting(queryBuilder, options);
                            return [4 /*yield*/, queryBuilder.getMany()];
                        case 3:
                            venues = _a.sent();
                            return [4 /*yield*/, this.processSearchResults(venues, options)];
                        case 4:
                            results = _a.sent();
                            return [4 /*yield*/, this.getAvailableFilters(options)];
                        case 5:
                            availableFilters = _a.sent();
                            searchTimeMs = Date.now() - startTime;
                            this.logger.log('Venue search completed', {
                                total: total,
                                found: results.length,
                                searchTimeMs: searchTimeMs,
                                page: options.page || 1,
                                limit: options.limit || 20,
                            });
                            return [2 /*return*/, {
                                    total: total,
                                    page: options.page || 1,
                                    limit: options.limit || 20,
                                    totalPages: Math.ceil(total / (options.limit || 20)),
                                    results: results,
                                    filters: {
                                        applied: options,
                                        available: availableFilters,
                                    },
                                    metadata: {
                                        searchTimeMs: searchTimeMs,
                                        searchRadiusKm: options.radiusKm,
                                        locationUsed: !!(options.latitude && options.longitude),
                                    },
                                }];
                        case 6:
                            error_1 = _a.sent();
                            this.logger.error('Venue search failed', error_1.stack);
                            throw error_1;
                        case 7: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * 根据ID获取场馆详情（带增强信息）
         */
        VenueSearchService_1.prototype.getVenueDetails = function (venueId, options) {
            return __awaiter(this, void 0, void 0, function () {
                var venue, result, _a, _b, _c, error_2;
                return __generator(this, function (_d) {
                    switch (_d.label) {
                        case 0:
                            _d.trys.push([0, 7, , 8]);
                            return [4 /*yield*/, this.venuesRepository.findOne({
                                    where: { id: venueId },
                                    relations: (options === null || options === void 0 ? void 0 : options.includeReviews) ? ['reviews'] : [],
                                })];
                        case 1:
                            venue = _d.sent();
                            if (!venue) {
                                throw new Error("Venue not found: ".concat(venueId));
                            }
                            result = { venue: venue };
                            if (!(options === null || options === void 0 ? void 0 : options.includeAvailability)) return [3 /*break*/, 3];
                            _a = result;
                            return [4 /*yield*/, this.getVenueAvailability(venueId, options.date)];
                        case 2:
                            _a.availability = _d.sent();
                            _d.label = 3;
                        case 3:
                            // 获取统计数据
                            _b = result;
                            return [4 /*yield*/, this.getVenueStatistics(venueId)];
                        case 4:
                            // 获取统计数据
                            _b.statistics = _d.sent();
                            if (!(options === null || options === void 0 ? void 0 : options.includeSimilar)) return [3 /*break*/, 6];
                            _c = result;
                            return [4 /*yield*/, this.findSimilarVenues(venue)];
                        case 5:
                            _c.similarVenues = _d.sent();
                            _d.label = 6;
                        case 6:
                            this.logger.log('Venue details retrieved', {
                                venueId: venueId,
                                includeAvailability: options === null || options === void 0 ? void 0 : options.includeAvailability,
                                includeSimilar: options === null || options === void 0 ? void 0 : options.includeSimilar,
                            });
                            return [2 /*return*/, result];
                        case 7:
                            error_2 = _d.sent();
                            this.logger.error("Failed to get venue details: ".concat(error_2.message), error_2.stack);
                            throw error_2;
                        case 8: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * 获取热门场馆（基于搜索和预订数据）
         */
        VenueSearchService_1.prototype.getPopularVenues = function (options) {
            return __awaiter(this, void 0, void 0, function () {
                var queryBuilder, limit, venues, error_3;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            queryBuilder = this.venuesRepository.createQueryBuilder('venue');
                            // 基础条件：只显示活跃场馆
                            queryBuilder.where('venue.status = :status', { status: venue_entity_1.VenueStatus.ACTIVE });
                            // 按城市过滤
                            if (options === null || options === void 0 ? void 0 : options.city) {
                                queryBuilder.andWhere('venue.city = :city', { city: options.city });
                            }
                            // 按类型过滤
                            if (options === null || options === void 0 ? void 0 : options.type) {
                                queryBuilder.andWhere('venue.type = :type', { type: options.type });
                            }
                            // 排序：按评分和预订量（模拟）
                            queryBuilder
                                .orderBy('venue.rating', 'DESC')
                                .addOrderBy('venue.reviewCount', 'DESC')
                                .addOrderBy('venue.capacity', 'DESC');
                            limit = (options === null || options === void 0 ? void 0 : options.limit) || 10;
                            queryBuilder.limit(limit);
                            return [4 /*yield*/, queryBuilder.getMany()];
                        case 1:
                            venues = _a.sent();
                            return [2 /*return*/, venues.map(function (venue) { return ({
                                    venue: venue,
                                    relevanceScore: _this.calculatePopularityScore(venue),
                                }); })];
                        case 2:
                            error_3 = _a.sent();
                            this.logger.error('Failed to get popular venues', error_3.stack);
                            return [2 /*return*/, []];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * 获取场馆统计
         */
        VenueSearchService_1.prototype.getVenueStatistics = function (venueId) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    try {
                        // 这里应该查询实际的统计数据
                        // 为了简化，返回模拟数据
                        return [2 /*return*/, {
                                totalBookings: 150,
                                totalRevenue: 45000,
                                averageRating: 4.5,
                                reviewCount: 42,
                                occupancyRate: 65,
                                peakHours: [
                                    { hour: 18, bookings: 25 },
                                    { hour: 19, bookings: 30 },
                                    { hour: 20, bookings: 28 },
                                    { hour: 17, bookings: 22 },
                                    { hour: 21, bookings: 20 },
                                ],
                                monthlyTrend: [
                                    { month: '2026-01', bookings: 12, revenue: 3600 },
                                    { month: '2026-02', bookings: 15, revenue: 4500 },
                                    { month: '2026-03', bookings: 18, revenue: 5400 },
                                ],
                            }];
                    }
                    catch (error) {
                        this.logger.error("Failed to get venue statistics: ".concat(error.message), error.stack);
                        throw error;
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * 获取场馆可用性
         */
        VenueSearchService_1.prototype.getVenueAvailability = function (venueId, date) {
            return __awaiter(this, void 0, void 0, function () {
                var targetDate, availableSlots, i;
                return __generator(this, function (_a) {
                    try {
                        targetDate = date || new Date();
                        availableSlots = [];
                        // 生成一些模拟时间段
                        for (i = 9; i < 21; i += 2) { // 9:00-21:00，每2小时一个时间段
                            availableSlots.push({
                                date: targetDate,
                                startTime: "".concat(i.toString().padStart(2, '0'), ":00"),
                                endTime: "".concat((i + 2).toString().padStart(2, '0'), ":00"),
                                price: 100 + (i - 9) * 20, // 价格随时间递增
                            });
                        }
                        return [2 /*return*/, {
                                isAvailable: availableSlots.length > 0,
                                availableSlots: availableSlots,
                                nextAvailableDate: targetDate,
                            }];
                    }
                    catch (error) {
                        this.logger.error("Failed to get venue availability: ".concat(error.message), error.stack);
                        throw error;
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * 查找相似场馆
         */
        VenueSearchService_1.prototype.findSimilarVenues = function (venue) {
            return __awaiter(this, void 0, void 0, function () {
                var queryBuilder, minCapacity, maxCapacity, similarVenues, error_4;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            queryBuilder = this.venuesRepository.createQueryBuilder('v');
                            // 相同城市和类型
                            queryBuilder
                                .where('v.id != :venueId', { venueId: venue.id })
                                .andWhere('v.city = :city', { city: venue.city })
                                .andWhere('v.type = :type', { type: venue.type })
                                .andWhere('v.status = :status', { status: venue_entity_1.VenueStatus.ACTIVE });
                            // 容量相似（±20%）
                            if (venue.capacity) {
                                minCapacity = Math.floor(venue.capacity * 0.8);
                                maxCapacity = Math.ceil(venue.capacity * 1.2);
                                queryBuilder.andWhere('v.capacity BETWEEN :minCapacity AND :maxCapacity', {
                                    minCapacity: minCapacity,
                                    maxCapacity: maxCapacity,
                                });
                            }
                            // 按评分和相似度排序
                            queryBuilder
                                .orderBy('v.rating', 'DESC')
                                .addOrderBy('ABS(v.capacity - :capacity)', 'ASC')
                                .setParameter('capacity', venue.capacity || 0)
                                .limit(5);
                            return [4 /*yield*/, queryBuilder.getMany()];
                        case 1:
                            similarVenues = _a.sent();
                            return [2 /*return*/, similarVenues.map(function (v) { return ({
                                    venue: v,
                                    relevanceScore: _this.calculateSimilarityScore(venue, v),
                                }); })];
                        case 2:
                            error_4 = _a.sent();
                            this.logger.error('Failed to find similar venues', error_4.stack);
                            return [2 /*return*/, []];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        /**
         * 应用基础查询条件
         */
        VenueSearchService_1.prototype.applyBaseConditions = function (queryBuilder, options) {
            // 状态过滤（默认只显示活跃场馆）
            if (!options.includeUnavailable) {
                queryBuilder.andWhere('venue.status = :status', {
                    status: venue_entity_1.VenueStatus.ACTIVE
                });
            }
            // 文本搜索
            if (options.search) {
                queryBuilder.andWhere('(venue.name LIKE :search OR venue.description LIKE :search OR venue.address LIKE :search)', { search: "%".concat(options.search, "%") });
            }
            // 城市过滤
            if (options.city) {
                queryBuilder.andWhere('venue.city = :city', { city: options.city });
            }
            // 省份过滤
            if (options.province) {
                queryBuilder.andWhere('venue.province = :province', { province: options.province });
            }
            // 区域过滤
            if (options.district) {
                queryBuilder.andWhere('venue.district = :district', { district: options.district });
            }
            // 类型过滤
            if (options.type) {
                queryBuilder.andWhere('venue.type = :type', { type: options.type });
            }
            // 容量范围
            if (options.minCapacity !== undefined) {
                queryBuilder.andWhere('venue.capacity >= :minCapacity', {
                    minCapacity: options.minCapacity
                });
            }
            if (options.maxCapacity !== undefined) {
                queryBuilder.andWhere('venue.capacity <= :maxCapacity', {
                    maxCapacity: options.maxCapacity
                });
            }
            // 特色场馆
            if (options.onlyFeatured) {
                queryBuilder.andWhere('venue.isFeatured = :isFeatured', {
                    isFeatured: true
                });
            }
            // 所有者过滤
            if (options.ownerId) {
                queryBuilder.andWhere('venue.ownerId = :ownerId', {
                    ownerId: options.ownerId
                });
            }
        };
        /**
         * 应用地理位置条件
         */
        VenueSearchService_1.prototype.applyLocationConditions = function (queryBuilder, options) {
            if (!options.latitude || !options.longitude)
                return;
            var radiusKm = options.radiusKm || 10; // 默认10公里
            // 计算边界框（优化性能）
            var lat = options.latitude;
            var lng = options.longitude;
            // 1度纬度约111公里
            var latDelta = radiusKm / 111;
            // 1度经度在赤道约111公里，随纬度变化
            var lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
            queryBuilder
                .andWhere('venue.latitude BETWEEN :minLat AND :maxLat', {
                minLat: lat - latDelta,
                maxLat: lat + latDelta,
            })
                .andWhere('venue.longitude BETWEEN :minLng AND :maxLng', {
                minLng: lng - lngDelta,
                maxLng: lng + lngDelta,
            })
                .addSelect("(".concat(this.EARTH_RADIUS_KM, " * ACOS(COS(RADIANS(:lat)) * COS(RADIANS(venue.latitude)) * COS(RADIANS(venue.longitude) - RADIANS(:lng)) + SIN(RADIANS(:lat)) * SIN(RADIANS(venue.latitude))))"), 'distance')
                .setParameter('lat', lat)
                .setParameter('lng', lng)
                .having('distance <= :radius')
                .setParameter('radius', radiusKm);
        };
        /**
         * 应用设施条件
         */
        VenueSearchService_1.prototype.applyFacilityConditions = function (queryBuilder, options) {
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
        };
        /**
         * 应用运营条件
         */
        VenueSearchService_1.prototype.applyOperationConditions = function (queryBuilder, options) {
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
        };
        /**
         * 应用价格条件
         */
        VenueSearchService_1.prototype.applyPriceConditions = function (queryBuilder, options) {
            if (options.minHourlyRate !== undefined) {
                // TODO: 修复价格查询 - venue实体中没有hourlyRate字段
                // queryBuilder.andWhere('venue.hourlyRate >= :minHourlyRate', {
                //   minHourlyRate: options.minHourlyRate,
                // });
            }
            if (options.maxHourlyRate !== undefined) {
                // TODO: 修复价格查询 - venue实体中没有hourlyRate字段
                // queryBuilder.andWhere('venue.hourlyRate <= :maxHourlyRate', {
                //   maxHourlyRate: options.maxHourlyRate,
                // });
            }
        };
        /**
         * 应用分页和排序
         */
        VenueSearchService_1.prototype.applyPaginationAndSorting = function (queryBuilder, options) {
            var page = options.page || 1;
            var limit = options.limit || 20;
            var offset = (page - 1) * limit;
            queryBuilder.skip(offset).take(limit);
            // 应用排序
            var sortBy = options.sortBy || 'name';
            var sortOrder = options.sortOrder || 'asc';
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
                    // TODO: 修复价格排序 - venue实体中没有hourlyRate字段
                    // queryBuilder.orderBy('venue.hourlyRate', sortOrder);
                    break;
                case 'rating':
                    queryBuilder.orderBy('venue.rating', sortOrder);
                    break;
                default:
                    queryBuilder.orderBy('venue.name', sortOrder);
            }
        };
        /**
         * 处理搜索结果
         */
        VenueSearchService_1.prototype.processSearchResults = function (venues, options) {
            return __awaiter(this, void 0, void 0, function () {
                var results, _i, venues_1, venue, result, _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            results = [];
                            _i = 0, venues_1 = venues;
                            _b.label = 1;
                        case 1:
                            if (!(_i < venues_1.length)) return [3 /*break*/, 5];
                            venue = venues_1[_i];
                            result = {
                                venue: venue,
                                relevanceScore: this.calculateRelevanceScore(venue, options),
                            };
                            // 计算距离（如果提供了位置）
                            if (options.latitude && options.longitude && venue.latitude && venue.longitude) {
                                result.distanceKm = this.calculateDistance(options.latitude, options.longitude, venue.latitude, venue.longitude);
                            }
                            if (!(options.date || options.startTime)) return [3 /*break*/, 3];
                            _a = result;
                            return [4 /*yield*/, this.getVenueAvailability(venue.id, options.date)];
                        case 2:
                            _a.availability = _b.sent();
                            _b.label = 3;
                        case 3:
                            // 获取价格信息
                            result.pricing = venue.pricing || {
                                hourlyRate: 0,
                                dailyRate: 0,
                                weeklyRate: 0,
                                monthlyRate: 0,
                                discountRate: 0,
                            };
                            results.push(result);
                            _b.label = 4;
                        case 4:
                            _i++;
                            return [3 /*break*/, 1];
                        case 5: return [2 /*return*/, results];
                    }
                });
            });
        };
        /**
         * 获取可用过滤器
         */
        VenueSearchService_1.prototype.getAvailableFilters = function (options) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    try {
                        // 这里应该查询数据库获取实际可用的过滤器
                        // 为了简化，返回模拟数据
                        return [2 /*return*/, {
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
                            }];
                    }
                    catch (error) {
                        this.logger.error('Failed to get available filters', error.stack);
                        return [2 /*return*/, {
                                cities: [],
                                provinces: [],
                                types: [],
                                capacityRanges: [],
                                priceRanges: [],
                            }];
                    }
                    return [2 /*return*/];
                });
            });
        };
        /**
         * 计算相关性分数
         */
        VenueSearchService_1.prototype.calculateRelevanceScore = function (venue, options) {
            var _a, _b;
            var score = 100;
            // 文本搜索匹配度
            if (options.search) {
                var searchLower = options.search.toLowerCase();
                var nameMatch = venue.name.toLowerCase().includes(searchLower) ? 20 : 0;
                var descMatch = ((_a = venue.description) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(searchLower)) ? 10 : 0;
                var addressMatch = ((_b = venue.address) === null || _b === void 0 ? void 0 : _b.toLowerCase().includes(searchLower)) ? 15 : 0;
                score += nameMatch + descMatch + addressMatch;
            }
            // 距离分数（越近分数越高）
            if (options.latitude && options.longitude && venue.latitude && venue.longitude) {
                var distance = this.calculateDistance(options.latitude, options.longitude, venue.latitude, venue.longitude);
                if (distance <= 1)
                    score += 30; // 1公里内
                else if (distance <= 5)
                    score += 20; // 5公里内
                else if (distance <= 10)
                    score += 10; // 10公里内
                else if (distance <= 20)
                    score += 5; // 20公里内
            }
            // 评分分数 - TODO: venue实体中没有rating字段
            // if (venue.rating) {
            //   score += venue.rating * 5; // 每1星加5分
            // }
            // 特色场馆加分 - TODO: venue实体中没有isFeatured字段
            // if (venue.isFeatured) {
            //   score += 15;
            // }
            // 在线预订加分
            if (venue.allowOnlineBooking) {
                score += 10;
            }
            // 设施完善度加分 - TODO: venue实体中没有这些设施字段
            // let facilityScore = 0;
            // if (venue.hasParking) facilityScore += 5;
            // if (venue.hasShower) facilityScore += 5;
            // if (venue.hasLocker) facilityScore += 3;
            // if (venue.hasWifi) facilityScore += 3;
            // if (venue.hasCafe) facilityScore += 2;
            // score += facilityScore;
            return Math.min(score, 200); // 最大200分
        };
        /**
         * 计算流行度分数
         */
        VenueSearchService_1.prototype.calculatePopularityScore = function (venue) {
            var score = 100;
            // 评分权重 - TODO: venue实体中没有rating字段
            // if (venue.rating) {
            //   score += venue.rating * 10; // 每1星加10分
            // }
            // 评论数量权重 - TODO: venue实体中没有reviewCount字段
            // if (venue.reviewCount) {
            //   score += Math.min(venue.reviewCount * 0.5, 50); // 每1条评论加0.5分，最多50分
            // }
            // 容量权重（越大越受欢迎）
            if (venue.capacity) {
                score += Math.min(venue.capacity * 0.01, 30); // 每100容量加1分，最多30分
            }
            // 特色场馆权重 - TODO: venue实体中没有isFeatured字段
            // if (venue.isFeatured) {
            //   score += 20;
            // }
            return score;
        };
        /**
         * 计算相似度分数
         */
        VenueSearchService_1.prototype.calculateSimilarityScore = function (venue1, venue2) {
            var score = 100;
            // 类型相同
            if (venue1.type === venue2.type) {
                score += 20;
            }
            // 城市相同
            if (venue1.city === venue2.city) {
                score += 15;
            }
            // 容量相似度
            if (venue1.capacity && venue2.capacity) {
                var capacityDiff = Math.abs(venue1.capacity - venue2.capacity);
                var capacityRatio = capacityDiff / Math.max(venue1.capacity, venue2.capacity);
                score += Math.max(0, 30 - capacityRatio * 100); // 差异越大分数越低
            }
            // 价格相似度 - TODO: venue实体中没有hourlyRate字段
            // if (venue1.hourlyRate && venue2.hourlyRate) {
            //   const priceDiff = Math.abs(venue1.hourlyRate - venue2.hourlyRate);
            //   const priceRatio = priceDiff / Math.max(venue1.hourlyRate, venue2.hourlyRate);
            //   score += Math.max(0, 20 - priceRatio * 100);
            // }
            // 设施相似度
            var facilityMatch = 0;
            // TODO: 添加hasParking、hasShower、hasLocker、hasWifi、hasCafe字段到Venue实体
            // if (venue1.hasParking === venue2.hasParking) facilityMatch += 5;
            // if (venue1.hasShower === venue2.hasShower) facilityMatch += 5;
            // if (venue1.hasLocker === venue2.hasLocker) facilityMatch += 3;
            // if (venue1.hasWifi === venue2.hasWifi) facilityMatch += 3;
            // if (venue1.hasCafe === venue2.hasCafe) facilityMatch += 2;
            score += facilityMatch;
            return score;
        };
        /**
         * 计算两点之间的距离（公里）
         */
        VenueSearchService_1.prototype.calculateDistance = function (lat1, lon1, lat2, lon2) {
            var R = this.EARTH_RADIUS_KM;
            var dLat = this.toRad(lat2 - lat1);
            var dLon = this.toRad(lon2 - lon1);
            var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        };
        /**
         * 角度转弧度
         */
        VenueSearchService_1.prototype.toRad = function (degrees) {
            return degrees * Math.PI / 180;
        };
        /**
         * 获取应用的过滤器
         */
        VenueSearchService_1.prototype.getAppliedFilters = function (options) {
            var filters = {};
            Object.entries(options).forEach(function (_a) {
                var key = _a[0], value = _a[1];
                if (value !== undefined && value !== null && value !== '') {
                    filters[key] = value;
                }
            });
            return filters;
        };
        return VenueSearchService_1;
    }());
    __setFunctionName(_classThis, "VenueSearchService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        VenueSearchService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return VenueSearchService = _classThis;
}();
exports.VenueSearchService = VenueSearchService;
