/**
 * License API Client (V9 需求 2 · V10 Day 19 Phase 88)
 *
 * 付费授权模块 API 客户端
 * - 授权检查
 * - 授权列表查询
 * - 激活码激活
 * - 管理操作
 */

import type {
  License,
  LicenseCheckResult,
  LicenseListResponse,
  ActivationResult,
  GenerateCodeInput,
  GenerateCodeResult,
  VerifyCodeResult,
  LicenseAuditLog,
  BulkSuspendResult,
  AdminStats,
} from '../types'

// API 基础配置
const API_BASE = '/api'

// HTTP 请求工具
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  return response.json()
}

// ===== License Check API =====

/**
 * 检查授权状态
 * @param scope 授权范围
 * @param storeId 门店ID (可选)
 */
export async function checkLicense(
  scope: string,
  storeId?: string,
): Promise<LicenseCheckResult> {
  const params = new URLSearchParams({ scope })
  if (storeId) params.append('storeId', storeId)

  return request<LicenseCheckResult>(`/license/check?${params}`)
}

// ===== License List API =====

/**
 * 获取租户授权列表
 */
export async function listTenantLicenses(): Promise<LicenseListResponse> {
  return request<LicenseListResponse>('/license/tenant')
}

/**
 * 获取门店授权列表
 * @param storeId 门店ID
 */
export async function listStoreLicenses(
  storeId: string,
): Promise<LicenseListResponse> {
  return request<LicenseListResponse>(`/license/store?storeId=${storeId}`)
}

/**
 * 获取授权审计日志
 * @param limit 记录数量限制
 */
export async function listAuditLogs(
  limit?: number,
): Promise<{ data: LicenseAuditLog[]; total: number }> {
  const params = limit ? `?limit=${limit}` : ''
  return request<{ data: LicenseAuditLog[]; total: number }>(`/license/audit${params}`)
}

// ===== License Management API =====

/**
 * 暂停授权
 * @param id 授权ID
 * @param reason 暂停原因
 */
export async function suspendLicense(
  id: string,
  reason: string,
): Promise<License> {
  return request<License>(`/license/${id}/suspend`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  })
}

// ===== Activation Code API =====

/**
 * 使用激活码激活授权
 * @param code 激活码
 * @param scope 授权范围
 * @param storeId 门店ID (可选)
 */
export async function activateLicense(
  code: string,
  scope: string,
  storeId?: string,
): Promise<ActivationResult> {
  const body: { code: string; scope: string; storeId?: string } = { code, scope }
  if (storeId) body.storeId = storeId

  return request<ActivationResult>('/license/activate', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/**
 * 生成激活码 (Admin only)
 * @param input 生成参数
 */
export async function generateActivationCode(
  input: GenerateCodeInput,
): Promise<GenerateCodeResult> {
  return request<GenerateCodeResult>('/license/codes/generate', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

/**
 * 验证激活码格式
 * @param code 激活码
 * @param scope 授权范围
 */
export async function verifyActivationCode(
  code: string,
  scope: string,
): Promise<VerifyCodeResult> {
  return request<VerifyCodeResult>(`/license/codes/${code}/verify?scope=${scope}`)
}

// ===== Admin API =====

/**
 * 获取管理员统计数据
 */
export async function getAdminStats(): Promise<AdminStats> {
  return request<AdminStats>('/license/admin/stats')
}

/**
 * 批量暂停授权
 * @param ids 授权ID列表
 * @param reason 暂停原因
 */
export async function bulkSuspendLicenses(
  ids: string[],
  reason: string,
): Promise<BulkSuspendResult> {
  return request<BulkSuspendResult>('/license/admin/bulk-suspend', {
    method: 'POST',
    body: JSON.stringify({ ids, reason }),
  })
}

// Export all API functions
export const LicenseAPI = {
  // Check
  checkLicense,

  // List
  listTenantLicenses,
  listStoreLicenses,
  listAuditLogs,

  // Management
  suspendLicense,

  // Activation Code
  activateLicense,
  generateActivationCode,
  verifyActivationCode,

  // Admin
  getAdminStats,
  bulkSuspendLicenses,
}

export default LicenseAPI
