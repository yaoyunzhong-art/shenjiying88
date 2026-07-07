/**
 * License UI 工具函数 (V9 需求 2 · V10 Day 19 Phase 88)
 *
 * 付费授权模块工具函数
 */
import type { License } from './types'

export function formatLicenseDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export function formatLicenseStatus(status: string): string {
  const map: Record<string, string> = {
    active: '已激活',
    suspended: '已暂停',
    expired: '已过期',
    trial: '试用中',
  }
  return map[status] ?? status
}

export function calculateRemainingDays(license: License): number {
  const now = Date.now()
  const until = new Date(license.validUntil).getTime()
  return Math.max(0, Math.ceil((until - now) / 86400000))
}

export function isLicenseExpired(license: License): boolean {
  return new Date(license.validUntil).getTime() < Date.now()
}

export function isLicenseValid(license: License): boolean {
  return !isLicenseExpired(license) && license.status !== 'suspended'
}
