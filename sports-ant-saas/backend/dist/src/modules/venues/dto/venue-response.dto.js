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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VenueResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const venue_entity_1 = require("../entities/venue.entity");
class VenueResponseDto {
    constructor() {
        this.id = '';
        this.name = '';
        this.description = null;
        this.address = '';
        this.city = '';
        this.province = '';
        this.postalCode = '';
        this.country = '';
        this.latitude = null;
        this.longitude = null;
        this.type = venue_entity_1.VenueType.OTHER;
        this.capacity = 0;
        this.area = null;
        this.facilities = null;
        this.openingHours = null;
        this.contactPhone = '';
        this.contactEmail = '';
        this.status = venue_entity_1.VenueStatus.ACTIVE;
        this.allowOnlineBooking = false;
        this.bookingAdvanceHours = 0;
        this.cancellationPolicy = null;
        this.pricing = null;
        this.images = null;
        this.createdBy = '';
        this.ownerId = null;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }
    static fromEntity(venue) {
        const dto = new VenueResponseDto();
        dto.id = venue.id;
        dto.name = venue.name;
        dto.description = venue.description;
        dto.address = venue.address;
        dto.city = venue.city;
        dto.province = venue.province;
        dto.postalCode = venue.postalCode;
        dto.country = venue.country;
        dto.latitude = venue.latitude;
        dto.longitude = venue.longitude;
        dto.type = venue.type;
        dto.capacity = venue.capacity;
        dto.area = venue.area;
        dto.facilities = venue.facilities;
        dto.openingHours = venue.openingHours;
        dto.contactPhone = venue.contactPhone;
        dto.contactEmail = venue.contactEmail;
        dto.status = venue.status;
        dto.allowOnlineBooking = venue.allowOnlineBooking;
        dto.bookingAdvanceHours = venue.bookingAdvanceHours;
        dto.cancellationPolicy = venue.cancellationPolicy;
        dto.pricing = venue.pricing;
        dto.images = venue.images;
        dto.createdBy = venue.createdBy;
        dto.ownerId = venue.ownerId;
        dto.createdAt = venue.createdAt;
        dto.updatedAt = venue.updatedAt;
        if (venue.distance !== undefined)
            dto.distance = venue.distance;
        if (venue.averageRating !== undefined)
            dto.averageRating = venue.averageRating;
        if (venue.reviewCount !== undefined)
            dto.reviewCount = venue.reviewCount;
        return dto;
    }
    static fromEntities(venues) {
        return venues.map((venue) => this.fromEntity(venue));
    }
}
exports.VenueResponseDto = VenueResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '场地ID' }),
    __metadata("design:type", String)
], VenueResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '场地名称' }),
    __metadata("design:type", String)
], VenueResponseDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '场地描述', nullable: true }),
    __metadata("design:type", String)
], VenueResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '场地地址' }),
    __metadata("design:type", String)
], VenueResponseDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '城市' }),
    __metadata("design:type", String)
], VenueResponseDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '省份/州' }),
    __metadata("design:type", String)
], VenueResponseDto.prototype, "province", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '邮政编码' }),
    __metadata("design:type", String)
], VenueResponseDto.prototype, "postalCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '国家' }),
    __metadata("design:type", String)
], VenueResponseDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '纬度', nullable: true }),
    __metadata("design:type", Number)
], VenueResponseDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '经度', nullable: true }),
    __metadata("design:type", Number)
], VenueResponseDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '场地类型', enum: venue_entity_1.VenueType }),
    __metadata("design:type", String)
], VenueResponseDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '最大容量' }),
    __metadata("design:type", Number)
], VenueResponseDto.prototype, "capacity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '场地面积（平方米）', nullable: true }),
    __metadata("design:type", Number)
], VenueResponseDto.prototype, "area", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '设施列表', nullable: true, type: [String] }),
    __metadata("design:type", Array)
], VenueResponseDto.prototype, "facilities", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '营业时间（JSON格式）', nullable: true }),
    __metadata("design:type", Object)
], VenueResponseDto.prototype, "openingHours", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '联系方式' }),
    __metadata("design:type", String)
], VenueResponseDto.prototype, "contactPhone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '联系邮箱' }),
    __metadata("design:type", String)
], VenueResponseDto.prototype, "contactEmail", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '场地状态', enum: venue_entity_1.VenueStatus }),
    __metadata("design:type", String)
], VenueResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否支持在线预订' }),
    __metadata("design:type", Boolean)
], VenueResponseDto.prototype, "allowOnlineBooking", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '预订提前时间（小时）' }),
    __metadata("design:type", Number)
], VenueResponseDto.prototype, "bookingAdvanceHours", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '取消政策（JSON格式）', nullable: true }),
    __metadata("design:type", Object)
], VenueResponseDto.prototype, "cancellationPolicy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '价格信息（JSON格式）', nullable: true }),
    __metadata("design:type", Object)
], VenueResponseDto.prototype, "pricing", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '图片URL列表', nullable: true, type: [String] }),
    __metadata("design:type", Array)
], VenueResponseDto.prototype, "images", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '创建者ID' }),
    __metadata("design:type", String)
], VenueResponseDto.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '所有者ID', nullable: true }),
    __metadata("design:type", String)
], VenueResponseDto.prototype, "ownerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '创建时间' }),
    __metadata("design:type", Date)
], VenueResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '更新时间' }),
    __metadata("design:type", Date)
], VenueResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '距离（米）', nullable: true }),
    __metadata("design:type", Number)
], VenueResponseDto.prototype, "distance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '平均评分', nullable: true }),
    __metadata("design:type", Number)
], VenueResponseDto.prototype, "averageRating", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '评论数量', nullable: true }),
    __metadata("design:type", Number)
], VenueResponseDto.prototype, "reviewCount", void 0);
//# sourceMappingURL=venue-response.dto.js.map