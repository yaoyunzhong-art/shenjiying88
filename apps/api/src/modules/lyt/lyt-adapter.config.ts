import type { ConfigService } from '@nestjs/config';

type LytHttpAdapterMode = 'sandbox' | 'real';

export interface LytHttpAdapterConfigSnapshot {
  baseUrl: string;
  signingSecret: string;
  timeoutMs: number;
  maxRetries: number;
}

/**
 * LYT 完整配置模型
 *
 * 涵盖：端点配置、超时策略、重试逻辑、证书配置、签名算法选择。
 */
export interface LytFullConfig {
  /** 端点配置 */
  endpoints: {
    /** 基础 URL */
    baseUrl: string;
    /** Webhook 回调路径前缀 */
    webhookPathPrefix: string;
    /** 轮询基础路径 */
    pollPathPrefix: string;
  };
  /** 超时配置 */
  timeouts: {
    /** 连接超时 (ms) */
    connectTimeoutMs: number;
    /** 读取超时 (ms) */
    readTimeoutMs: number;
    /** 空闲超时 (ms) */
    idleTimeoutMs: number;
  };
  /** 重试配置 */
  retry: {
    /** 最大重试次数 */
    maxRetries: number;
    /** 基础重试延迟 (ms) */
    baseDelayMs: number;
    /** 最大重试延迟 (ms) */
    maxDelayMs: number;
    /** 是否启用指数退避 */
    exponentialBackoff: boolean;
  };
  /** 证书配置 */
  cert: {
    /** 客户端证书路径 (PEM) */
    clientCertPath?: string;
    /** 客户端密钥路径 (PEM) */
    clientKeyPath?: string;
    /** CA 证书路径 (PEM) */
    caCertPath?: string;
    /** 是否跳过 TLS 验证 */
    skipTlsVerify: boolean;
  };
  /** 签名配置 */
  signing: {
    /** 签名算法: sha256 / hmac-sha256 / rsa-sha256 */
    algorithm: string;
    /** 签名密钥 */
    secret: string;
    /** 签名有效期 (秒) */
    ttlSeconds: number;
  };
  /** 缓存配置 */
  cache: {
    /** 是否启用缓存 */
    enabled: boolean;
    /** 缓存 TTL (ms) */
    ttlMs: number;
    /** 缓存最大条目数 */
    maxEntries: number;
  };
}

const LYT_HTTP_ADAPTER_DEFAULTS: Record<LytHttpAdapterMode, LytHttpAdapterConfigSnapshot> = {
  sandbox: {
    baseUrl: 'https://sandbox.lyt.local',
    signingSecret: 'sandbox-lyt-secret',
    timeoutMs: 4000,
    maxRetries: 2,
  },
  real: {
    baseUrl: 'https://api.lyt.local',
    signingSecret: 'real-lyt-secret',
    timeoutMs: 5000,
    maxRetries: 1,
  },
};

/**
 * LYT 全量配置默认值
 */
const LYT_FULL_CONFIG_DEFAULTS: Record<LytHttpAdapterMode, LytFullConfig> = {
  sandbox: {
    endpoints: {
      baseUrl: 'https://sandbox.lyt.local',
      webhookPathPrefix: '/api/v1/webhooks',
      pollPathPrefix: '/api/v1/poll',
    },
    timeouts: {
      connectTimeoutMs: 4000,
      readTimeoutMs: 8000,
      idleTimeoutMs: 10000,
    },
    retry: {
      maxRetries: 2,
      baseDelayMs: 200,
      maxDelayMs: 5000,
      exponentialBackoff: true,
    },
    cert: {
      skipTlsVerify: true,
    },
    signing: {
      algorithm: 'sha256',
      secret: 'sandbox-lyt-secret',
      ttlSeconds: 300,
    },
    cache: {
      enabled: true,
      ttlMs: 60000,
      maxEntries: 500,
    },
  },
  real: {
    endpoints: {
      baseUrl: 'https://api.lyt.local',
      webhookPathPrefix: '/api/v1/webhooks',
      pollPathPrefix: '/api/v1/poll',
    },
    timeouts: {
      connectTimeoutMs: 5000,
      readTimeoutMs: 10000,
      idleTimeoutMs: 15000,
    },
    retry: {
      maxRetries: 1,
      baseDelayMs: 500,
      maxDelayMs: 10000,
      exponentialBackoff: true,
    },
    cert: {
      clientCertPath: undefined,
      clientKeyPath: undefined,
      caCertPath: undefined,
      skipTlsVerify: false,
    },
    signing: {
      algorithm: 'sha256',
      secret: 'real-lyt-secret',
      ttlSeconds: 300,
    },
    cache: {
      enabled: true,
      ttlMs: 30000,
      maxEntries: 1000,
    },
  },
};

function pickString(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function pickNumber(value: unknown, fallback: number) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function pickBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return fallback;
}

function resolveFullConfigSection<T extends Record<string, unknown>>(
  configService: Pick<ConfigService, 'get'> | undefined,
  prefix: string,
  defaults: T,
): T {
  if (!configService) return defaults;

  const result = { ...defaults } as Record<string, unknown>;
  for (const key of Object.keys(defaults)) {
    const value = configService.get(`${prefix}.${key}`);
    if (value !== undefined && value !== null) {
      const typedDefault = (defaults as Record<string, unknown>)[key];
      if (typeof typedDefault === 'boolean') {
        result[key] = pickBoolean(value, typedDefault as boolean);
      } else if (typeof typedDefault === 'number') {
        result[key] = pickNumber(value, typedDefault as number);
      } else {
        result[key] = pickString(value as string, typedDefault as string);
      }
    }
  }
  return result as T;
}

export function resolveLytHttpAdapterConfig(
  mode: LytHttpAdapterMode,
  configService?: Pick<ConfigService, 'get'>,
): LytHttpAdapterConfigSnapshot {
  const defaults = LYT_HTTP_ADAPTER_DEFAULTS[mode];

  if (!configService) {
    return defaults;
  }

  const prefix = `lyt.adapters.${mode}`;

  return {
    baseUrl: pickString(configService.get(`${prefix}.baseUrl`), defaults.baseUrl),
    signingSecret: pickString(configService.get(`${prefix}.signingSecret`), defaults.signingSecret),
    timeoutMs: pickNumber(configService.get(`${prefix}.timeoutMs`), defaults.timeoutMs),
    maxRetries: pickNumber(configService.get(`${prefix}.maxRetries`), defaults.maxRetries),
  };
}

/**
 * 解析 LYT 完整配置
 *
 * 从环境/配置中心读取所有 LYT 相关配置，无 ConfigService 时返回默认值。
 */
export function resolveLytFullConfig(
  mode: LytHttpAdapterMode,
  configService?: Pick<ConfigService, 'get'>,
): LytFullConfig {
  const defaults = LYT_FULL_CONFIG_DEFAULTS[mode];

  if (!configService) {
    return defaults;
  }

  const basePrefix = `lyt.${mode}`;

  return {
    endpoints: resolveFullConfigSection(configService, `${basePrefix}.endpoints`, defaults.endpoints),
    timeouts: resolveFullConfigSection(configService, `${basePrefix}.timeouts`, defaults.timeouts),
    retry: resolveFullConfigSection(configService, `${basePrefix}.retry`, defaults.retry),
    cert: resolveFullConfigSection(configService, `${basePrefix}.cert`, defaults.cert),
    signing: resolveFullConfigSection(configService, `${basePrefix}.signing`, defaults.signing),
    cache: resolveFullConfigSection(configService, `${basePrefix}.cache`, defaults.cache),
  };
}
