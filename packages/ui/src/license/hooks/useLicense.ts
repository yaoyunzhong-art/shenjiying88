/**
 * useLicense Hook (V9 需求 2 · V10 Day 19 Phase 88)
 *
 * 付费授权状态管理 Hook
 * - 授权状态查询
 * - 激活码激活
 * - 自动刷新
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import type {
  License,
  LicenseCheckResult,
  LicenseQuota,
  LicenseStatus,
  LicenseScope,
  ActivationResult,
  UseLicenseOptions,
  UseLicenseReturn,
} from '../types'
import {
  checkLicense as checkLicenseAPI,
  activateLicense as activateLicenseAPI,
} from '../api/license-api'

// 默认配置
const DEFAULT_OPTIONS: Partial<UseLicenseOptions> = {
  autoCheck: true,
}

// 缓存时间 (5分钟)
const CACHE_TTL = 5 * 60 * 1000

interface CacheEntry {
  result: LicenseCheckResult
  timestamp: number
}

// 简单的内存缓存
const checkCache = new Map<string, CacheEntry>()

/**
 * License 状态管理 Hook
 */
export function useLicense(
  options: UseLicenseOptions,
): UseLicenseReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  // State
  const [license, setLicense] = useState<License | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const [isValid, setIsValid] = useState<boolean>(false)
  const [status, setStatus] = useState<LicenseStatus | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [quota, setQuota] = useState<LicenseQuota | null>(null)

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef<boolean>(true)

  // 生成缓存key
  const getCacheKey = useCallback((): string => {
    return `${opts.scope}:${opts.storeId || 'tenant'}`
  }, [opts.scope, opts.storeId])

  // 检查缓存
  const getCachedResult = useCallback((): LicenseCheckResult | null => {
    const key = getCacheKey()
    const cached = checkCache.get(key)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.result
    }
    return null
  }, [getCacheKey])

  // 更新缓存
  const setCachedResult = useCallback((result: LicenseCheckResult): void => {
    const key = getCacheKey()
    checkCache.set(key, { result, timestamp: Date.now() })
  }, [getCacheKey])

  // 更新状态
  const updateStateFromResult = useCallback((result: LicenseCheckResult): void => {
    if (!isMountedRef.current) return

    setIsValid(result.valid)
    setStatus(result.status)
    setExpiresAt(result.expiresAt || null)
    setQuota(result.quota || null)

    // 构造 License 对象
    if (result.valid) {
      const mockLicense: License = {
        id: `lic-${Date.now()}`,
        tenantId: 'current-tenant',
        scope: opts.scope,
        level: opts.storeId ? 'store' : 'tenant',
        status: result.status,
        validFrom: new Date().toISOString(),
        validUntil: result.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        storeId: opts.storeId,
      }
      setLicense(mockLicense)
    } else {
      setLicense(null)
    }
  }, [opts.scope, opts.storeId])

  // 清除错误
  const clearError = useCallback((): void => {
    setError(null)
  }, [])

  // 检查授权
  const checkLicense = useCallback(async (): Promise<LicenseCheckResult> => {
    // 取消之前的请求
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setIsLoading(true)
    setError(null)

    try {
      // 先检查缓存
      const cached = getCachedResult()
      if (cached) {
        updateStateFromResult(cached)
        setIsLoading(false)
        return cached
      }

      // 调用 API
      const result = await checkLicenseAPI(opts.scope, opts.storeId)

      if (!isMountedRef.current) {
        return result
      }

      // 更新缓存
      setCachedResult(result)

      // 更新状态
      updateStateFromResult(result)

      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))

      if (!isMountedRef.current) {
        throw error
      }

      setError(error)
      setIsValid(false)
      setStatus('expired')

      throw error
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [opts.scope, opts.storeId, getCachedResult, setCachedResult, updateStateFromResult])

  // 激活授权
  const activateLicense = useCallback(
    async (code: string): Promise<ActivationResult> => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await activateLicenseAPI(code, opts.scope, opts.storeId)

        if (!isMountedRef.current) {
          return result
        }

        // 激活成功后刷新授权状态
        if (result.success) {
          await checkLicense()
        }

        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))

        if (!isMountedRef.current) {
          throw error
        }

        setError(error)
        throw error
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false)
        }
      }
    },
    [opts.scope, opts.storeId, checkLicense],
  )

  // 刷新授权
  const refreshLicense = useCallback(async (): Promise<void> => {
    // 清除缓存
    const key = getCacheKey()
    checkCache.delete(key)

    // 重新检查
    await checkLicense()
  }, [getCacheKey, checkLicense])

  // 自动检查
  useEffect(() => {
    if (opts.autoCheck) {
      checkLicense().catch(() => {
        // 错误已在checkLicense中处理
      })
    }

    return () => {
      isMountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [opts.autoCheck, checkLicense])

  return {
    // State
    license,
    isLoading,
    error,
    isValid,
    status,
    expiresAt,
    quota,

    // Actions
    checkLicense,
    activateLicense,
    refreshLicense,
    clearError,
  }
}

// 导出 Hook 默认
export default useLicense
