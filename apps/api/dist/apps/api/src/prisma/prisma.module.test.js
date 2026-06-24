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
const prisma_module_1 = require("./prisma.module");
const prisma_service_1 = require("./prisma.service");
const mockPrismaService = {
    $connect: async () => { },
    $disconnect: async () => { },
};
(0, node_test_1.describe)('PrismaModule', () => {
    let moduleRef;
    (0, node_test_1.default)('should compile and instantiate', async () => {
        moduleRef = await testing_1.Test.createTestingModule({
            imports: [prisma_module_1.PrismaModule],
        })
            .overrideProvider(prisma_service_1.PrismaService)
            .useValue(mockPrismaService)
            .compile();
        strict_1.default.ok(moduleRef);
    });
    (0, node_test_1.default)('should provide and export PrismaService', async () => {
        moduleRef = await testing_1.Test.createTestingModule({
            imports: [prisma_module_1.PrismaModule],
        })
            .overrideProvider(prisma_service_1.PrismaService)
            .useValue(mockPrismaService)
            .compile();
        const service = moduleRef.get(prisma_service_1.PrismaService);
        strict_1.default.ok(service);
        strict_1.default.equal(service, mockPrismaService);
    });
    (0, node_test_1.default)('PrismaModule should be decorated with @Global()', () => {
        const metadata = Reflect.getMetadata('__module:global__', prisma_module_1.PrismaModule);
        strict_1.default.ok(metadata !== undefined);
    });
});
//# sourceMappingURL=prisma.module.test.js.map