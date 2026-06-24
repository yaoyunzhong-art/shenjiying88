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
exports.CallNextDto = exports.JoinQueueDto = exports.QueueQueryDto = exports.UpdateQueueDto = exports.CreateQueueDto = void 0;
const class_validator_1 = require("class-validator");
require("reflect-metadata");
const queue_entity_1 = require("./queue.entity");
class CreateQueueDto {
    type;
    userId;
    userName;
    phone;
    partySize;
    resourceId;
    resourceName;
    remark;
}
exports.CreateQueueDto = CreateQueueDto;
__decorate([
    (0, class_validator_1.IsEnum)(queue_entity_1.QueueType),
    __metadata("design:type", String)
], CreateQueueDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateQueueDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], CreateQueueDto.prototype, "userName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateQueueDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(99),
    __metadata("design:type", Number)
], CreateQueueDto.prototype, "partySize", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateQueueDto.prototype, "resourceId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateQueueDto.prototype, "resourceName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateQueueDto.prototype, "remark", void 0);
class UpdateQueueDto {
    partySize;
    phone;
    resourceName;
    remark;
}
exports.UpdateQueueDto = UpdateQueueDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(99),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], UpdateQueueDto.prototype, "partySize", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateQueueDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateQueueDto.prototype, "resourceName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateQueueDto.prototype, "remark", void 0);
class QueueQueryDto {
    type;
    status;
    resourceId;
    memberId;
    userId;
    queueNumber;
    pageSize;
    page;
    sortBy;
    sortOrder;
}
exports.QueueQueryDto = QueueQueryDto;
__decorate([
    (0, class_validator_1.IsEnum)(queue_entity_1.QueueType),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueueQueryDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(queue_entity_1.QueueStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueueQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueueQueryDto.prototype, "resourceId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueueQueryDto.prototype, "memberId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueueQueryDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueueQueryDto.prototype, "queueNumber", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], QueueQueryDto.prototype, "pageSize", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], QueueQueryDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueueQueryDto.prototype, "sortBy", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['asc', 'desc']),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], QueueQueryDto.prototype, "sortOrder", void 0);
class JoinQueueDto {
    queueType;
    memberId;
    memberName;
    resourceId;
    resourceName;
    priority;
    remark;
}
exports.JoinQueueDto = JoinQueueDto;
__decorate([
    (0, class_validator_1.IsEnum)(queue_entity_1.QueueType),
    __metadata("design:type", String)
], JoinQueueDto.prototype, "queueType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    __metadata("design:type", String)
], JoinQueueDto.prototype, "memberId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], JoinQueueDto.prototype, "memberName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], JoinQueueDto.prototype, "resourceId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], JoinQueueDto.prototype, "resourceName", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], JoinQueueDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], JoinQueueDto.prototype, "remark", void 0);
class CallNextDto {
    resourceId;
    type;
}
exports.CallNextDto = CallNextDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CallNextDto.prototype, "resourceId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CallNextDto.prototype, "type", void 0);
//# sourceMappingURL=queue.dto.js.map