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
exports.ReservationQueryDto = exports.UpdateReservationDto = exports.CreateReservationDto = void 0;
const class_validator_1 = require("class-validator");
const reservation_entity_1 = require("./reservation.entity");
class CreateReservationDto {
    type;
    resourceId;
    resourceName;
    userId;
    userName;
    startTime;
    endTime;
    duration;
    price;
    deposit;
    remark;
}
exports.CreateReservationDto = CreateReservationDto;
__decorate([
    (0, class_validator_1.IsEnum)(reservation_entity_1.ReservationType),
    __metadata("design:type", String)
], CreateReservationDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReservationDto.prototype, "resourceId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReservationDto.prototype, "resourceName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReservationDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateReservationDto.prototype, "userName", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateReservationDto.prototype, "startTime", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateReservationDto.prototype, "endTime", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateReservationDto.prototype, "duration", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateReservationDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateReservationDto.prototype, "deposit", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateReservationDto.prototype, "remark", void 0);
class UpdateReservationDto {
    status;
    startTime;
    endTime;
    duration;
    price;
    deposit;
    remark;
    resourceName;
}
exports.UpdateReservationDto = UpdateReservationDto;
__decorate([
    (0, class_validator_1.IsEnum)(reservation_entity_1.ReservationStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateReservationDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateReservationDto.prototype, "startTime", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateReservationDto.prototype, "endTime", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateReservationDto.prototype, "duration", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateReservationDto.prototype, "price", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateReservationDto.prototype, "deposit", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateReservationDto.prototype, "remark", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateReservationDto.prototype, "resourceName", void 0);
class ReservationQueryDto {
    type;
    resourceId;
    userId;
    status;
    startDate;
    endDate;
}
exports.ReservationQueryDto = ReservationQueryDto;
__decorate([
    (0, class_validator_1.IsEnum)(reservation_entity_1.ReservationType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ReservationQueryDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ReservationQueryDto.prototype, "resourceId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ReservationQueryDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(reservation_entity_1.ReservationStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ReservationQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ReservationQueryDto.prototype, "startDate", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ReservationQueryDto.prototype, "endDate", void 0);
//# sourceMappingURL=reservation.dto.js.map