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
