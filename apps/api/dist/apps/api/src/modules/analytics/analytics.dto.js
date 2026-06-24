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
exports.GetRecommendationsDto = exports.GetDiagnosticsDto = exports.GetOperationSnapshotDto = void 0;
const class_validator_1 = require("class-validator");
require("reflect-metadata");
const analytics_entity_1 = require("./analytics.entity");
class GetOperationSnapshotDto {
    scope;
    brandId;
    storeId;
}
exports.GetOperationSnapshotDto = GetOperationSnapshotDto;
__decorate([
    (0, class_validator_1.IsEnum)(analytics_entity_1.AnalyticsScope),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GetOperationSnapshotDto.prototype, "scope", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GetOperationSnapshotDto.prototype, "brandId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GetOperationSnapshotDto.prototype, "storeId", void 0);
class GetDiagnosticsDto {
    scope;
    brandId;
    storeId;
}
exports.GetDiagnosticsDto = GetDiagnosticsDto;
__decorate([
    (0, class_validator_1.IsEnum)(analytics_entity_1.AnalyticsScope),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GetDiagnosticsDto.prototype, "scope", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GetDiagnosticsDto.prototype, "brandId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GetDiagnosticsDto.prototype, "storeId", void 0);
class GetRecommendationsDto {
    scope;
    brandId;
    storeId;
}
exports.GetRecommendationsDto = GetRecommendationsDto;
__decorate([
    (0, class_validator_1.IsEnum)(analytics_entity_1.AnalyticsScope),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GetRecommendationsDto.prototype, "scope", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GetRecommendationsDto.prototype, "brandId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], GetRecommendationsDto.prototype, "storeId", void 0);
//# sourceMappingURL=analytics.dto.js.map