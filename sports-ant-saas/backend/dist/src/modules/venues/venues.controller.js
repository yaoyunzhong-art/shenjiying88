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
exports.VenuesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../modules/auth/guards/jwt-auth.guard");
const venues_service_1 = require("./venues.service");
const create_venue_dto_1 = require("./dto/create-venue.dto");
const update_venue_dto_1 = require("./dto/update-venue.dto");
const venue_response_dto_1 = require("./dto/venue-response.dto");
const venue_entity_1 = require("./entities/venue.entity");
const cache_interceptor_1 = require("../../common/cache.interceptor");
let VenuesController = class VenuesController {
    constructor(venuesService) {
        this.venuesService = venuesService;
    }
    async create(createVenueDto, req) {
        return this.venuesService.create(createVenueDto, req.user.id);
    }
    async getStats() {
        return this.venuesService.getStats();
    }
    async searchNearby(latitude, longitude, radius, city, type) {
        return this.venuesService.searchNearby(parseFloat(latitude), parseFloat(longitude), parseFloat(radius), { city, type });
    }
    async getMyVenues(req, page = 1, limit = 10) {
        return this.venuesService.getMyVenues(req.user.id, parseInt(page, 10), parseInt(limit, 10));
    }
    async findAll(query) {
        return this.venuesService.findAll(query);
    }
    async findOne(id) {
        return this.venuesService.findOne(id);
    }
    async update(id, updateVenueDto, req) {
        return this.venuesService.update(id, updateVenueDto, req.user.id);
    }
    async remove(id, req) {
        return this.venuesService.remove(id, req.user.id);
    }
    async changeStatus(id, status, req) {
        return this.venuesService.changeStatus(id, status, req.user.id);
    }
};
exports.VenuesController = VenuesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: '创建场馆' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: '场馆创建成功', type: venue_response_dto_1.VenueResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: '请求参数错误' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: '未授权' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_venue_dto_1.CreateVenueDto, Object]),
    __metadata("design:returntype", Promise)
], VenuesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: '场馆统计' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '返回场馆统计数据' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], VenuesController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)('nearby'),
    (0, swagger_1.ApiOperation)({ summary: '搜索附近场地' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '返回附近场地列表', type: [venue_response_dto_1.VenueResponseDto] }),
    (0, swagger_1.ApiQuery)({ name: 'latitude', required: true, description: '纬度' }),
    (0, swagger_1.ApiQuery)({ name: 'longitude', required: true, description: '经度' }),
    (0, swagger_1.ApiQuery)({ name: 'radius', required: true, description: '搜索半径（公里）' }),
    (0, swagger_1.ApiQuery)({ name: 'city', required: false, description: '城市' }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, enum: venue_entity_1.VenueType, description: '场地类型' }),
    __param(0, (0, common_1.Query)('latitude')),
    __param(1, (0, common_1.Query)('longitude')),
    __param(2, (0, common_1.Query)('radius')),
    __param(3, (0, common_1.Query)('city')),
    __param(4, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], VenuesController.prototype, "searchNearby", null);
__decorate([
    (0, common_1.Get)('my'),
    (0, swagger_1.ApiOperation)({ summary: '获取我的场地' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '返回我的场地列表', type: [venue_response_dto_1.VenueResponseDto] }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: '页码', example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: '每页数量', example: 10 }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], VenuesController.prototype, "getMyVenues", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseInterceptors)(cache_interceptor_1.CacheInterceptor),
    (0, swagger_1.ApiOperation)({ summary: '场馆列表' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '返回场馆列表', type: [venue_response_dto_1.VenueResponseDto] }),
    (0, swagger_1.ApiQuery)({ name: 'city', required: false, description: '城市' }),
    (0, swagger_1.ApiQuery)({ name: 'province', required: false, description: '省份' }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, enum: venue_entity_1.VenueType, description: '场地类型' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: venue_entity_1.VenueStatus, description: '场地状态' }),
    (0, swagger_1.ApiQuery)({ name: 'minCapacity', required: false, description: '最小容量' }),
    (0, swagger_1.ApiQuery)({ name: 'maxCapacity', required: false, description: '最大容量' }),
    (0, swagger_1.ApiQuery)({ name: 'allowOnlineBooking', required: false, description: '是否支持在线预订' }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, description: '搜索关键词' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: '页码', example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: '每页数量', example: 10 }),
    (0, swagger_1.ApiQuery)({ name: 'latitude', required: false, description: '纬度' }),
    (0, swagger_1.ApiQuery)({ name: 'longitude', required: false, description: '经度' }),
    (0, swagger_1.ApiQuery)({ name: 'radius', required: false, description: '搜索半径（公里）' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VenuesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '场馆详情' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '返回场馆详情', type: venue_response_dto_1.VenueResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '场馆不存在' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VenuesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '更新场馆' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '场馆更新成功', type: venue_response_dto_1.VenueResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '无权修改此场馆' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '场馆不存在' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_venue_dto_1.UpdateVenueDto, Object]),
    __metadata("design:returntype", Promise)
], VenuesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: '删除场馆' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: '场馆删除成功' }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '无权删除此场馆' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '场馆不存在' }),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], VenuesController.prototype, "remove", null);
__decorate([
    (0, common_1.Put)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: '设置营业状态' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '状态修改成功', type: venue_response_dto_1.VenueResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 403, description: '无权修改此场馆状态' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: '场馆不存在' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], VenuesController.prototype, "changeStatus", null);
exports.VenuesController = VenuesController = __decorate([
    (0, swagger_1.ApiTags)('venues'),
    (0, common_1.Controller)('venues'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [venues_service_1.VenuesService])
], VenuesController);
//# sourceMappingURL=venues.controller.js.map