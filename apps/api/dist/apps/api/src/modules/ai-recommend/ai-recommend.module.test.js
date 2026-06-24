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
 * 🐜 自动: [ai-recommend] [A] module 测试
 * AiRecommendModule 的模块注册和导出验证
 */
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const ai_recommend_module_1 = require("./ai-recommend.module");
const ai_recommend_controller_1 = require("./ai-recommend.controller");
const ai_recommend_service_1 = require("./ai-recommend.service");
(0, node_test_1.describe)('AiRecommendModule', () => {
    (0, node_test_1.default)('should be defined', () => {
        strict_1.default.ok(ai_recommend_module_1.AiRecommendModule);
    });
    (0, node_test_1.default)('should be instantiable', () => {
        const instance = new ai_recommend_module_1.AiRecommendModule();
        strict_1.default.ok(instance instanceof ai_recommend_module_1.AiRecommendModule);
    });
    (0, node_test_1.default)('module metadata has controllers', () => {
        const controllers = Reflect.getMetadata('controllers', ai_recommend_module_1.AiRecommendModule);
        if (controllers) {
            strict_1.default.ok(controllers.includes(ai_recommend_controller_1.AiRecommendController));
        }
    });
    (0, node_test_1.default)('module metadata has providers/exports', () => {
        const providers = Reflect.getMetadata('providers', ai_recommend_module_1.AiRecommendModule);
        if (providers) {
            const hasService = providers.some((p) => (typeof p === 'function' && p === ai_recommend_service_1.AiRecommendService) ||
                (typeof p === 'object' && p !== null &&
                    p.provide === ai_recommend_service_1.AiRecommendService));
            strict_1.default.ok(hasService, 'module should provide AiRecommendService');
        }
    });
    (0, node_test_1.default)('module exports AiRecommendService', () => {
        const exports = Reflect.getMetadata('exports', ai_recommend_module_1.AiRecommendModule);
        if (exports) {
            const exportsService = exports.some((e) => (typeof e === 'function' && e === ai_recommend_service_1.AiRecommendService) ||
                (typeof e === 'object' && e !== null &&
                    e.export === ai_recommend_service_1.AiRecommendService));
            strict_1.default.ok(exportsService, 'module should export AiRecommendService');
        }
    });
    (0, node_test_1.default)('controller has expected methods', () => {
        const proto = ai_recommend_controller_1.AiRecommendController.prototype;
        // 推荐查询
        strict_1.default.equal(typeof proto.getPopular, 'function');
        strict_1.default.equal(typeof proto.getPersonalized, 'function');
        strict_1.default.equal(typeof proto.getRecommendations, 'function');
        // 推荐生成
        strict_1.default.equal(typeof proto.generateRecommendations, 'function');
        // 策略管理
        strict_1.default.equal(typeof proto.createStrategy, 'function');
        strict_1.default.equal(typeof proto.getStrategies, 'function');
        strict_1.default.equal(typeof proto.getStrategy, 'function');
        strict_1.default.equal(typeof proto.updateStrategy, 'function');
        strict_1.default.equal(typeof proto.enableStrategy, 'function');
        strict_1.default.equal(typeof proto.disableStrategy, 'function');
        // 画像管理
        strict_1.default.equal(typeof proto.getProfile, 'function');
        strict_1.default.equal(typeof proto.updateProfile, 'function');
        // 反馈收集
        strict_1.default.equal(typeof proto.recordScore, 'function');
        strict_1.default.equal(typeof proto.recordInteraction, 'function');
        strict_1.default.equal(typeof proto.recordConversion, 'function');
    });
    (0, node_test_1.default)('service has expected methods', () => {
        const proto = ai_recommend_service_1.AiRecommendService.prototype;
        // 推荐
        strict_1.default.equal(typeof proto.getPopularRecommendations, 'function');
        strict_1.default.equal(typeof proto.getPersonalizedRecommendations, 'function');
        strict_1.default.equal(typeof proto.generateRecommendations, 'function');
        strict_1.default.equal(typeof proto.getRecommendations, 'function');
        // 策略
        strict_1.default.equal(typeof proto.createStrategy, 'function');
        strict_1.default.equal(typeof proto.getStrategies, 'function');
        strict_1.default.equal(typeof proto.getStrategy, 'function');
        strict_1.default.equal(typeof proto.updateStrategy, 'function');
        strict_1.default.equal(typeof proto.enableStrategy, 'function');
        strict_1.default.equal(typeof proto.disableStrategy, 'function');
        // 画像
        strict_1.default.equal(typeof proto.getProfile, 'function');
        strict_1.default.equal(typeof proto.updateProfile, 'function');
        // 反馈
        strict_1.default.equal(typeof proto.recordInteraction, 'function');
        strict_1.default.equal(typeof proto.recordConversion, 'function');
    });
    (0, node_test_1.default)('controller and service contract alignment', () => {
        const ctrlProto = ai_recommend_controller_1.AiRecommendController.prototype;
        const svcProto = ai_recommend_service_1.AiRecommendService.prototype;
        const svcMethodNames = new Set(Object.getOwnPropertyNames(svcProto).filter(n => n !== 'constructor'));
        const delegatableMethods = [
            'getPopularRecommendations',
            'getPersonalizedRecommendations',
            'getRecommendations',
            'generateRecommendations',
            'createStrategy',
            'getStrategies',
            'getStrategy',
            'updateStrategy',
            'enableStrategy',
            'disableStrategy',
            'getProfile',
            'updateProfile',
            'recordInteraction',
            'recordConversion'
        ];
        for (const method of delegatableMethods) {
            strict_1.default.ok(svcMethodNames.has(method), `service should have method ${method}`);
        }
    });
    (0, node_test_1.default)('module can be imported and used with NestJS Test', async () => {
        const { Test } = await Promise.resolve().then(() => __importStar(require('@nestjs/testing')));
        const module = await Test.createTestingModule({
            imports: [ai_recommend_module_1.AiRecommendModule]
        }).compile();
        const app = module.createNestApplication();
        await app.init();
        const service = app.get(ai_recommend_service_1.AiRecommendService);
        strict_1.default.ok(service instanceof ai_recommend_service_1.AiRecommendService);
        await app.close();
    });
});
//# sourceMappingURL=ai-recommend.module.test.js.map