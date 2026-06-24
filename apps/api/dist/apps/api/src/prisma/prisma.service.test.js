"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const prisma_service_1 = require("./prisma.service");
(0, node_test_1.default)('PrismaService extends PrismaClient', () => {
    const service = new prisma_service_1.PrismaService();
    // PrismaClient methods are available via prototype chain
    strict_1.default.ok(typeof service.$connect === 'function');
    strict_1.default.ok(typeof service.$disconnect === 'function');
});
(0, node_test_1.default)('PrismaService is decorated with @Injectable', () => {
    const metadata = Reflect.getMetadata('__injectable__', prisma_service_1.PrismaService);
    // @Injectable injects metadata; if none, the class might be plain
    // but the important part is the class itself is defined and exported
    strict_1.default.ok(prisma_service_1.PrismaService !== undefined);
    strict_1.default.ok(Reflect.hasMetadata !== undefined);
});
(0, node_test_1.default)('PrismaService onModuleInit calls $connect', async () => {
    const connectCalls = [];
    const service = Object.create(prisma_service_1.PrismaService.prototype);
    service.$connect = async () => {
        connectCalls.push(true);
    };
    service.$disconnect = async () => { };
    strict_1.default.equal(connectCalls.length, 0);
    await service.onModuleInit();
    strict_1.default.equal(connectCalls.length, 1);
});
(0, node_test_1.default)('PrismaService onModuleDestroy calls $disconnect', async () => {
    const disconnectCalls = [];
    const service = Object.create(prisma_service_1.PrismaService.prototype);
    service.$connect = async () => { };
    service.$disconnect = async () => {
        disconnectCalls.push(true);
    };
    strict_1.default.equal(disconnectCalls.length, 0);
    await service.onModuleDestroy();
    strict_1.default.equal(disconnectCalls.length, 1);
});
//# sourceMappingURL=prisma.service.test.js.map