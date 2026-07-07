
const React = require('react');
const { useState, useCallback } = React;
exports.useLicense = function(opts) {
  return {
    license: {
      id: 'lic-001',
      tenantId: 'tenant-001',
      scope: 'ai.capability',
      level: 'tenant',
      status: 'active',
      quota: { used: 100, total: 1000 },
      validFrom: new Date(Date.now() - 30 * 86400000).toISOString(),
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    status: 'active',
    isLoading: false,
    error: null,
    isValid: true,
    expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    quota: { used: 100, total: 1000 },
    checkLicense: async () => ({ valid: true, status: 'active', scope: 'ai.capability' }),
    activateLicense: async (code) => ({ success: true, licenseId: 'lic-001', message: '激活成功' }),
    refreshLicense: async () => {},
    clearError: () => {},
  };
};
