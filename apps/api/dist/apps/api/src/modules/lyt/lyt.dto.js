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
exports.LytFixtureImportPlanDto = exports.LytFixtureImportPreviewDto = exports.LytFixtureCompareDto = exports.LytWebhookFixtureReplayDto = exports.LytWebhookDrillDto = exports.LytWebhookIngestDto = exports.LytBootstrapResponseDto = exports.LytGateVerifyDto = exports.LytDeviceUpdateDto = exports.LytDeviceCreateDto = exports.LytDeviceQueryDto = void 0;
const class_validator_1 = require("class-validator");
/**
 * LYT 设备查询参数 DTO
 */
class LytDeviceQueryDto {
    /** 设备类型筛选 */
    deviceType;
    /** 设备状态筛选 */
    status;
    /** 门店 ID 筛选 */
    storeId;
    /** 搜索关键字（设备名称/ID） */
    keyword;
    /** 分页页码 */
    page;
    /** 每页条数 */
    pageSize;
}
exports.LytDeviceQueryDto = LytDeviceQueryDto;
/**
 * LYT 设备创建 DTO
 */
class LytDeviceCreateDto {
    /** 设备类型 */
    deviceType;
    /** 设备名称 */
    name;
    /** 所属门店 ID */
    storeId;
    /** 固件版本（可选） */
    firmwareVersion;
}
exports.LytDeviceCreateDto = LytDeviceCreateDto;
/**
 * LYT 设备更新 DTO
 */
class LytDeviceUpdateDto {
    /** 设备名称 */
    name;
    /** 设备状态 */
    status;
    /** 固件版本 */
    firmwareVersion;
}
exports.LytDeviceUpdateDto = LytDeviceUpdateDto;
/**
 * LYT 网关通行验证 DTO
 */
class LytGateVerifyDto {
    /** 通行码 */
    passCode;
    /** 门店 ID */
    storeId;
}
exports.LytGateVerifyDto = LytGateVerifyDto;
/**
 * LYT Bootstrap 响应 DTO
 */
class LytBootstrapResponseDto {
    tenantContext;
    capabilities;
    phase;
}
exports.LytBootstrapResponseDto = LytBootstrapResponseDto;
/**
 * LYT webhook 回调 DTO
 */
class LytWebhookIngestDto {
    eventId;
    eventType;
    signature;
    timestamp;
    rawBody;
    fixtureKey;
    rawHeaders;
    rawQuery;
    payload;
}
exports.LytWebhookIngestDto = LytWebhookIngestDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LytWebhookIngestDto.prototype, "eventId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LytWebhookIngestDto.prototype, "eventType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LytWebhookIngestDto.prototype, "signature", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LytWebhookIngestDto.prototype, "timestamp", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LytWebhookIngestDto.prototype, "rawBody", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LytWebhookIngestDto.prototype, "fixtureKey", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], LytWebhookIngestDto.prototype, "rawHeaders", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], LytWebhookIngestDto.prototype, "rawQuery", void 0);
__decorate([
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], LytWebhookIngestDto.prototype, "payload", void 0);
class LytWebhookDrillDto {
    eventId;
    eventType;
    dryRun;
    fixtureKey;
    payload;
}
exports.LytWebhookDrillDto = LytWebhookDrillDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LytWebhookDrillDto.prototype, "eventId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LytWebhookDrillDto.prototype, "eventType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], LytWebhookDrillDto.prototype, "dryRun", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LytWebhookDrillDto.prototype, "fixtureKey", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], LytWebhookDrillDto.prototype, "payload", void 0);
class LytWebhookFixtureReplayDto {
    fixtureKey;
    eventId;
    payload;
    strictValidation;
    headers;
    query;
}
exports.LytWebhookFixtureReplayDto = LytWebhookFixtureReplayDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LytWebhookFixtureReplayDto.prototype, "fixtureKey", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LytWebhookFixtureReplayDto.prototype, "eventId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], LytWebhookFixtureReplayDto.prototype, "payload", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], LytWebhookFixtureReplayDto.prototype, "strictValidation", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], LytWebhookFixtureReplayDto.prototype, "headers", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], LytWebhookFixtureReplayDto.prototype, "query", void 0);
class LytFixtureCompareDto {
    payload;
    headers;
    query;
}
exports.LytFixtureCompareDto = LytFixtureCompareDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], LytFixtureCompareDto.prototype, "payload", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], LytFixtureCompareDto.prototype, "headers", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], LytFixtureCompareDto.prototype, "query", void 0);
class LytFixtureImportPreviewDto {
    payload;
    headers;
    query;
}
exports.LytFixtureImportPreviewDto = LytFixtureImportPreviewDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], LytFixtureImportPreviewDto.prototype, "payload", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], LytFixtureImportPreviewDto.prototype, "headers", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], LytFixtureImportPreviewDto.prototype, "query", void 0);
class LytFixtureImportPlanDto {
    payload;
    headers;
    query;
}
exports.LytFixtureImportPlanDto = LytFixtureImportPlanDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], LytFixtureImportPlanDto.prototype, "payload", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], LytFixtureImportPlanDto.prototype, "headers", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], LytFixtureImportPlanDto.prototype, "query", void 0);
//# sourceMappingURL=lyt.dto.js.map