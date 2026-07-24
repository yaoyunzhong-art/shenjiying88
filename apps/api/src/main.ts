import 'reflect-metadata';
import { ValidationPipe, type LoggerService as NestLoggerService } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
// OpenTelemetry SDK 副作用导入:必须在 NestFactory.create 之前,否则业务代码
// 可能先于 instrumentation patch 注册,导致部分 span 缺失。
// initTracing() 内部幂等,且在 exporter=none 时不启动 SDK。
import { LoggerService as StructuredLoggerService } from './modules/observability/logger/logger.service';
import { initTracing } from './modules/observability/tracing/tracing';
import { AppModule } from './app.module';

initTracing();

const SHOULD_LOG_INIT_DEBUG = process.env.DEBUG_INIT_LOGS === '1';
const QUIET_NEST_LOG_CONTEXTS = new Set(['RouterExplorer', 'RoutesResolver', 'InstanceLoader']);
const QUIET_NEST_LOG_MESSAGES = new Set([
  'Starting Nest application...',
  'Nest application successfully started',
  'Nest microservice successfully started',
]);
const SHOULD_LOG_NEST_ROUTE_MAP = process.env.DEBUG_NEST_ROUTES === '1';

function createNestLoggerAdapter(logger: StructuredLoggerService): NestLoggerService {
  const shouldSkip = (context: string | undefined, messageText: string): boolean => {
    if (!SHOULD_LOG_NEST_ROUTE_MAP && typeof context === 'string' && QUIET_NEST_LOG_CONTEXTS.has(context)) return true;
    if (!SHOULD_LOG_INIT_DEBUG && QUIET_NEST_LOG_MESSAGES.has(messageText)) return true;
    return false;
  };

  const extractContext = (optionalParams: unknown[]): string | undefined => {
    const last = optionalParams.at(-1);
    return typeof last === 'string' ? last : undefined;
  };

  const write = (
    level: 'info' | 'warn' | 'error' | 'debug' | 'trace' | 'fatal',
    message: unknown,
    optionalParams: unknown[] = [],
  ): void => {
    const context = extractContext(optionalParams);
    const rawText =
      message instanceof Error
        ? message.message
        : typeof message === 'string'
          ? message
          : 'nest logger event';
    if (shouldSkip(context, rawText)) return;

    const extras = context ? optionalParams.slice(0, -1) : optionalParams;
    const payload: Record<string, unknown> = context ? { context } : {};

    if (message instanceof Error) {
      payload.err = message;
    } else if (typeof message !== 'string') {
      payload.data = message;
    }

    if (extras.length === 1) {
      payload.extra = extras[0];
    } else if (extras.length > 1) {
      payload.extra = extras;
    }

    switch (level) {
      case 'warn':
        logger.warn(payload, rawText);
        return;
      case 'error':
        logger.error(payload, rawText);
        return;
      case 'debug':
        logger.debug(payload, rawText);
        return;
      case 'trace':
        logger.trace(payload, rawText);
        return;
      case 'fatal':
        logger.fatal(payload, rawText);
        return;
      default:
        logger.info(payload, rawText);
    }
  };

  return {
    log: (message: unknown, ...optionalParams: unknown[]) => write('info', message, optionalParams),
    error: (message: unknown, ...optionalParams: unknown[]) => write('error', message, optionalParams),
    warn: (message: unknown, ...optionalParams: unknown[]) => write('warn', message, optionalParams),
    debug: (message: unknown, ...optionalParams: unknown[]) => write('debug', message, optionalParams),
    verbose: (message: unknown, ...optionalParams: unknown[]) => write('trace', message, optionalParams),
    fatal: (message: unknown, ...optionalParams: unknown[]) => write('fatal', message, optionalParams),
  };
}

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
  const logger = new StructuredLoggerService({ serviceName: 'm5-api-bootstrap' });
  const nestLogger = createNestLoggerAdapter(logger);
  if (SHOULD_LOG_INIT_DEBUG) {
    console.log('[bootstrap] creating Nest app');
  }
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(nestLogger);
  app.flushLogs();
  if (SHOULD_LOG_INIT_DEBUG) {
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

  // 本地联调允许临时关闭 Swagger，且即使 Swagger 反射失败也不应阻塞业务接口启动。
  let swaggerReady = false;
  const swaggerEnabled = process.env.DISABLE_SWAGGER !== '1';
  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('M5 API')
      .setDescription('M5 multi-tenant SaaS API gateway and backbone service.')
      .setVersion('0.1.0')
      .build();
    if (SHOULD_LOG_INIT_DEBUG) {
      console.log('[bootstrap] creating swagger document');
    }
    try {
      const document = SwaggerModule.createDocument(app, swaggerConfig);
      if (SHOULD_LOG_INIT_DEBUG) {
        console.log('[bootstrap] swagger document created');
      }
      SwaggerModule.setup('docs', app, document);
      swaggerReady = true;
    } catch (err) {
      logger.warn(
        {
          err,
          hint: 'Set DISABLE_SWAGGER=1 to silence this in local dev until metadata reflection is fixed.',
        },
        'swagger bootstrap skipped because document generation failed',
      );
      if (SHOULD_LOG_INIT_DEBUG) {
        console.log('[bootstrap] swagger document failed, continue without /docs');
      }
    }
  } else if (SHOULD_LOG_INIT_DEBUG) {
    console.log('[bootstrap] swagger disabled by DISABLE_SWAGGER=1');
  }

  const port = Number(process.env.API_PORT ?? 3001);
  if (SHOULD_LOG_INIT_DEBUG) {
    console.log(`[bootstrap] listening on ${port}`);
  }
  await app.listen(port);
  if (SHOULD_LOG_INIT_DEBUG) {
    console.log('[bootstrap] listen completed');
  }
  logger.info({ port, allowedOrigins }, 'm5-api started');
  logger.info(
    { url: `http://localhost:${port}/api/v1/foundation/bootstrap` },
    'foundation blueprint endpoint',
  );
  if (swaggerEnabled && swaggerReady) {
    logger.info({ url: `http://localhost:${port}/docs` }, 'swagger docs endpoint');
  }
}

bootstrap().catch((err) => {
   
  console.error('[bootstrap] failed:', err);
  process.exit(1);
});
