"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BootstrapPhase = void 0;
exports.toBootstrapHealth = toBootstrapHealth;
exports.toBootstrapMetadata = toBootstrapMetadata;
/**
 * Bootstrap 阶段枚举
 */
var BootstrapPhase;
(function (BootstrapPhase) {
    BootstrapPhase["Scaffold"] = "scaffold";
    BootstrapPhase["Provision"] = "provision";
    BootstrapPhase["Handoff"] = "handoff";
    BootstrapPhase["Ready"] = "ready";
})(BootstrapPhase || (exports.BootstrapPhase = BootstrapPhase = {}));
/**
 * 构造 Bootstrap 健康响应
 */
function toBootstrapHealth(overrides) {
    return {
        status: 'ok',
        uptime: process.uptime(),
        phase: BootstrapPhase.Scaffold,
        checkedAt: new Date().toISOString(),
        ...overrides
    };
}
/**
 * 构造 Bootstrap 元数据
 */
function toBootstrapMetadata(tenantContext, overrides) {
    return {
        tenantContext,
        foundationDependencies: [],
        foundationContracts: [],
        phase: BootstrapPhase.Scaffold,
        generatedAt: new Date().toISOString(),
        ...overrides
    };
}
//# sourceMappingURL=bootstrap.entity.js.map