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
const { InventoryModule } = require('./inventory.module');
const { InventoryController } = require('./inventory.controller');
const { InventoryService } = require('./inventory.service');
(0, node_test_1.describe)('InventoryModule', () => {
    (0, node_test_1.default)('is defined', () => {
        strict_1.default.ok(InventoryModule);
    });
    (0, node_test_1.default)('registers controller', () => {
        const controllers = Reflect.getMetadata('controllers', InventoryModule) || [];
        const controllerNames = controllers.map((c) => c.name || c);
        strict_1.default.ok(controllerNames.includes('InventoryController') || controllers.includes(InventoryController));
    });
    (0, node_test_1.default)('registers service as provider', () => {
        const providers = Reflect.getMetadata('providers', InventoryModule) || [];
        const providerNames = providers.map((p) => {
            if (typeof p === 'function')
                return p.name;
            return p?.provide?.name ?? p?.name ?? String(p);
        });
        strict_1.default.ok(providerNames.some((n) => n === 'InventoryService' || n.includes('InventoryService')));
    });
    (0, node_test_1.default)('exports InventoryService', () => {
        const exports = Reflect.getMetadata('exports', InventoryModule) || [];
        const exportNames = exports.map((e) => (typeof e === 'function' ? e.name : String(e)));
        strict_1.default.ok(exportNames.some((n) => n === 'InventoryService' || n.includes('InventoryService')));
    });
    (0, node_test_1.default)('constructs module instance', () => {
        const mod = new InventoryModule();
        strict_1.default.ok(mod instanceof InventoryModule);
    });
});
//# sourceMappingURL=inventory.module.test.js.map