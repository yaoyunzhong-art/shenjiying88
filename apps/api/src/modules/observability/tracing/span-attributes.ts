/**
 * span-attributes.ts - Phase-22 T67
 * Span 数据模型 - 4 类标准 span (rpc/db/http/cache)
 *
 * 基于 OpenTelemetry semantic-conventions:
 * - rpc: 跨进程调用 (NestJS controller → service → external API)
 * - db: 数据库调用 (Prisma / TypeORM / Redis)
 * - http: HTTP 客户端/服务端 (Express / fetch / axios)
 * - cache: 缓存读写 (Redis / 内存)
 *
 * 每个 helper 函数负责将业务上下文转成 OTel 标准属性。
 */
import { SpanKind, SpanStatusCode, type Span } from '@opentelemetry/api';

// ── Semantic Keys (避免拼写错误,统一来源) ──

export const ATTR_KEYS = {
  // rpc
  RPC_SYSTEM: 'rpc.system',
  RPC_SERVICE: 'rpc.service',
  RPC_METHOD: 'rpc.method',

  // db
  DB_SYSTEM: 'db.system',
  DB_NAME: 'db.name',
  DB_OPERATION: 'db.operation',
  DB_SQL_TABLE: 'db.sql.table',

  // http
  HTTP_METHOD: 'http.method',
  HTTP_URL: 'http.url',
  HTTP_STATUS_CODE: 'http.status_code',
  HTTP_ROUTE: 'http.route',

  // cache
  CACHE_SYSTEM: 'cache.system',
  CACHE_KEY: 'cache.key',
  CACHE_HIT: 'cache.hit',

  // business (扩展)
  TENANT_ID: 'tenant.id',
  BRAND_ID: 'brand.id',
  STORE_ID: 'store.id',
  USER_ID: 'user.id',
} as const;

// ── Business Context (跨所有 span 透传) ──

export interface BusinessContext {
  tenantId?: string;
  brandId?: string;
  storeId?: string;
  userId?: string;
}

export function applyBusinessContext(span: Span, ctx: BusinessContext): void {
  if (ctx.tenantId) span.setAttribute(ATTR_KEYS.TENANT_ID, ctx.tenantId);
  if (ctx.brandId) span.setAttribute(ATTR_KEYS.BRAND_ID, ctx.brandId);
  if (ctx.storeId) span.setAttribute(ATTR_KEYS.STORE_ID, ctx.storeId);
  if (ctx.userId) span.setAttribute(ATTR_KEYS.USER_ID, ctx.userId);
}

// ── RPC Span Helper ──

export function setRpcSpan(span: Span, input: {
  system?: string;
  service: string;
  method: string;
}): void {
  span.setAttribute(ATTR_KEYS.RPC_SYSTEM, input.system ?? 'nestjs');
  span.setAttribute(ATTR_KEYS.RPC_SERVICE, input.service);
  span.setAttribute(ATTR_KEYS.RPC_METHOD, input.method);
}

// ── DB Span Helper ──

export function setDbSpan(span: Span, input: {
  system: 'postgresql' | 'mysql' | 'redis' | 'sqlite' | 'mongodb';
  database?: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'findOne' | 'findMany' | 'create' | 'update' | 'delete' | 'execute';
  table?: string;
}): void {
  span.setAttribute(ATTR_KEYS.DB_SYSTEM, input.system);
  if (input.database) span.setAttribute(ATTR_KEYS.DB_NAME, input.database);
  span.setAttribute(ATTR_KEYS.DB_OPERATION, input.operation);
  if (input.table) span.setAttribute(ATTR_KEYS.DB_SQL_TABLE, input.table);
}

// ── HTTP Span Helper ──

export function setHttpSpan(span: Span, input: {
  method: string;
  url?: string;
  statusCode?: number;
  route?: string;
}): void {
  span.setAttribute(ATTR_KEYS.HTTP_METHOD, input.method.toUpperCase());
  if (input.url) span.setAttribute(ATTR_KEYS.HTTP_URL, sanitizeUrl(input.url));
  if (input.route) span.setAttribute(ATTR_KEYS.HTTP_ROUTE, input.route);
  if (typeof input.statusCode === 'number') {
    span.setAttribute(ATTR_KEYS.HTTP_STATUS_CODE, input.statusCode);
    if (input.statusCode >= 500) {
      span.setStatus({ code: SpanStatusCode.ERROR });
    }
  }
}

/** 移除 query string 中的敏感信息 (token / api_key) */
function sanitizeUrl(url: string): string {
  try {
    const u = new URL(url);
    const SENSITIVE = ['token', 'api_key', 'apikey', 'password', 'secret'];
    for (const key of [...u.searchParams.keys()]) {
      if (SENSITIVE.some((s) => key.toLowerCase().includes(s))) {
        u.searchParams.set(key, '[REDACTED]');
      }
    }
    return u.toString();
  } catch {
    return url;
  }
}

// ── Cache Span Helper ──

export function setCacheSpan(span: Span, input: {
  system: 'redis' | 'memory';
  key: string;
  hit: boolean;
}): void {
  span.setAttribute(ATTR_KEYS.CACHE_SYSTEM, input.system);
  span.setAttribute(ATTR_KEYS.CACHE_KEY, input.key);
  span.setAttribute(ATTR_KEYS.CACHE_HIT, input.hit);
}

// ── Span Name Conventions ──

/**
 * 统一 span name 格式:`<namespace>.<action>`
 * - rpc: `svc.method` (例: `cashier.createOrder`)
 * - db:  `<db>.<table>.<op>` (例: `pg.orders.insert`)
 * - http: `<METHOD> <route>` (例: `GET /api/v1/orders/:id`)
 * - cache: `<system> <op>` (例: `redis GET`)
 */
export function buildSpanName(category: 'rpc' | 'db' | 'http' | 'cache', parts: string[]): string {
  return parts.filter(Boolean).join('.');
}

/** 根据 span kind 推荐类别 */
export function recommendSpanKind(category: 'rpc' | 'db' | 'http' | 'cache'): SpanKind {
  switch (category) {
    case 'rpc':
    case 'http':
      return SpanKind.CLIENT;
    case 'db':
    case 'cache':
      return SpanKind.CLIENT;
    default:
      return SpanKind.INTERNAL;
  }
}
