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
exports.VenuesService = void 0;
var common_1 = require("@nestjs/common");
var venue_entity_1 = require("./entities/venue.entity");
var venue_response_dto_1 = require("./dto/venue-response.dto");
var VenuesService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var VenuesService = _classThis = /** @class */ (function () {
        function VenuesService_1(venuesRepository) {
            this.venuesRepository = venuesRepository;
        }
        VenuesService_1.prototype.create = function (createVenueDto, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var existingVenue, venue, savedVenue;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.venuesRepository.findOne({
                                where: { contactEmail: createVenueDto.contactEmail },
                            })];
                        case 1:
                            existingVenue = _a.sent();
                            if (existingVenue) {
                                throw new common_1.BadRequestException('该邮箱已被其他场地使用');
                            }
                            venue = this.venuesRepository.create(__assign(__assign({}, createVenueDto), { createdBy: userId, ownerId: createVenueDto.ownerId || userId }));
                            return [4 /*yield*/, this.venuesRepository.save(venue)];
                        case 2:
                            savedVenue = _a.sent();
                            return [2 /*return*/, venue_response_dto_1.VenueResponseDto.fromEntity(savedVenue)];
                    }
                });
            });
        };
        VenuesService_1.prototype.findAll = function () {
            return __awaiter(this, arguments, void 0, function (options) {
                var city, province, type, status, minCapacity, maxCapacity, allowOnlineBooking, search, _a, page, _b, limit, latitude, longitude, radius, query, latDelta, lngDelta, total, skip, venues;
                var _this = this;
                if (options === void 0) { options = {}; }
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            city = options.city, province = options.province, type = options.type, status = options.status, minCapacity = options.minCapacity, maxCapacity = options.maxCapacity, allowOnlineBooking = options.allowOnlineBooking, search = options.search, _a = options.page, page = _a === void 0 ? 1 : _a, _b = options.limit, limit = _b === void 0 ? 10 : _b, latitude = options.latitude, longitude = options.longitude, radius = options.radius;
                            query = this.venuesRepository.createQueryBuilder('venue');
                            // 基本过滤条件
                            if (city)
                                query.andWhere('venue.city = :city', { city: city });
                            if (province)
                                query.andWhere('venue.province = :province', { province: province });
                            if (type)
                                query.andWhere('venue.type = :type', { type: type });
                            if (status)
                                query.andWhere('venue.status = :status', { status: status });
                            if (allowOnlineBooking !== undefined) {
                                query.andWhere('venue.allowOnlineBooking = :allowOnlineBooking', { allowOnlineBooking: allowOnlineBooking });
                            }
                            // 容量范围过滤
                            if (minCapacity !== undefined) {
                                query.andWhere('venue.capacity >= :minCapacity', { minCapacity: minCapacity });
                            }
                            if (maxCapacity !== undefined) {
                                query.andWhere('venue.capacity <= :maxCapacity', { maxCapacity: maxCapacity });
                            }
                            // 搜索条件
                            if (search) {
                                query.andWhere('(venue.name LIKE :search OR venue.description LIKE :search OR venue.address LIKE :search)', { search: "%".concat(search, "%") });
                            }
                            // 地理位置过滤（简单矩形范围，实际生产环境应使用PostGIS等）
                            if (latitude && longitude && radius) {
                                latDelta = radius / 111;
                                lngDelta = radius / (111 * Math.cos(latitude * (Math.PI / 180)));
                                query.andWhere('venue.latitude BETWEEN :minLat AND :maxLat', {
                                    minLat: latitude - latDelta,
                                    maxLat: latitude + latDelta,
                                });
                                query.andWhere('venue.longitude BETWEEN :minLng AND :maxLng', {
                                    minLng: longitude - lngDelta,
                                    maxLng: longitude + lngDelta,
                                });
                            }
                            return [4 /*yield*/, query.getCount()];
                        case 1:
                            total = _c.sent();
                            skip = (page - 1) * limit;
                            query.skip(skip).take(limit);
                            // 排序
                            query.orderBy('venue.createdAt', 'DESC');
                            return [4 /*yield*/, query.getMany()];
                        case 2:
                            venues = _c.sent();
                            // 计算距离（如果提供了坐标）
                            if (latitude && longitude) {
                                venues.forEach(function (venue) {
                                    if (venue.latitude && venue.longitude) {
                                        venue.distance = _this.calculateDistance(latitude, longitude, venue.latitude, venue.longitude);
                                    }
                                });
                            }
                            return [2 /*return*/, {
                                    venues: venue_response_dto_1.VenueResponseDto.fromEntities(venues),
                                    total: total,
                                    page: page,
                                    limit: limit,
                                    totalPages: Math.ceil(total / limit),
                                }];
                    }
                });
            });
        };
        VenuesService_1.prototype.findOne = function (id) {
            return __awaiter(this, void 0, void 0, function () {
                var venue;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.venuesRepository.findOne({
                                where: { id: id },
                            })];
                        case 1:
                            venue = _a.sent();
                            if (!venue) {
                                throw new common_1.NotFoundException("\u573A\u5730 ".concat(id, " \u4E0D\u5B58\u5728"));
                            }
                            return [2 /*return*/, venue_response_dto_1.VenueResponseDto.fromEntity(venue)];
                    }
                });
            });
        };
        VenuesService_1.prototype.update = function (id, updateVenueDto, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var venue, existingVenue, updatedVenue;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.venuesRepository.findOne({
                                where: { id: id },
                            })];
                        case 1:
                            venue = _a.sent();
                            if (!venue) {
                                throw new common_1.NotFoundException("\u573A\u5730 ".concat(id, " \u4E0D\u5B58\u5728"));
                            }
                            // 检查权限：只有创建者或所有者可以修改
                            if (venue.createdBy !== userId && venue.ownerId !== userId) {
                                throw new common_1.ForbiddenException('无权修改此场地');
                            }
                            if (!(updateVenueDto.contactEmail && updateVenueDto.contactEmail !== venue.contactEmail)) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.venuesRepository.findOne({
                                    where: { contactEmail: updateVenueDto.contactEmail },
                                })];
                        case 2:
                            existingVenue = _a.sent();
                            if (existingVenue && existingVenue.id !== id) {
                                throw new common_1.BadRequestException('该邮箱已被其他场地使用');
                            }
                            _a.label = 3;
                        case 3:
                            Object.assign(venue, updateVenueDto);
                            return [4 /*yield*/, this.venuesRepository.save(venue)];
                        case 4:
                            updatedVenue = _a.sent();
                            return [2 /*return*/, venue_response_dto_1.VenueResponseDto.fromEntity(updatedVenue)];
                    }
                });
            });
        };
        VenuesService_1.prototype.remove = function (id, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var venue;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.venuesRepository.findOne({
                                where: { id: id },
                            })];
                        case 1:
                            venue = _a.sent();
                            if (!venue) {
                                throw new common_1.NotFoundException("\u573A\u5730 ".concat(id, " \u4E0D\u5B58\u5728"));
                            }
                            // 检查权限：只有创建者或所有者可以删除
                            if (venue.createdBy !== userId && venue.ownerId !== userId) {
                                throw new common_1.ForbiddenException('无权删除此场地');
                            }
                            // 软删除
                            venue.deletedAt = new Date();
                            venue.status = venue_entity_1.VenueStatus.CLOSED;
                            return [4 /*yield*/, this.venuesRepository.save(venue)];
                        case 2:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        VenuesService_1.prototype.getMyVenues = function (userId_1) {
            return __awaiter(this, arguments, void 0, function (userId, page, limit) {
                var query, total, skip, venues;
                if (page === void 0) { page = 1; }
                if (limit === void 0) { limit = 10; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            query = this.venuesRepository.createQueryBuilder('venue')
                                .where('venue.createdBy = :userId OR venue.ownerId = :userId', { userId: userId })
                                .andWhere('venue.deletedAt IS NULL');
                            return [4 /*yield*/, query.getCount()];
                        case 1:
                            total = _a.sent();
                            skip = (page - 1) * limit;
                            return [4 /*yield*/, query
                                    .skip(skip)
                                    .take(limit)
                                    .orderBy('venue.createdAt', 'DESC')
                                    .getMany()];
                        case 2:
                            venues = _a.sent();
                            return [2 /*return*/, {
                                    venues: venue_response_dto_1.VenueResponseDto.fromEntities(venues),
                                    total: total,
                                    page: page,
                                    limit: limit,
                                    totalPages: Math.ceil(total / limit),
                                }];
                    }
                });
            });
        };
        VenuesService_1.prototype.changeStatus = function (id, status, userId) {
            return __awaiter(this, void 0, void 0, function () {
                var venue, updatedVenue;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.venuesRepository.findOne({
                                where: { id: id },
                            })];
                        case 1:
                            venue = _a.sent();
                            if (!venue) {
                                throw new common_1.NotFoundException("\u573A\u5730 ".concat(id, " \u4E0D\u5B58\u5728"));
                            }
                            // 检查权限：只有创建者或所有者可以修改状态
                            if (venue.createdBy !== userId && venue.ownerId !== userId) {
                                throw new common_1.ForbiddenException('无权修改此场地状态');
                            }
                            venue.status = status;
                            return [4 /*yield*/, this.venuesRepository.save(venue)];
                        case 2:
                            updatedVenue = _a.sent();
                            return [2 /*return*/, venue_response_dto_1.VenueResponseDto.fromEntity(updatedVenue)];
                    }
                });
            });
        };
        VenuesService_1.prototype.searchNearby = function (latitude_1, longitude_1, radius_1) {
            return __awaiter(this, arguments, void 0, function (latitude, longitude, radius, options) {
                var venues;
                if (options === void 0) { options = {}; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.findAll(__assign(__assign({}, options), { latitude: latitude, longitude: longitude, radius: radius }))];
                        case 1:
                            venues = (_a.sent()).venues;
                            // 按距离排序
                            return [2 /*return*/, venues.sort(function (a, b) { return (a.distance || 0) - (b.distance || 0); })];
                    }
                });
            });
        };
        // 计算两个坐标之间的距离（公里）
        VenuesService_1.prototype.calculateDistance = function (lat1, lon1, lat2, lon2) {
            var R = 6371; // 地球半径（公里）
            var dLat = this.toRad(lat2 - lat1);
            var dLon = this.toRad(lon2 - lon1);
            var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(this.toRad(lat1)) *
                    Math.cos(this.toRad(lat2)) *
                    Math.sin(dLon / 2) *
                    Math.sin(dLon / 2);
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        };
        VenuesService_1.prototype.toRad = function (degrees) {
            return degrees * (Math.PI / 180);
        };
        return VenuesService_1;
    }());
    __setFunctionName(_classThis, "VenuesService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        VenuesService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return VenuesService = _classThis;
}();
exports.VenuesService = VenuesService;
