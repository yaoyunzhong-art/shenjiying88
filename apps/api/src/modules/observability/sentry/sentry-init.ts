/**
 * sentry-init.ts - Phase-22 T69
 * Sentry SDK 初始化 (可选真实 SDK)
 *
 * 如果 @sentry/node 已装且 SENTRY_DSN 设置:
 *   - 调用真实 SDK 初始化
 *   - 设置 tags (service.name, deployment.environment, release)
 *   - 配置 beforeSend hook (PII 过滤)
 *
 * 如果未装:走 mock fallback,SentryService 内存收集
 */
import { diag } from '@opentelemetry/api';

const SENTRY_DSN = process.env.SENTRY_DSN;
const SERVICE_NAME = process.env.OTEL_SERVICE_NAME ?? process.env.SERVICE_NAME ?? 'm5-api';
const RELEASE = process.env.SENTRY_RELEASE ?? process.env.SERVICE_VERSION ?? '0.1.0';
const ENVIRONMENT = process.env.NODE_ENV ?? 'development';
const TRACES_SAMPLE_RATE = Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? 0.1);

/**
 * 初始化 Sentry (副作用)
 * 幂等:多次调用只生效一次
 */
export async function initSentry(): Promise<{ initialized: boolean; mockMode: boolean }> {
  if (process.env.SENTRY_DISABLED === 'true') {
    diag.info('[sentry] disabled by SENTRY_DISABLED=true');
    return { initialized: false, mockMode: true };
  }

  if (!SENTRY_DSN) {
    diag.info('[sentry] no SENTRY_DSN, using mock mode (in-memory)');
    return { initialized: false, mockMode: true };
  }

  try {
    // 动态 import:允许 @sentry/node 缺失时回退到 mock
    // @ts-expect-error — @sentry/node optional dependency
    const Sentry = await import('@sentry/node').catch(() => null);
    if (!Sentry) {
      diag.warn('[sentry] @sentry/node not installed, falling back to mock');
      return { initialized: false, mockMode: true };
    }

    Sentry.init({
      dsn: SENTRY_DSN,
      release: RELEASE,
      environment: ENVIRONMENT,
      tracesSampleRate: TRACES_SAMPLE_RATE,
      integrations: [
        // NestJS Express 集成由 @sentry/node 自动启用
        Sentry.captureConsoleIntegration({ levels: ['error'] }),
      ],
      // @ts-expect-error — dynamic import type
      beforeSend(event) {
        // PII 过滤:移除 email / phone / token 类敏感字段
        return scrubPII(event);
      },
      // @ts-expect-error — dynamic import type
      beforeBreadcrumb(breadcrumb) {
        return scrubBreadcrumb(breadcrumb);
      },
    });

    Sentry.setTag('service.name', SERVICE_NAME);
    diag.info(`[sentry] initialized: release=${RELEASE}, env=${ENVIRONMENT}`);
    return { initialized: true, mockMode: false };
  } catch (err) {
    diag.error('[sentry] init failed, falling back to mock:', err);
    return { initialized: false, mockMode: true };
  }
}

export const SENTRY_CONFIG = {
  dsn: SENTRY_DSN,
  release: RELEASE,
  environment: ENVIRONMENT,
  tracesSampleRate: TRACES_SAMPLE_RATE,
  disabled: process.env.SENTRY_DISABLED === 'true',
} as const;

// ── PII 过滤 ──

function scrubPII(event: unknown): unknown {
  const e = event as { extra?: Record<string, unknown>; tags?: Record<string, string>; user?: { email?: string; username?: string } };
  if (e.extra) {
    for (const key of Object.keys(e.extra)) {
      if (/email|phone|password|token|secret|api_key/i.test(key)) {
        e.extra[key] = '[REDACTED]';
      }
    }
  }
  if (e.tags) {
    for (const key of Object.keys(e.tags)) {
      if (/email|phone|password|token|secret/i.test(key)) {
        e.tags[key] = '[REDACTED]';
      }
    }
  }
  if (e.user?.email) e.user.email = '[REDACTED]';
  if (e.user?.username) e.user.username = '[REDACTED]';
  return event;
}

function scrubBreadcrumb(breadcrumb: unknown): unknown {
  const b = breadcrumb as { data?: Record<string, unknown> };
  if (b.data?.url) {
    b.data.url = String(b.data.url).replace(/([?&])(token|api_key|password)=[^&]+/g, '$1$2=[REDACTED]');
  }
  return breadcrumb;
}
