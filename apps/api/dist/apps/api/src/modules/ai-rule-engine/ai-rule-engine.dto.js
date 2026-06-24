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
exports.SimulatorRunInputDto = exports.ConditionOverrideDto = exports.RiskScoreInputDto = exports.RiskMetricsDto = exports.BatchEvaluateRequestDto = exports.BatchEvaluateItemDto = exports.EvaluateRequestDto = exports.DeviceAnomalyInputDto = exports.MemberLevelInputDto = exports.DeviceMetricsDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
require("reflect-metadata");
/**
 * 设备指标数据
 */
class DeviceMetricsDto {
    cpuUsage;
    memoryUsage;
    diskUsage;
    networkLatencyMs;
    errorRate;
    uptimeHours;
}
exports.DeviceMetricsDto = DeviceMetricsDto;
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], DeviceMetricsDto.prototype, "cpuUsage", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], DeviceMetricsDto.prototype, "memoryUsage", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], DeviceMetricsDto.prototype, "diskUsage", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], DeviceMetricsDto.prototype, "networkLatencyMs", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], DeviceMetricsDto.prototype, "errorRate", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], DeviceMetricsDto.prototype, "uptimeHours", void 0);
/**
 * 成员等级评估输入 DTO
 */
class MemberLevelInputDto {
    memberId;
    totalPoints;
    totalSpend;
    visitCount;
    tenantId;
}
exports.MemberLevelInputDto = MemberLevelInputDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MemberLevelInputDto.prototype, "memberId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], MemberLevelInputDto.prototype, "totalPoints", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], MemberLevelInputDto.prototype, "totalSpend", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], MemberLevelInputDto.prototype, "visitCount", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], MemberLevelInputDto.prototype, "tenantId", void 0);
/**
 * 设备异常检测输入 DTO
 */
class DeviceAnomalyInputDto {
    deviceId;
    storeId;
    metrics;
    tenantId;
}
exports.DeviceAnomalyInputDto = DeviceAnomalyInputDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], DeviceAnomalyInputDto.prototype, "deviceId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], DeviceAnomalyInputDto.prototype, "storeId", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => DeviceMetricsDto),
    __metadata("design:type", DeviceMetricsDto)
], DeviceAnomalyInputDto.prototype, "metrics", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], DeviceAnomalyInputDto.prototype, "tenantId", void 0);
/**
 * AI 规则引擎评估请求 DTO
 */
class EvaluateRequestDto {
    type;
    data;
}
exports.EvaluateRequestDto = EvaluateRequestDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEnum)(['member-level', 'device-anomaly']),
    __metadata("design:type", String)
], EvaluateRequestDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Object)
], EvaluateRequestDto.prototype, "data", void 0);
/**
 * 批量评估单项请求
 */
class BatchEvaluateItemDto {
    type;
    data;
}
exports.BatchEvaluateItemDto = BatchEvaluateItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEnum)(['member-level', 'device-anomaly']),
    __metadata("design:type", String)
], BatchEvaluateItemDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Object)
], BatchEvaluateItemDto.prototype, "data", void 0);
/**
 * 批量评估请求 DTO
 */
class BatchEvaluateRequestDto {
    items;
}
exports.BatchEvaluateRequestDto = BatchEvaluateRequestDto;
__decorate([
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => BatchEvaluateItemDto),
    __metadata("design:type", Array)
], BatchEvaluateRequestDto.prototype, "items", void 0);
/**
 * 风险评分指标 DTO（所有字段可选）
 */
class RiskMetricsDto {
    refundCount;
    abnormalPaymentCount;
    deviceAnomalyCount;
    complaintCount;
    voidRefundAmount;
    activeDays;
    recentTransactionAmount;
}
exports.RiskMetricsDto = RiskMetricsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], RiskMetricsDto.prototype, "refundCount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], RiskMetricsDto.prototype, "abnormalPaymentCount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], RiskMetricsDto.prototype, "deviceAnomalyCount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], RiskMetricsDto.prototype, "complaintCount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], RiskMetricsDto.prototype, "voidRefundAmount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], RiskMetricsDto.prototype, "activeDays", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], RiskMetricsDto.prototype, "recentTransactionAmount", void 0);
/**
 * 风险评分输入 DTO
 */
class RiskScoreInputDto {
    subjectId;
    subjectType;
    metrics;
    tenantId;
}
exports.RiskScoreInputDto = RiskScoreInputDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RiskScoreInputDto.prototype, "subjectId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEnum)(['member', 'device', 'store']),
    __metadata("design:type", String)
], RiskScoreInputDto.prototype, "subjectType", void 0);
__decorate([
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => RiskMetricsDto),
    __metadata("design:type", RiskMetricsDto)
], RiskScoreInputDto.prototype, "metrics", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RiskScoreInputDto.prototype, "tenantId", void 0);
/**
 * 条件覆盖项 DTO
 */
class ConditionOverrideDto {
    conditionId;
    value;
}
exports.ConditionOverrideDto = ConditionOverrideDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ConditionOverrideDto.prototype, "conditionId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Object)
], ConditionOverrideDto.prototype, "value", void 0);
/**
 * 模拟运行输入 DTO
 */
class SimulatorRunInputDto {
    simulatorId;
    conditionOverrides;
    dataType;
    data;
    verbose;
}
exports.SimulatorRunInputDto = SimulatorRunInputDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SimulatorRunInputDto.prototype, "simulatorId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ConditionOverrideDto),
    __metadata("design:type", Array)
], SimulatorRunInputDto.prototype, "conditionOverrides", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEnum)(['member-level', 'device-anomaly', 'risk-score']),
    __metadata("design:type", String)
], SimulatorRunInputDto.prototype, "dataType", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Object)
], SimulatorRunInputDto.prototype, "data", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], SimulatorRunInputDto.prototype, "verbose", void 0);
//# sourceMappingURL=ai-rule-engine.dto.js.map