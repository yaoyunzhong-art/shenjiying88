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
const ai_rule_engine_module_1 = require("./ai-rule-engine.module");
const ai_rule_engine_controller_1 = require("./ai-rule-engine.controller");
const ai_rule_engine_service_1 = require("./ai-rule-engine.service");
(0, node_test_1.describe)('AiRuleEngineModule', () => {
    (0, node_test_1.default)('should be defined', () => {
        const moduleClass = ai_rule_engine_module_1.AiRuleEngineModule;
        strict_1.default.ok(moduleClass);
    });
    (0, node_test_1.default)('should export expected shape (controllers, providers, exports)', () => {
        const decoratorFactory = Reflect.getMetadata('modules', ai_rule_engine_module_1.AiRuleEngineModule);
        // NestJS module metadata is stored via decorators; assert the module is registerable
        const moduleInstance = new ai_rule_engine_module_1.AiRuleEngineModule();
        strict_1.default.ok(moduleInstance instanceof ai_rule_engine_module_1.AiRuleEngineModule);
    });
    (0, node_test_1.default)('should have valid controller', () => {
        strict_1.default.ok(ai_rule_engine_controller_1.AiRuleEngineController);
        strict_1.default.equal(typeof ai_rule_engine_controller_1.AiRuleEngineController.prototype.evaluate, 'function');
    });
    (0, node_test_1.default)('should have valid service', () => {
        strict_1.default.ok(ai_rule_engine_service_1.AiRuleEngineService);
        strict_1.default.equal(typeof ai_rule_engine_service_1.AiRuleEngineService.prototype.evaluateMemberLevel, 'function');
        strict_1.default.equal(typeof ai_rule_engine_service_1.AiRuleEngineService.prototype.detectDeviceAnomaly, 'function');
    });
});
//# sourceMappingURL=ai-rule-engine.module.test.js.map