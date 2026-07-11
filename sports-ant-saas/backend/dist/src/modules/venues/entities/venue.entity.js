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
exports.Venue = exports.VenueType = exports.VenueStatus = void 0;
const typeorm_1 = require("typeorm");
const uuid_1 = require("uuid");
const swagger_1 = require("@nestjs/swagger");
const user_entity_1 = require("../../users/entities/user.entity");
const device_entity_1 = require("../../devices/entities/device.entity");
const member_entity_1 = require("../../members/entities/member.entity");
const ticket_entity_1 = require("../../tickets/entities/ticket.entity");
const session_entity_1 = require("../../sessions/entities/session.entity");
const coach_entity_1 = require("../../sessions/entities/coach.entity");
var VenueStatus;
(function (VenueStatus) {
    VenueStatus["ACTIVE"] = "active";
    VenueStatus["INACTIVE"] = "inactive";
    VenueStatus["MAINTENANCE"] = "maintenance";
    VenueStatus["CLOSED"] = "closed";
})(VenueStatus || (exports.VenueStatus = VenueStatus = {}));
var VenueType;
(function (VenueType) {
    VenueType["GYM"] = "gym";
    VenueType["STADIUM"] = "stadium";
    VenueType["COURT"] = "court";
    VenueType["POOL"] = "pool";
    VenueType["OTHER"] = "other";
    VenueType["INDOOR"] = "indoor";
    VenueType["OUTDOOR"] = "outdoor";
    VenueType["MIXED"] = "mixed";
})(VenueType || (exports.VenueType = VenueType = {}));
let Venue = class Venue {
    generateId() {
        if (!this.id) {
            this.id = (0, uuid_1.v4)();
        }
    }
    constructor() {
        this.id = '';
        this.name = '';
        this.description = '';
        this.address = '';
        this.city = '';
        this.province = '';
        this.postalCode = '';
        this.id = '';
        this.name = '';
        this.description = '';
        this.address = '';
        this.city = '';
        this.country = '';
        this.postalCode = '';
        this.latitude = 0;
        this.longitude = 0;
        this.type = VenueType.INDOOR;
        this.capacity = 0;
        this.area = 0;
        this.facilities = [];
        this.openingHours = {};
        this.contactPhone = '';
        this.contactEmail = '';
        this.status = VenueStatus.ACTIVE;
        this.ownerId = '';
        this.allowOnlineBooking = true;
        this.bookingAdvanceHours = 24;
        this.cancellationPolicy = {};
        this.pricing = {};
        this.images = [];
        this.hourlyRate = 0;
        this.rating = 0;
        this.reviewCount = 0;
        this.isFeatured = false;
        this.hasParking = false;
        this.hasShower = false;
        this.hasLocker = false;
        this.hasWifi = false;
        this.hasCafe = false;
        this.createdAt = new Date();
        this.createdBy = '';
        this.owner = null;
        this.updatedAt = new Date();
        this.deletedAt = new Date();
        this.distance = 0;
        this.averageRating = 0;
    }
};
exports.Venue = Venue;
__decorate([
    (0, swagger_1.ApiProperty)({ description: '场地ID' }),
    (0, typeorm_1.PrimaryColumn)('uuid'),
    __metadata("design:type", String)
], Venue.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.BeforeInsert)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Venue.prototype, "generateId", null);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '场地名称' }),
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], Venue.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '场地描述', nullable: true }),
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Venue.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '场地地址' }),
    (0, typeorm_1.Column)({ length: 500 }),
    __metadata("design:type", String)
], Venue.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '城市' }),
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Venue.prototype, "city", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '省份/州' }),
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Venue.prototype, "province", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '邮政编码' }),
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], Venue.prototype, "postalCode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '国家' }),
    (0, typeorm_1.Column)({ length: 100, default: '中国' }),
    __metadata("design:type", String)
], Venue.prototype, "country", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '纬度', nullable: true }),
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 8, nullable: true }),
    __metadata("design:type", Number)
], Venue.prototype, "latitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '经度', nullable: true }),
    (0, typeorm_1.Column)({ type: 'decimal', precision: 11, scale: 8, nullable: true }),
    __metadata("design:type", Number)
], Venue.prototype, "longitude", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '场地类型', enum: VenueType }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: VenueType.INDOOR }),
    __metadata("design:type", String)
], Venue.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '最大容量' }),
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], Venue.prototype, "capacity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '场地面积（平方米）', nullable: true }),
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Venue.prototype, "area", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '设施列表', nullable: true }),
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], Venue.prototype, "facilities", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '营业时间（JSON格式）', nullable: true }),
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Venue.prototype, "openingHours", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '联系方式' }),
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], Venue.prototype, "contactPhone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '联系邮箱' }),
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], Venue.prototype, "contactEmail", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '场地状态', enum: VenueStatus }),
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, default: VenueStatus.ACTIVE }),
    __metadata("design:type", String)
], Venue.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否支持在线预订' }),
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Venue.prototype, "allowOnlineBooking", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '预订提前时间（小时）' }),
    (0, typeorm_1.Column)({ type: 'int', default: 24 }),
    __metadata("design:type", Number)
], Venue.prototype, "bookingAdvanceHours", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '取消政策（JSON格式）', nullable: true }),
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Venue.prototype, "cancellationPolicy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '价格信息（JSON格式）', nullable: true }),
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Venue.prototype, "pricing", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '每小时价格', nullable: true }),
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Venue.prototype, "hourlyRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '平均评分', nullable: true }),
    (0, typeorm_1.Column)({ type: 'decimal', precision: 3, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], Venue.prototype, "rating", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '评论数量', nullable: true }),
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Venue.prototype, "reviewCount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否特色场馆' }),
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Venue.prototype, "isFeatured", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否有停车场' }),
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Venue.prototype, "hasParking", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否有淋浴' }),
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Venue.prototype, "hasShower", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否有储物柜' }),
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Venue.prototype, "hasLocker", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否有WiFi' }),
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Venue.prototype, "hasWifi", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '是否有咖啡厅' }),
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Venue.prototype, "hasCafe", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '图片URL列表', nullable: true }),
    (0, typeorm_1.Column)({ type: 'simple-array', nullable: true }),
    __metadata("design:type", Array)
], Venue.prototype, "images", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '创建者ID' }),
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], Venue.prototype, "createdBy", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '所有者ID', nullable: true }),
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], Venue.prototype, "ownerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '所有者（关系）', type: () => user_entity_1.User }),
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.venues, { nullable: true }),
    __metadata("design:type", user_entity_1.User)
], Venue.prototype, "owner", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '设备列表', type: () => [device_entity_1.Device] }),
    (0, typeorm_1.OneToMany)(() => device_entity_1.Device, (device) => device.venue),
    __metadata("design:type", Array)
], Venue.prototype, "devices", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '会员列表', type: () => [member_entity_1.Member] }),
    (0, typeorm_1.OneToMany)(() => member_entity_1.Member, (member) => member.venue),
    __metadata("design:type", Array)
], Venue.prototype, "members", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '票务列表', type: () => [ticket_entity_1.Ticket] }),
    (0, typeorm_1.OneToMany)(() => ticket_entity_1.Ticket, (ticket) => ticket.venue),
    __metadata("design:type", Array)
], Venue.prototype, "tickets", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '课程列表', type: () => [session_entity_1.Session] }),
    (0, typeorm_1.OneToMany)(() => session_entity_1.Session, (session) => session.venue),
    __metadata("design:type", Array)
], Venue.prototype, "sessions", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '教练列表', type: () => [coach_entity_1.Coach] }),
    (0, typeorm_1.OneToMany)(() => coach_entity_1.Coach, (coach) => coach.venue),
    __metadata("design:type", Array)
], Venue.prototype, "coaches", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '创建时间' }),
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Venue.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '更新时间' }),
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Venue.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '删除时间', nullable: true }),
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Venue.prototype, "deletedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '距离（米）', nullable: true }),
    __metadata("design:type", Number)
], Venue.prototype, "distance", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: '平均评分', nullable: true }),
    __metadata("design:type", Number)
], Venue.prototype, "averageRating", void 0);
exports.Venue = Venue = __decorate([
    (0, typeorm_1.Entity)('venues'),
    __metadata("design:paramtypes", [])
], Venue);
//# sourceMappingURL=venue.entity.js.map