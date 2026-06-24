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
const portal_module_1 = require("./portal.module");
const portal_controller_1 = require("./portal.controller");
const portal_service_1 = require("./portal.service");
const stubConfigService = {
    get: () => ({}),
};
const stubMarketService = {
    getMergedProfile: () => ({
        marketCode: 'cn-mainland',
        locale: { defaultLanguage: 'zh-CN', supportedLanguages: ['zh-CN'] },
        timezone: { timezone: 'Asia/Shanghai' },
        currency: { currencyCode: 'CNY', symbol: '¥' },
        tax: { taxMode: 'INCLUDED', taxRate: 6, taxLabel: '增值税' },
        network: { networkRegion: 'MAINLAND_CHINA' },
        email: { provider: 'ALIYUN_DM', fromName: 'test', fromAddress: 'test@local', replyTo: 'test@local' },
    }),
    getOverrides: () => [],
};
const stubFoundationService = {
    getDependencySummary: () => ({}),
};
(0, node_test_1.describe)('PortalModule', () => {
    let moduleRef;
    (0, node_test_1.default)('should compile and instantiate', async () => {
        moduleRef = await testing_1.Test.createTestingModule({
            imports: [portal_module_1.PortalModule],
        })
            .overrideProvider('MarketService')
            .useValue(stubMarketService)
            .overrideProvider('FoundationService')
            .useValue(stubFoundationService)
            .compile();
        strict_1.default.ok(moduleRef);
    });
    (0, node_test_1.default)('should provide PortalController', async () => {
        moduleRef = await testing_1.Test.createTestingModule({
            imports: [portal_module_1.PortalModule],
        })
            .overrideProvider('MarketService')
            .useValue(stubMarketService)
            .overrideProvider('FoundationService')
            .useValue(stubFoundationService)
            .compile();
        const controller = moduleRef.get(portal_controller_1.PortalController);
        strict_1.default.ok(controller);
        strict_1.default.ok(controller instanceof portal_controller_1.PortalController);
    });
    (0, node_test_1.default)('should provide PortalService', async () => {
        moduleRef = await testing_1.Test.createTestingModule({
            imports: [portal_module_1.PortalModule],
        })
            .overrideProvider('MarketService')
            .useValue(stubMarketService)
            .overrideProvider('FoundationService')
            .useValue(stubFoundationService)
            .compile();
        const service = moduleRef.get(portal_service_1.PortalService);
        strict_1.default.ok(service);
        strict_1.default.ok(service instanceof portal_service_1.PortalService);
    });
});
//# sourceMappingURL=portal.module.test.js.map