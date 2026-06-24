import type { ConfigService } from '@nestjs/config'

type LytHttpAdapterMode = 'sandbox' | 'real'

export interface LytHttpAdapterConfigSnapshot {
  baseUrl: string
  signingSecret: string
  timeoutMs: number
  maxRetries: number
}

const LYT_HTTP_ADAPTER_DEFAULTS: Record<LytHttpAdapterMode, LytHttpAdapterConfigSnapshot> = {
  sandbox: {
    baseUrl: 'https://sandbox.lyt.local',
    signingSecret: 'sandbox-lyt-secret',
    timeoutMs: 4000,
    maxRetries: 2
  },
  real: {
    baseUrl: 'https://api.lyt.local',
    signingSecret: 'real-lyt-secret',
    timeoutMs: 5000,
    maxRetries: 1
  }
}

function pickString(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback
}

function pickNumber(value: unknown, fallback: number) {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

export function resolveLytHttpAdapterConfig(
  mode: LytHttpAdapterMode,
  configService?: Pick<ConfigService, 'get'>
): LytHttpAdapterConfigSnapshot {
  const defaults = LYT_HTTP_ADAPTER_DEFAULTS[mode]

  if (!configService) {
    return defaults
  }

  const prefix = `lyt.adapters.${mode}`

  return {
    baseUrl: pickString(configService.get(`${prefix}.baseUrl`), defaults.baseUrl),
    signingSecret: pickString(configService.get(`${prefix}.signingSecret`), defaults.signingSecret),
    timeoutMs: pickNumber(configService.get(`${prefix}.timeoutMs`), defaults.timeoutMs),
    maxRetries: pickNumber(configService.get(`${prefix}.maxRetries`), defaults.maxRetries)
  }
}
