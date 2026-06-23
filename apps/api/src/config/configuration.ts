function envString(value: string | undefined, fallback: string) {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback
}

function envNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

const DEFAULT_DATABASE_URL = 'postgresql://m5:m5_local_password@localhost:5432/m5_core'

export default () => {
  const databaseUrl = envString(process.env.DATABASE_URL, DEFAULT_DATABASE_URL)
  const parsedDatabase = parseDatabaseUrl(databaseUrl)

  return {
    app: {
      name: envString(process.env.APP_NAME, 'M5'),
      port: envNumber(process.env.API_PORT, 3001)
    },
    lyt: {
      mode: envString(process.env.LYT_MODE, 'mock'),
      defaultStoreId: envString(process.env.LYT_DEFAULT_STORE_ID, 'store-demo-001'),
      adapters: {
        sandbox: {
          baseUrl: envString(process.env.LYT_SANDBOX_BASE_URL, 'https://sandbox.lyt.local'),
          signingSecret: envString(process.env.LYT_SANDBOX_SIGNING_SECRET, 'sandbox-lyt-secret'),
          timeoutMs: envNumber(process.env.LYT_SANDBOX_TIMEOUT_MS, 4000),
          maxRetries: envNumber(process.env.LYT_SANDBOX_MAX_RETRIES, 2)
        },
        real: {
          baseUrl: envString(process.env.LYT_REAL_BASE_URL, 'https://api.lyt.local'),
          signingSecret: envString(process.env.LYT_REAL_SIGNING_SECRET, 'real-lyt-secret'),
          timeoutMs: envNumber(process.env.LYT_REAL_TIMEOUT_MS, 5000),
          maxRetries: envNumber(process.env.LYT_REAL_MAX_RETRIES, 1)
        }
      }
    },
    postgres: {
      databaseUrl,
      host: parsedDatabase.host,
      port: parsedDatabase.port,
      database: parsedDatabase.database
    }
  }
}

function parseDatabaseUrl(databaseUrl: string) {
  try {
    const parsed = new URL(databaseUrl)
    return {
      host: parsed.hostname || 'localhost',
      port: parsed.port ? Number(parsed.port) : 5432,
      database: parsed.pathname.replace(/^\//, '') || 'm5_core'
    }
  } catch {
    return {
      host: 'localhost',
      port: 5432,
      database: 'm5_core'
    }
  }
}
