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
// AppModule 使用了 ConfigModule.forRoot，其中 validate 会同步校验运行所需的最小 env 集合。
// import 语句会被 tsx 做静态提升，早于顶层 process.env 赋值，因此必须用 require 动态加载。
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
process.env.API_PORT = process.env.API_PORT ?? '3001';
process.env.REDIS_HOST = process.env.REDIS_HOST ?? 'localhost';
process.env.REDIS_PORT = process.env.REDIS_PORT ?? '6379';
process.env.LYT_MODE = process.env.LYT_MODE ?? 'mock';
process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://test:test@localhost:5432/test';
require("reflect-metadata");
const testing_1 = require("@nestjs/testing");
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const { AppModule } = require('./app.module');
(0, node_test_1.describe)('AppModule', () => {
    let moduleRef;
    (0, node_test_1.default)('should compile and instantiate', async () => {
        moduleRef = await testing_1.Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        strict_1.default.ok(moduleRef);
        strict_1.default.ok(moduleRef instanceof testing_1.TestingModule);
    });
    (0, node_test_1.default)('should expose self from module reference', async () => {
        moduleRef = await testing_1.Test.createTestingModule({
            imports: [AppModule],
        }).compile();
        const appModule = moduleRef.get(AppModule);
        strict_1.default.ok(appModule);
        strict_1.default.ok(appModule instanceof AppModule);
    });
});
//# sourceMappingURL=app.module.test.js.map