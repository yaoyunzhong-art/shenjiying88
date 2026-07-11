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
exports.CreateVenueDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const venue_entity_1 = require("../entities/venue.entity");
class CreateVenueDto {
    constructor() {
        this.name = '';
        this.address = '';
        this.city = '';
        this.province = '';
        this.postalCode = '';
        this.country = '中国';
        this.type = venue_entity_1.VenueType.GYM;
        this.capacity = 10;
        this.contactPhone = '';
        this.contactEmail = '';
        this.status = venue_entity_1.VenueStatus.ACTIVE;
        this.allowOnlineBooking = true;
        this.bookingAdvanceHours = 24;
    }
}
exports.CreateVenueDto = CreateVenueDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '场地名称' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateVenueDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '场地描述', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateVenueDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '场地地址' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateVenueDto.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '城市' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateVenueDto.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '省份/州' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateVenueDto.prototype, "province", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '邮政编码' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateVenueDto.prototype, "postalCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '国家', default: '中国' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateVenueDto.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '纬度', required: false }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-90),
    (0, class_validator_1.Max)(90),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateVenueDto.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '经度', required: false }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-180),
    (0, class_validator_1.Max)(180),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateVenueDto.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '场地类型', enum: venue_entity_1.VenueType }),
    (0, class_validator_1.IsEnum)(venue_entity_1.VenueType),
    __metadata("design:type", String)
], CreateVenueDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '最大容量' }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateVenueDto.prototype, "capacity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '场地面积（平方米）', required: false }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateVenueDto.prototype, "area", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '设施列表', required: false, type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateVenueDto.prototype, "facilities", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '营业时间（JSON格式）', required: false }),
    (0, class_validator_1.IsJSON)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateVenueDto.prototype, "openingHours", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '联系方式' }),
    (0, class_validator_1.IsPhoneNumber)('CN'),
    __metadata("design:type", String)
], CreateVenueDto.prototype, "contactPhone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '联系邮箱' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], CreateVenueDto.prototype, "contactEmail", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '场地状态', enum: venue_entity_1.VenueStatus, default: venue_entity_1.VenueStatus.ACTIVE }),
    (0, class_validator_1.IsEnum)(venue_entity_1.VenueStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateVenueDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否支持在线预订', default: true }),
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateVenueDto.prototype, "allowOnlineBooking", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '预订提前时间（小时）', default: 24 }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateVenueDto.prototype, "bookingAdvanceHours", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '取消政策（JSON格式）', required: false }),
    (0, class_validator_1.IsJSON)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateVenueDto.prototype, "cancellationPolicy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '价格信息（JSON格式）', required: false }),
    (0, class_validator_1.IsJSON)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateVenueDto.prototype, "pricing", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '图片URL列表', required: false, type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateVenueDto.prototype, "images", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '所有者ID', required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateVenueDto.prototype, "ownerId", void 0);
//# sourceMappingURL=create-venue.dto.js.map