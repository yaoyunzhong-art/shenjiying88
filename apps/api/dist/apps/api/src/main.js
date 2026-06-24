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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
// OpenTelemetry SDK 副作用导入:必须在 NestFactory.create 之前,否则业务代码
// 可能先于 instrumentation patch 注册,导致部分 span 缺失。
// initTracing() 内部幂等,且在 exporter=none 时不启动 SDK。
const logger_service_1 = require("./modules/observability/logger/logger.service");
const tracing_1 = require("./modules/observability/tracing/tracing");
const app_module_1 = require("./app.module");
(0, tracing_1.initTracing)();
/**
 * M5 API 启动入口
 *
 * 生产硬化:
 *   - helmet: 默认 CSP / HSTS / X-Frame / X-Content-Type-Options
 *   - compression: gzip 压缩响应
 *   - enableCors: 白名单 origins (CORS_ORIGIN 逗号分隔)
 *   - ValidationPipe: whitelist + transform
 *   - Swagger: /docs
 *
 * 可观测性:
 *   - OpenTelemetry trace SDK (OTLP / console / none)
 *   - pino 结构化日志 (生产 JSON, 开发 pretty)
 *   - x-request-id 中间件 (入站透传 / 出站回写)
 */
async function bootstrap() {
    const logger = new logger_service_1.LoggerService({ serviceName: 'm5-api-bootstrap' });
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        logger: undefined, // 关闭 NestJS 默认 logger,改用我们的 pino
    });
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new common_1.ValidationPipe({ whitelist: true, transform: true }));
    // ─── 可观测性:请求上下文 (x-request-id / W3C traceparent) ───
    const { attachRequestContext } = await Promise.resolve().then(() => __importStar(require('./modules/observability/logger/request-context.middleware')));
    app.use(attachRequestContext);
    // ─── 安全硬化 ───
    app.use((0, helmet_1.default)());
    app.use((0, compression_1.default)());
    // CORS 白名单: 逗号分隔;开发默认放行 localhost:3002/3003/3011
    const defaultOrigins = [
        'http://localhost:3002',
        'http://localhost:3003',
        'http://localhost:3011',
        'http://127.0.0.1:3002',
        'http://127.0.0.1:3003',
        'http://127.0.0.1:3011',
    ];
    const envOrigins = (process.env.CORS_ORIGIN ?? '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
    const allowedOrigins = envOrigins.length > 0 ? envOrigins : defaultOrigins;
    app.enableCors({
        origin: (origin, callback) => {
            // 同源 (curl / server-to-server) 不带 Origin,放行
            if (!origin)
                return callback(null, true);
            if (allowedOrigins.includes(origin))
                return callback(null, true);
            return callback(new Error(`CORS: origin ${origin} not allowed`), false);
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'x-tenant-id',
            'x-brand-id',
            'x-store-id',
            'x-market-code',
        ],
    });
    // ─── Swagger ───
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('M5 API')
        .setDescription('M5 multi-tenant SaaS API gateway and backbone service.')
        .setVersion('0.1.0')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('docs', app, document);
    const port = Number(process.env.API_PORT ?? 3001);
    await app.listen(port);
    logger.info({ port, allowedOrigins }, 'm5-api started');
    logger.info({ url: `http://localhost:${port}/api/v1/foundation/bootstrap` }, 'foundation blueprint endpoint');
    logger.info({ url: `http://localhost:${port}/docs` }, 'swagger docs endpoint');
}
bootstrap().catch((err) => {
    console.error('[bootstrap] failed:', err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map