/**
 * OpenTelemetry Tracing SDK 初始化
 *
 * 设计目标:
 *   - 零代码侵入:用 auto-instrumentation 自动捕获 HTTP/Express/NestJS/Prisma spans
 *   - W3C trace context 透传:从 traceparent header 解析,注入到下游
 *   - 灵活导出:开发模式 console exporter,生产 OTLP/HTTP exporter
 *   - 优雅降级:OTel SDK 初始化失败时,业务不受影响 (catch error + log)
 *
 * 使用:
 *   在 main.ts 顶部 `import './modules/observability/tracing/tracing'` (副作用导入)
 *   设置环境变量:
 *     OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318
 *     OTEL_SERVICE_NAME=m5-api
 *     OTEL_TRACES_EXPORTER=otlp  (默认) | console | none
 *     NODE_ENV=production         (生产模式自动启用)
 */

import {
  trace,
  diag,
  DiagConsoleLogger,
  DiagLogLevel,
  type DiagLogLevel as DiagLogLevelT,
} from '@opentelemetry/api';
import type { IncomingMessage } from 'node:http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { NodeSDK, tracing, resources } from '@opentelemetry/sdk-node';

const SERVICE_NAME = process.env.OTEL_SERVICE_NAME ?? process.env.SERVICE_NAME ?? 'm5-api';
const SERVICE_VERSION = process.env.SERVICE_VERSION ?? '0.1.0';
const DEPLOYMENT_ENV = process.env.NODE_ENV ?? 'development';
const TRACING_ENABLED = !['false', '0', 'off', 'no'].includes(
  (process.env.ENABLE_TRACING ?? 'true').toLowerCase(),
);
const TRACES_EXPORTER = (
  TRACING_ENABLED
    ? process.env.OTEL_TRACES_EXPORTER ?? (DEPLOYMENT_ENV === 'production' ? 'otlp' : 'console')
    : 'none'
).toLowerCase();
const OTLP_ENDPOINT = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318';
const LOG_LEVEL = (process.env.OTEL_LOG_LEVEL ?? 'error').toLowerCase();

if (TRACES_EXPORTER !== 'none') {
  const diagLevel =
    (DiagLogLevel as unknown as Record<string, DiagLogLevelT>)[LOG_LEVEL.toUpperCase()] ??
    DiagLogLevel.ERROR;
  diag.setLogger(new DiagConsoleLogger(), diagLevel);
}

let sdk: NodeSDK | null = null;
let initialized = false;

/**
 * 检测全局 tracer provider 是否已被设置(防止重复 register 触发 OTel
 * "Attempted duplicate registration" 错误)。在测试间共享同一进程时尤其重要。
 */
function hasGlobalTracerProvider(): boolean {
  try {
    // 任意 getTracer 调用会触发 OTel 内部 unregistration 警告,这里只读取
    // tracer 实例的 provider 引用作为存在性信号。
    return (trace.getTracer('m5-api-guard') as unknown as { provider?: unknown }).provider != null;
  } catch {
    return false;
  }
}

/**
 * 初始化 OpenTelemetry SDK。
 * 幂等:多次调用只生效一次。
 * 失败:打印 warning 后继续 (业务不依赖 OTel)
 */
export function initTracing(): void {
  if (initialized) return;

  if (TRACES_EXPORTER === 'none') {
    // 显式禁用:不启动 SDK,不标记 initialized (后续可重新启用)
    return;
  }

  // 已被其他模块(测试间共享)注册时,跳过 NodeSDK.start() 以避免 OTel 抛错
  if (hasGlobalTracerProvider()) {
    initialized = true;
    return;
  }
  initialized = true;

  try {
    const exporter =
      TRACES_EXPORTER === 'otlp'
        ? new OTLPTraceExporter({ url: `${OTLP_ENDPOINT}/v1/traces` })
        : new tracing.ConsoleSpanExporter();

    const spanProcessor =
      TRACES_EXPORTER === 'otlp'
        ? new tracing.BatchSpanProcessor(exporter, {
            maxQueueSize: 2048,
            maxExportBatchSize: 512,
            scheduledDelayMillis: 5000,
            exportTimeoutMillis: 30000,
          })
        : new tracing.SimpleSpanProcessor(exporter);

    sdk = new NodeSDK({
      resource: new resources.Resource({
        'service.name': SERVICE_NAME,
        'service.version': SERVICE_VERSION,
        'deployment.environment.name': DEPLOYMENT_ENV,
      }),
      spanProcessors: [spanProcessor],
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': { enabled: false }, // fs 太吵,关掉
          '@opentelemetry/instrumentation-http': {
            ignoreIncomingRequestHook: (req: IncomingMessage) => {
              const url = req.url ?? '';
              // 健康检查 / 指标 / Swagger 文档不计入 trace
              return url === '/healthz' || url === '/metrics' || url.startsWith('/docs');
            },
          },
          '@opentelemetry/instrumentation-nestjs-core': { enabled: true },
          '@opentelemetry/instrumentation-express': { enabled: true },
        }),
      ],
    });

    sdk.start();

    const shutdown = async () => {
      try {
        await sdk?.shutdown();
      } catch (err) {
        console.error('[tracing] shutdown error:', err);
      }
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    console.warn('[tracing] init failed, continuing without tracing:', err);
    sdk = null;
  }
}

/** 测试 / 关闭时手动调用 */
export async function shutdownTracing(): Promise<void> {
  if (!sdk) return;
  try {
    await sdk.shutdown();
    sdk = null;
    initialized = false;
  } catch (err) {
    console.error('[tracing] shutdown error:', err);
  }
}

/** 用于测试断言 SDK 状态 */
export function isTracingInitialized(): boolean {
  return initialized && sdk !== null;
}

export const TRACING_CONFIG = {
  serviceName: SERVICE_NAME,
  serviceVersion: SERVICE_VERSION,
  deploymentEnv: DEPLOYMENT_ENV,
  exporter: TRACES_EXPORTER,
  otlpEndpoint: OTLP_ENDPOINT,
} as const;
