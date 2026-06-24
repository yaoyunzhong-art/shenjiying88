"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * 🐜 自动: [ai-insight] [D] module 测试
 * AiInsightModule 的模块注册和导出验证
 */
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const ai_insight_module_1 = require("./ai-insight.module");
const ai_insight_controller_1 = require("./ai-insight.controller");
const ai_insight_service_1 = require("./ai-insight.service");
(0, node_test_1.describe)('AiInsightModule', () => {
    (0, node_test_1.default)('should be defined', () => {
        strict_1.default.ok(ai_insight_module_1.AiInsightModule);
    });
    (0, node_test_1.default)('should be instantiable', () => {
        const instance = new ai_insight_module_1.AiInsightModule();
        strict_1.default.ok(instance instanceof ai_insight_module_1.AiInsightModule);
    });
    (0, node_test_1.default)('module metadata has controllers', () => {
        const controllers = Reflect.getMetadata('controllers', ai_insight_module_1.AiInsightModule);
        // NestJS 装饰器注入的元数据
        if (controllers) {
            strict_1.default.ok(controllers.includes(ai_insight_controller_1.AiInsightController));
        }
    });
    (0, node_test_1.default)('module metadata has providers/exports', () => {
        const providers = Reflect.getMetadata('providers', ai_insight_module_1.AiInsightModule);
        if (providers) {
            const hasService = providers.some((p) => (typeof p === 'function' && p === ai_insight_service_1.AiInsightService) ||
                (typeof p === 'object' && p !== null &&
                    p.provide === ai_insight_service_1.AiInsightService));
            strict_1.default.ok(hasService, 'module should provide AiInsightService');
        }
    });
    (0, node_test_1.default)('controller has expected methods', () => {
        const proto = ai_insight_controller_1.AiInsightController.prototype;
        // KPI
        strict_1.default.equal(typeof proto.getKPIs, 'function');
        strict_1.default.equal(typeof proto.getKPIDetail, 'function');
        // Reports
        strict_1.default.equal(typeof proto.generateReport, 'function');
        strict_1.default.equal(typeof proto.getReports, 'function');
        // Anomalies
        strict_1.default.equal(typeof proto.detectAnomalies, 'function');
        strict_1.default.equal(typeof proto.getAnomalies, 'function');
        strict_1.default.equal(typeof proto.acknowledgeAnomaly, 'function');
        strict_1.default.equal(typeof proto.resolveAnomaly, 'function');
        // Forecasts
        strict_1.default.equal(typeof proto.generateForecast, 'function');
        strict_1.default.equal(typeof proto.getForecast, 'function');
        // Dashboard
        strict_1.default.equal(typeof proto.getDashboardSummary, 'function');
    });
    (0, node_test_1.default)('service has expected methods', () => {
        const proto = ai_insight_service_1.AiInsightService.prototype;
        // KPI
        strict_1.default.equal(typeof proto.getKPIs, 'function');
        strict_1.default.equal(typeof proto.getKPIDetail, 'function');
        // Reports
        strict_1.default.equal(typeof proto.generateReport, 'function');
        strict_1.default.equal(typeof proto.getReports, 'function');
        // Anomalies
        strict_1.default.equal(typeof proto.detectAnomalies, 'function');
        strict_1.default.equal(typeof proto.getAnomalies, 'function');
        strict_1.default.equal(typeof proto.acknowledgeAnomaly, 'function');
        strict_1.default.equal(typeof proto.resolveAnomaly, 'function');
        // Forecasts
        strict_1.default.equal(typeof proto.generateForecast, 'function');
        strict_1.default.equal(typeof proto.getForecast, 'function');
        // Dashboard
        strict_1.default.equal(typeof proto.getDashboardSummary, 'function');
    });
    (0, node_test_1.default)('service and controller use same contract', () => {
        const ctrlProto = ai_insight_controller_1.AiInsightController.prototype;
        const svcProto = ai_insight_service_1.AiInsightService.prototype;
        const ctrlMethods = Object.getOwnPropertyNames(ctrlProto)
            .filter(n => n !== 'constructor');
        // Controller should delegate to service
        // Module wiring verifies both exist
        const svcMethodNames = new Set(Object.getOwnPropertyNames(svcProto).filter(n => n !== 'constructor'));
        const delegatableMethods = [
            'getKPIs', 'getKPIDetail',
            'generateReport', 'getReports',
            'detectAnomalies', 'getAnomalies',
            'acknowledgeAnomaly', 'resolveAnomaly',
            'generateForecast', 'getForecast',
            'getDashboardSummary'
        ];
        for (const method of delegatableMethods) {
            strict_1.default.ok(svcMethodNames.has(method), `service should have ${method}`);
            strict_1.default.equal(typeof ctrlProto[method], 'function', `controller should have ${method}`);
        }
    });
});
//# sourceMappingURL=ai-insight.module.test.js.map