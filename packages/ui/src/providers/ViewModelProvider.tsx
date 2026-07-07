'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

/**
 * Phase-34: ViewModelProvider (前端三层防御的最外层)
 *
 * 设计:
 * - React Context 注入 tenantId + userId
 * - useViewModel() / useTenantId() / useUserId() 三个 hook
 * - setTenantId 切换租户时, 触发 re-render, 自动失效旧 view-model 数据
 * - 未包裹 Provider 时抛错 (防绕过)
 *
 * data-testid:
 * - view-model-provider
 * - tenant-id-display
 * - user-id-display
 */

export interface ViewModel {
  tenantId: string
  userId: string
}

export interface ViewModelContextValue extends ViewModel {
  setTenantId: (tenantId: string) => void
  setUserId: (userId: string) => void
}

const ViewModelContext = createContext<ViewModelContextValue | null>(null)

export interface ViewModelProviderProps {
  initialTenantId: string
  initialUserId: string
  children: React.ReactNode
}

export function ViewModelProvider({
  initialTenantId,
  initialUserId,
  children
}: ViewModelProviderProps) {
  const [tenantId, setTenantIdState] = useState(initialTenantId)
  const [userId, setUserIdState] = useState(initialUserId)

  const setTenantId = useCallback((newTenantId: string) => {
    setTenantIdState(newTenantId)
  }, [])

  const setUserId = useCallback((newUserId: string) => {
    setUserIdState(newUserId)
  }, [])

  const value = useMemo(
    () => ({ tenantId, userId, setTenantId, setUserId }),
    [tenantId, userId, setTenantId, setUserId]
  )

  return (
    <ViewModelContext.Provider value={value}>
      <span data-testid="view-model-provider" data-tenant-id={tenantId} data-user-id={userId} style={{ display: 'contents' }}>
        {children}
      </span>
    </ViewModelContext.Provider>
  )
}

export function useViewModel(): ViewModelContextValue {
  const ctx = useContext(ViewModelContext)
  if (!ctx) {
    throw new Error('useViewModel must be used within ViewModelProvider')
  }
  return ctx
}

export function useTenantId(): string {
  return useViewModel().tenantId
}

export function useUserId(): string {
  return useViewModel().userId
}

export default ViewModelProvider;