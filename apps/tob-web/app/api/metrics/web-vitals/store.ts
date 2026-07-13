export interface StoredWebVitalsEntry {
  id: string
  receivedAt: string
  payload: Record<string, unknown>
}

type MetricsStore = typeof globalThis & {
  __tobWebVitalsStore?: StoredWebVitalsEntry[]
}

export function getWebVitalsStore(): StoredWebVitalsEntry[] {
  const metricsStore = globalThis as MetricsStore
  if (!metricsStore.__tobWebVitalsStore) {
    metricsStore.__tobWebVitalsStore = []
  }
  return metricsStore.__tobWebVitalsStore
}

export function createWebVitalsEntry(payload: Record<string, unknown>): StoredWebVitalsEntry {
  return {
    id: `wv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    receivedAt: new Date().toISOString(),
    payload,
  }
}

export function resetWebVitalsStoreForTest(): void {
  const metricsStore = globalThis as MetricsStore
  metricsStore.__tobWebVitalsStore = []
}
