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
const finance_module_1 = require("./finance.module");
const finance_controller_1 = require("./finance.controller");
const finance_service_1 = require("./finance.service");
const prisma_module_1 = require("../../prisma/prisma.module");
(0, node_test_1.describe)('FinanceModule', () => {
    (0, node_test_1.default)('exposes controller in metadata', () => {
        const controllers = Reflect.getMetadata('controllers', finance_module_1.FinanceModule) || [];
        strict_1.default.ok(controllers.includes(finance_controller_1.FinanceController), 'should register FinanceController');
        strict_1.default.equal(controllers.length, 1, 'should have exactly 1 controller');
    });
    (0, node_test_1.default)('exposes provider in metadata', () => {
        const providers = Reflect.getMetadata('providers', finance_module_1.FinanceModule) || [];
        strict_1.default.ok(providers.includes(finance_service_1.FinanceService), 'should register FinanceService');
        strict_1.default.equal(providers.length, 1, 'should have exactly 1 provider');
    });
    (0, node_test_1.default)('imports PrismaModule', () => {
        const imports = Reflect.getMetadata('imports', finance_module_1.FinanceModule) || [];
        strict_1.default.ok(imports.includes(prisma_module_1.PrismaModule), 'should import PrismaModule');
        strict_1.default.equal(imports.length, 1, 'should have exactly 1 import');
    });
    (0, node_test_1.default)('exports FinanceService', () => {
        const exports = Reflect.getMetadata('exports', finance_module_1.FinanceModule) || [];
        strict_1.default.ok(exports.includes(finance_service_1.FinanceService), 'should export FinanceService');
        strict_1.default.equal(exports.length, 1, 'should export exactly 1 symbol');
    });
    (0, node_test_1.default)('is a valid NestJS Module class', () => {
        // Module metadata key; NestJS decorator sets 'imports', 'controllers', 'providers', 'exports'
        strict_1.default.equal(typeof finance_module_1.FinanceModule, 'function');
    });
    (0, node_test_1.default)('module can be instantiated', () => {
        const instance = new finance_module_1.FinanceModule();
        strict_1.default.ok(instance instanceof finance_module_1.FinanceModule);
    });
    (0, node_test_1.default)('controller/provider/import arrays do not overlap', () => {
        const controllers = Reflect.getMetadata('controllers', finance_module_1.FinanceModule) || [];
        const providers = Reflect.getMetadata('providers', finance_module_1.FinanceModule) || [];
        const imports = Reflect.getMetadata('imports', finance_module_1.FinanceModule) || [];
        const exports = Reflect.getMetadata('exports', finance_module_1.FinanceModule) || [];
        // FinanceController should only be in controllers
        strict_1.default.ok(!providers.includes(finance_controller_1.FinanceController), 'FinanceController should not be in providers');
        // FinanceService should only be in providers && exports
        strict_1.default.ok(!controllers.includes(finance_service_1.FinanceService), 'FinanceService should not be in controllers');
        // Module dependencies should only be in imports
        strict_1.default.ok(!controllers.includes(prisma_module_1.PrismaModule), 'PrismaModule should not be in controllers');
        strict_1.default.ok(!providers.includes(prisma_module_1.PrismaModule), 'PrismaModule should not be in providers');
        strict_1.default.ok(!exports.includes(finance_controller_1.FinanceController), 'export should not include controller');
    });
});
//# sourceMappingURL=finance.module.test.js.map