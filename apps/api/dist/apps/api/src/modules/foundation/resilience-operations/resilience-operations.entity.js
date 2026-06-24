"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecoveryPlanStatus = exports.ObservabilitySignalStatus = void 0;
/**
 * 可观测信号状态
 */
var ObservabilitySignalStatus;
(function (ObservabilitySignalStatus) {
    ObservabilitySignalStatus["Healthy"] = "healthy";
    ObservabilitySignalStatus["Warning"] = "warning";
    ObservabilitySignalStatus["Critical"] = "critical";
})(ObservabilitySignalStatus || (exports.ObservabilitySignalStatus = ObservabilitySignalStatus = {}));
/**
 * 恢复计划状态
 */
var RecoveryPlanStatus;
(function (RecoveryPlanStatus) {
    RecoveryPlanStatus["Ready"] = "ready";
    RecoveryPlanStatus["Attention"] = "attention";
})(RecoveryPlanStatus || (exports.RecoveryPlanStatus = RecoveryPlanStatus = {}));
//# sourceMappingURL=resilience-operations.entity.js.map