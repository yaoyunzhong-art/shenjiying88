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
const testing_1 = require("@nestjs/testing");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const market_module_1 = require("./market.module");
const market_controller_1 = require("./market.controller");
const market_service_1 = require("./market.service");
const foundation_service_1 = require("../foundation/foundation.service");
const stubFoundationService = {
    getDependencySummary: (_module) => ({
        module: 'foundation',
        generatedAt: '2026-01-01',
        dependencies: [],
        contracts: []
    })
};
const stubPrismaService = {
    domainEvent: { create: async () => ({}), findUnique: async () => null, findMany: async () => [] },
    governanceApproval: { create: async () => ({}), findUnique: async () => null, findMany: async () => [] },
    featureFlag: { create: async () => ({}), findUnique: async () => null, findMany: async () => [] },
    trustedAudit: { create: async () => ({}), findUnique: async () => null, findMany: async () => [] },
    runtimePolicy: { create: async () => ({}), findUnique: async () => null, findMany: async () => [] },
};
(0, node_test_1.describe)('MarketModule', () => {
    let moduleRef;
    (0, node_test_1.default)('should compile and instantiate', async () => {
        moduleRef = await testing_1.Test.createTestingModule({
            imports: [market_module_1.MarketModule],
        })
            .overrideProvider(foundation_service_1.FoundationService)
            .useValue(stubFoundationService)
            .overrideProvider('PrismaService')
            .useValue(stubPrismaService)
            .compile();
        strict_1.default.ok(moduleRef);
    });
    (0, node_test_1.default)('should provide MarketController', async () => {
        moduleRef = await testing_1.Test.createTestingModule({
            imports: [market_module_1.MarketModule],
        })
            .overrideProvider(foundation_service_1.FoundationService)
            .useValue(stubFoundationService)
            .overrideProvider('PrismaService')
            .useValue(stubPrismaService)
            .compile();
        const controller = moduleRef.get(market_controller_1.MarketController);
        strict_1.default.ok(controller);
        strict_1.default.ok(controller instanceof market_controller_1.MarketController);
    });
    (0, node_test_1.default)('should provide MarketService', async () => {
        moduleRef = await testing_1.Test.createTestingModule({
            imports: [market_module_1.MarketModule],
        })
            .overrideProvider(foundation_service_1.FoundationService)
            .useValue(stubFoundationService)
            .overrideProvider('PrismaService')
            .useValue(stubPrismaService)
            .compile();
        const service = moduleRef.get(market_service_1.MarketService);
        strict_1.default.ok(service);
        strict_1.default.ok(service instanceof market_service_1.MarketService);
    });
});
//# sourceMappingURL=market.module.test.js.map