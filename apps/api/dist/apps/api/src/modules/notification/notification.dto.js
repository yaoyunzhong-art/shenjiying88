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
exports.UpdateNotificationTemplateDto = exports.SendNotificationDto = exports.RegisterNotificationTemplateDto = void 0;
const class_validator_1 = require("class-validator");
require("reflect-metadata");
const notification_entity_1 = require("./notification.entity");
class RegisterNotificationTemplateDto {
    code;
    channel;
    scopeType;
    tenantId;
    brandId;
    storeId;
    marketCode;
    locale;
    titleTemplate;
    bodyTemplate;
    variables;
    enabled;
}
exports.RegisterNotificationTemplateDto = RegisterNotificationTemplateDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterNotificationTemplateDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(notification_entity_1.NotificationChannelType),
    __metadata("design:type", String)
], RegisterNotificationTemplateDto.prototype, "channel", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(notification_entity_1.FoundationScopeType),
    __metadata("design:type", String)
], RegisterNotificationTemplateDto.prototype, "scopeType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterNotificationTemplateDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterNotificationTemplateDto.prototype, "brandId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterNotificationTemplateDto.prototype, "storeId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterNotificationTemplateDto.prototype, "marketCode", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterNotificationTemplateDto.prototype, "locale", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], RegisterNotificationTemplateDto.prototype, "titleTemplate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterNotificationTemplateDto.prototype, "bodyTemplate", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], RegisterNotificationTemplateDto.prototype, "variables", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], RegisterNotificationTemplateDto.prototype, "enabled", void 0);
class SendNotificationDto {
    templateCode;
    channel;
    scopeType;
    recipient;
    payload;
    tenantId;
    brandId;
    storeId;
    scheduledAt;
}
exports.SendNotificationDto = SendNotificationDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SendNotificationDto.prototype, "templateCode", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(notification_entity_1.NotificationChannelType),
    __metadata("design:type", String)
], SendNotificationDto.prototype, "channel", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(notification_entity_1.FoundationScopeType),
    __metadata("design:type", String)
], SendNotificationDto.prototype, "scopeType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SendNotificationDto.prototype, "recipient", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], SendNotificationDto.prototype, "payload", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SendNotificationDto.prototype, "tenantId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SendNotificationDto.prototype, "brandId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SendNotificationDto.prototype, "storeId", void 0);
__decorate([
    (0, class_validator_1.IsISO8601)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], SendNotificationDto.prototype, "scheduledAt", void 0);
class UpdateNotificationTemplateDto {
    titleTemplate;
    bodyTemplate;
    variables;
    enabled;
}
exports.UpdateNotificationTemplateDto = UpdateNotificationTemplateDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateNotificationTemplateDto.prototype, "titleTemplate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateNotificationTemplateDto.prototype, "bodyTemplate", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], UpdateNotificationTemplateDto.prototype, "variables", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], UpdateNotificationTemplateDto.prototype, "enabled", void 0);
//# sourceMappingURL=notification.dto.js.map