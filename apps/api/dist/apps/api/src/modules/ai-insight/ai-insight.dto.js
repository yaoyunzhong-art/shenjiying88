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
exports.DashboardQueryDto = exports.GenerateForecastDto = exports.ResolveAnomalyDto = exports.AnomalyQueryDto = exports.KPIQueryDto = exports.InsightReportQueryDto = exports.GenerateReportDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
require("reflect-metadata");
// ─── 洞察报告 ───
/**
 * 生成洞察报告 DTO
 */
class GenerateReportDto {
    type;
    storeId;
    periodStart;
    periodEnd;
}
exports.GenerateReportDto = GenerateReportDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsEnum)(['revenue', 'member', 'attendance', 'game', 'kpi']),
    __metadata("design:type", String)
], GenerateReportDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GenerateReportDto.prototype, "storeId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GenerateReportDto.prototype, "periodStart", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GenerateReportDto.prototype, "periodEnd", void 0);
/**
 * 洞察报告查询 DTO
 */
class InsightReportQueryDto {
    storeId;
    type;
    limit;
}
exports.InsightReportQueryDto = InsightReportQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], InsightReportQueryDto.prototype, "storeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEnum)(['revenue', 'member', 'attendance', 'game', 'kpi']),
    __metadata("design:type", String)
], InsightReportQueryDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], InsightReportQueryDto.prototype, "limit", void 0);
// ─── KPI ───
/**
 * KPI 查询 DTO
 */
class KPIQueryDto {
    storeId;
    category;
}
exports.KPIQueryDto = KPIQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], KPIQueryDto.prototype, "storeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEnum)(['revenue', 'member', 'attendance', 'game', 'operation']),
    __metadata("design:type", String)
], KPIQueryDto.prototype, "category", void 0);
// ─── 异常检测 ───
/**
 * 异常查询 DTO
 */
class AnomalyQueryDto {
    storeId;
    metric;
    status;
    severity;
    limit;
}
exports.AnomalyQueryDto = AnomalyQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AnomalyQueryDto.prototype, "storeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AnomalyQueryDto.prototype, "metric", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEnum)(['open', 'acknowledged', 'resolved']),
    __metadata("design:type", String)
], AnomalyQueryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEnum)(['low', 'medium', 'high', 'critical']),
    __metadata("design:type", String)
], AnomalyQueryDto.prototype, "severity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], AnomalyQueryDto.prototype, "limit", void 0);
/**
 * 解决异常 DTO
 */
class ResolveAnomalyDto {
    anomalyId;
}
exports.ResolveAnomalyDto = ResolveAnomalyDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ResolveAnomalyDto.prototype, "anomalyId", void 0);
// ─── 趋势预测 ───
/**
 * 生成趋势预测 DTO
 */
class GenerateForecastDto {
    metric;
    period;
}
exports.GenerateForecastDto = GenerateForecastDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GenerateForecastDto.prototype, "metric", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], GenerateForecastDto.prototype, "period", void 0);
// ─── 仪表盘 ───
/**
 * 仪表盘查询 DTO
 */
class DashboardQueryDto {
    storeId;
}
exports.DashboardQueryDto = DashboardQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], DashboardQueryDto.prototype, "storeId", void 0);
//# sourceMappingURL=ai-insight.dto.js.map