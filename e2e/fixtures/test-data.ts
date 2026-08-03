/**
 * E2E测试数据
 * Sprint 2 Day 21
 */

export const TEST_USERS = {
  admin: {
    username: 'admin@example.com',
    password: 'Admin123!',
    role: 'admin',
  },
  tenant: {
    username: 'tenant@example.com',
    password: 'Tenant123!',
    role: 'tenant',
  },
  store: {
    username: 'store@example.com',
    password: 'Store123!',
    role: 'store',
  },
}

export const API_ENDPOINTS = {
  base: process.env.E2E_BASE_URL || 'http://localhost:3000',
  license: {
    check: '/api/license/check',
    activate: '/api/license/activate',
    list: '/api/license/list',
    suspend: '/api/license/suspend',
    renew: '/api/license/renew',
  },
}

export const TIMEOUTS = {
  short: 5000,
  medium: 10000,
  long: 30000,
  api: 15000,
}

export const TEST_LICENSES = {
  valid: {
    id: 'lic-valid-001',
    type: 'paid',
    status: 'active',
  },
  expired: {
    id: 'lic-expired-001',
    type: 'trial',
    status: 'expired',
  },
  suspended: {
    id: 'lic-suspended-001',
    type: 'paid',
    status: 'suspended',
  },
}

export const TEST_ACTIVATION_CODES = {
  valid: 'ABCD-EFGH-IJKL-MNOP',
  expired: 'WXYZ-1234-5678-9012',
  invalid: 'INVALID-CODE',
}

export const SELECTORS = {
  common: {
    toast: '[data-testid="toast-message"]',
    confirmButton: '[data-testid="confirm-btn"]',
    cancelButton: '[data-testid="cancel-btn"]',
  },
  license: {
    container: '[data-testid="license-container"]',
    checkButton: '[data-testid="license-check-btn"]',
    statusBadge: '[data-testid="license-status-badge"]',
    activateInput: '[data-testid="license-activate-input"]',
    activateButton: '[data-testid="license-activate-btn"]',
    tableRow: '[data-testid="license-table-row"]',
    viewToggle: '[data-testid="license-view-toggle"]',
    quotaProgress: '[data-testid="license-quota-progress"]',
  },
}
