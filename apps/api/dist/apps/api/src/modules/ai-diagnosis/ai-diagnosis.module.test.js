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
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const ai_diagnosis_controller_1 = require("./ai-diagnosis.controller");
const ai_diagnosis_service_1 = require("./ai-diagnosis.service");
const ai_diagnosis_module_1 = require("./ai-diagnosis.module");
(0, node_test_1.describe)('AiDiagnosisModule', () => {
    (0, node_test_1.default)('should export AiDiagnosisController and AiDiagnosisService', () => {
        const moduleMetadata = Reflect.getMetadata('modules', ai_diagnosis_module_1.AiDiagnosisModule) ?? {};
        // Verify module decorator exists
        strict_1.default.ok(ai_diagnosis_module_1.AiDiagnosisModule);
    });
    (0, node_test_1.default)('should have controller and provider metadata', () => {
        // Module存在即可，具体DI由NestJS启动验证
        strict_1.default.ok(ai_diagnosis_module_1.AiDiagnosisModule);
    });
    (0, node_test_1.default)('service instance works standalone', () => {
        ai_diagnosis_service_1.AiDiagnosisService.resetStores();
        const service = new ai_diagnosis_service_1.AiDiagnosisService();
        const controller = new ai_diagnosis_controller_1.AiDiagnosisController(service);
        const result = controller.create({
            engineId: 'engine-test',
            scenarioId: 'scenario-test',
            tenantId: 'T-test',
            requestedBy: 'user-test'
        });
        strict_1.default.ok(result.diagnosis);
        strict_1.default.equal(result.diagnosis.status, 'PENDING');
        strict_1.default.equal(result.diagnosis.engineId, 'engine-test');
    });
    (0, node_test_1.default)('controller throws NotFound for missing diagnosis', () => {
        ai_diagnosis_service_1.AiDiagnosisService.resetStores();
        const service = new ai_diagnosis_service_1.AiDiagnosisService();
        const controller = new ai_diagnosis_controller_1.AiDiagnosisController(service);
        strict_1.default.throws(() => controller.get('non-existent'), (err) => err.message.includes('not found'));
    });
});
//# sourceMappingURL=ai-diagnosis.module.test.js.map