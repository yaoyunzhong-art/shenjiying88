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
exports.EventListQueryDto = exports.WebhookIngestDto = exports.PublishEventDto = void 0;
const class_validator_1 = require("class-validator");
class PublishEventDto {
    eventName;
    source;
    aggregateId;
    idempotencyKey;
    payload;
}
exports.PublishEventDto = PublishEventDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PublishEventDto.prototype, "eventName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PublishEventDto.prototype, "source", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PublishEventDto.prototype, "aggregateId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PublishEventDto.prototype, "idempotencyKey", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], PublishEventDto.prototype, "payload", void 0);
class WebhookIngestDto {
    eventId;
    eventType;
    signature;
    timestamp;
    rawBody;
    payload;
}
exports.WebhookIngestDto = WebhookIngestDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WebhookIngestDto.prototype, "eventId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WebhookIngestDto.prototype, "eventType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WebhookIngestDto.prototype, "signature", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WebhookIngestDto.prototype, "timestamp", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WebhookIngestDto.prototype, "rawBody", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], WebhookIngestDto.prototype, "payload", void 0);
class EventListQueryDto {
    source;
}
exports.EventListQueryDto = EventListQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EventListQueryDto.prototype, "source", void 0);
//# sourceMappingURL=integration-orchestration.dto.js.map