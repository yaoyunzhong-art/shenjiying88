"use strict";
/**
 * metrics.module.test.ts — MetricsModule 初始化测试
 */
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
const metrics_module_1 = require("./metrics.module");
(0, node_test_1.describe)('MetricsModule', () => {
    (0, node_test_1.default)('模块定义包含必要的元数据', () => {
        const metadata = Reflect.getMetadata('imports', metrics_module_1.MetricsModule) ?? [];
        const controllers = Reflect.getMetadata('controllers', metrics_module_1.MetricsModule) ?? [];
        const providers = Reflect.getMetadata('providers', metrics_module_1.MetricsModule) ?? [];
        const exports = Reflect.getMetadata('exports', metrics_module_1.MetricsModule) ?? [];
        strict_1.default.ok(Array.isArray(metadata));
        strict_1.default.ok(controllers.length > 0, 'should have at least one controller');
        strict_1.default.ok(providers.length > 0, 'should have at least one provider');
        strict_1.default.ok(exports.length > 0, 'should export service and interceptor');
    });
});
//# sourceMappingURL=metrics.module.test.js.map