import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
// OpenTelemetry SDK 副作用导入:必须在 NestFactory.create 之前,否则业务代码
// 可能先于 instrumentation patch 注册,导致部分 span 缺失。
// initTracing() 内部幂等,且在 exporter=none 时不启动 SDK。
import { LoggerService } from './modules/observability/logger/logger.service';
import { initTracing } from './modules/observability/tracing/tracing';
import { AppModule } from './app.module';

initTracing();

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
  const logger = new LoggerService({ serviceName: 'm5-api-bootstrap' });
  if (process.env.NODE_ENV !== 'production') {
    console.log('[bootstrap] creating Nest app');
  }
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: undefined, // 关闭 NestJS 默认 logger,改用我们的 pino
  });
  if (process.env.NODE_ENV !== 'production') {
    console.log('[bootstrap] Nest app created');
  }
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // ─── 可观测性:请求上下文 (x-request-id / W3C traceparent) ───
  const { attachRequestContext } =
    await import('./modules/observability/logger/request-context.middleware');
  app.use(attachRequestContext);

  // ─── 安全硬化 ───
  app.use(helmet());
  app.use(compression());

  // CORS 白名单: 逗号分隔;开发默认放行 localhost:3002/3003/3011/3111
  const defaultOrigins = [
    'http://localhost:3002',
    'http://localhost:3003',
    'http://localhost:3011',
    'http://localhost:3111',
    'http://localhost:3102',
    'http://127.0.0.1:3002',
    'http://127.0.0.1:3003',
    'http://127.0.0.1:3011',
    'http://127.0.0.1:3111',
    'http://127.0.0.1:3102',
  ];
  const envOrigins = (process.env.CORS_ORIGIN ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const allowedOrigins = envOrigins.length > 0 ? envOrigins : defaultOrigins;

  app.enableCors({
    origin: (origin, callback) => {
      // 同源 (curl / server-to-server) 不带 Origin,放行
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
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

  // 本地联调允许临时关闭 Swagger，避免文档反射异常阻塞业务接口启动。
  const swaggerEnabled = process.env.DISABLE_SWAGGER !== '1';
  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('M5 API')
      .setDescription('M5 multi-tenant SaaS API gateway and backbone service.')
      .setVersion('0.1.0')
      .build();
    if (process.env.NODE_ENV !== 'production') {
      console.log('[bootstrap] creating swagger document');
    }
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    if (process.env.NODE_ENV !== 'production') {
      console.log('[bootstrap] swagger document created');
    }
    SwaggerModule.setup('docs', app, document);
  } else if (process.env.NODE_ENV !== 'production') {
    console.log('[bootstrap] swagger disabled by DISABLE_SWAGGER=1');
  }

  const port = Number(process.env.API_PORT ?? 3001);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[bootstrap] listening on ${port}`);
  }
  await app.listen(port);
  if (process.env.NODE_ENV !== 'production') {
    console.log('[bootstrap] listen completed');
  }
  logger.info({ port, allowedOrigins }, 'm5-api started');
  logger.info(
    { url: `http://localhost:${port}/api/v1/foundation/bootstrap` },
    'foundation blueprint endpoint',
  );
  if (swaggerEnabled) {
    logger.info({ url: `http://localhost:${port}/docs` }, 'swagger docs endpoint');
  }
}

bootstrap().catch((err) => {
   
  console.error('[bootstrap] failed:', err);
  process.exit(1);
});
