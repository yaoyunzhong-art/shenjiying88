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
const health_module_1 = require("./health.module");
const health_controller_1 = require("./health.controller");
const health_service_1 = require("./health.service");
const lyt_module_1 = require("../lyt/lyt.module");
const prisma_module_1 = require("../../prisma/prisma.module");
(0, node_test_1.describe)('HealthModule', () => {
    (0, node_test_1.default)('exposes controller in metadata', () => {
        const controllers = Reflect.getMetadata('controllers', health_module_1.HealthModule) || [];
        strict_1.default.ok(controllers.includes(health_controller_1.HealthController), 'should register HealthController');
        strict_1.default.equal(controllers.length, 1, 'should have exactly 1 controller');
    });
    (0, node_test_1.default)('exposes provider in metadata', () => {
        const providers = Reflect.getMetadata('providers', health_module_1.HealthModule) || [];
        strict_1.default.ok(providers.includes(health_service_1.HealthService), 'should register HealthService');
        strict_1.default.equal(providers.length, 1, 'should have exactly 1 provider');
    });
    (0, node_test_1.default)('imports LytModule and PrismaModule', () => {
        const imports = Reflect.getMetadata('imports', health_module_1.HealthModule) || [];
        strict_1.default.ok(imports.includes(lyt_module_1.LytModule), 'should import LytModule');
        strict_1.default.ok(imports.includes(prisma_module_1.PrismaModule), 'should import PrismaModule');
        strict_1.default.equal(imports.length, 2, 'should have exactly 2 imports');
    });
    (0, node_test_1.default)('exports HealthService', () => {
        const exports = Reflect.getMetadata('exports', health_module_1.HealthModule) || [];
        strict_1.default.ok(exports.includes(health_service_1.HealthService), 'should export HealthService');
        strict_1.default.equal(exports.length, 1, 'should export exactly 1 symbol');
    });
    (0, node_test_1.default)('is a valid NestJS Module class', () => {
        const moduleMeta = Reflect.getMetadata('modules', health_module_1.HealthModule);
        // Module metadata key; NestJS decorator sets 'imports', 'controllers', 'providers', 'exports'
        strict_1.default.equal(typeof health_module_1.HealthModule, 'function');
        strict_1.default.equal(moduleMeta, undefined);
    });
    (0, node_test_1.default)('module can be instantiated', () => {
        const instance = new health_module_1.HealthModule();
        strict_1.default.ok(instance instanceof health_module_1.HealthModule);
    });
    (0, node_test_1.default)('controller/provider/import arrays do not overlap', () => {
        const controllers = Reflect.getMetadata('controllers', health_module_1.HealthModule) || [];
        const providers = Reflect.getMetadata('providers', health_module_1.HealthModule) || [];
        const imports = Reflect.getMetadata('imports', health_module_1.HealthModule) || [];
        const exports = Reflect.getMetadata('exports', health_module_1.HealthModule) || [];
        // HealthController should only be in controllers
        strict_1.default.ok(!providers.includes(health_controller_1.HealthController), 'HealthController should not be in providers');
        // HealthService should only be in providers && exports
        strict_1.default.ok(!controllers.includes(health_service_1.HealthService), 'HealthService should not be in controllers');
        // Module dependencies should only be in imports
        strict_1.default.ok(!controllers.includes(lyt_module_1.LytModule), 'LytModule should not be in controllers');
        strict_1.default.ok(!providers.includes(lyt_module_1.LytModule), 'LytModule should not be in providers');
        strict_1.default.ok(!controllers.includes(prisma_module_1.PrismaModule), 'PrismaModule should not be in controllers');
        strict_1.default.ok(!providers.includes(prisma_module_1.PrismaModule), 'PrismaModule should not be in providers');
        strict_1.default.ok(!exports.includes(health_controller_1.HealthController), 'export should not include controller');
    });
});
//# sourceMappingURL=health.module.test.js.map