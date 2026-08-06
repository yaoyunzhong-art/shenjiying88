/**
 * 共享 API 客户端 — 统一超时 + 错误处理
 *
 * 为所有 admin-web data 文件提供带超时保护的 fetch 包装。
 * 使用方式: import { apiFetch, apiFetchJson } from '../api/_client'
 */

const DEFAULT_TIMEOUT_MS = 30_000

export interface ApiResult<T = unknown> {
  success: boolean
  data: T
  message: string
  timestamp?: string
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly cause?: unknown
  ) {
    super(message)
    this.name = 'ApiClientError'
  }
}

export function unwrapApiPayload<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'success' in payload && 'data' in payload) {
    const wrapped = payload as { success?: boolean; data?: T; message?: string }
    if (!wrapped.success) {
      throw new ApiClientError(wrapped.message ?? 'API error')
    }
    return wrapped.data as T
  }
  return payload as T
}

/**
 * 带超时的 fetch 包装。
 * 超时或网络错误统一抛出 ApiClientError，方便上层 catch 后走 fallback。
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    })
    return response
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiClientError(`请求超时 (${timeoutMs}ms)`, undefined, error)
    }
    throw new ApiClientError(
      error instanceof Error ? error.message : '网络请求失败',
      undefined,
      error
    )
  } finally {
    clearTimeout(timer)
  }
}

/**
 * 带超时的 fetch + JSON 解析 + ApiResult 解包。
 * 最常用的便捷方法。
 */
export async function apiFetchJson<T>(
  input: RequestInfo | URL,
  init: RequestInit = {},
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const response = await apiFetch(input, init, timeoutMs)

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { message?: string }
    throw new ApiClientError(
      payload.message ?? `upstream failed: ${response.status}`,
      response.status
    )
  }

  const payload = await response.json()
  return unwrapApiPayload<T>(payload)
}
