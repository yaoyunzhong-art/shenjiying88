import 'reflect-metadata'
import assert from 'node:assert/strict'
import test from 'node:test'
import { validateSync } from 'class-validator'
import {
  ConfigurationScopeDto,
  FeatureFlagQueryDto,
  RotateSecretDto,
  ConfigEntryQueryDto,
  CertificateQueryDto,
  UpsertConfigEntryDto,
  PersistFeatureFlagDto,
  RegisterSecretDto
} from './configuration-governance.dto'

// ── ConfigurationScopeDto ────────────────────────────────────────
test('ConfigurationScopeDto accepts all optional scope fields', () => {
  const dto = Object.assign(new ConfigurationScopeDto(), {
    tenantId: 't-001',
    brandId: 'b-001',
    storeId: 's-001',
    marketCode: 'CN'
  })
  assert.equal(validateSync(dto).length, 0)
})

test('ConfigurationScopeDto accepts empty payload (all fields optional)', () => {
  const dto = Object.assign(new ConfigurationScopeDto(), {})
  assert.equal(validateSync(dto).length, 0)
})

// ── FeatureFlagQueryDto ─────────────────────────────────────────
test('FeatureFlagQueryDto accepts optional subjectKey', () => {
  const dto = Object.assign(new FeatureFlagQueryDto(), {
    tenantId: 't-001',
    subjectKey: 'order-001'
  })
  assert.equal(validateSync(dto).length, 0)
})

test('FeatureFlagQueryDto accepts empty payload', () => {
  const dto = Object.assign(new FeatureFlagQueryDto(), {})
  assert.equal(validateSync(dto).length, 0)
})

// ── RotateSecretDto ─────────────────────────────────────────────
test('RotateSecretDto accepts valid approval values', () => {
  const dto = Object.assign(new RotateSecretDto(), {
    rotatedBy: 'user-001',
    approvalStatus: 'APPROVED'
  })
  assert.equal(validateSync(dto).length, 0)
})

test('RotateSecretDto rejects invalid approvalStatus', () => {
  const dto = Object.assign(new RotateSecretDto(), {
    approvalStatus: 'INVALID_STATUS'
  })
  const errors = validateSync(dto)
  assert.equal(errors.length > 0, true)
  assert.equal(errors[0].property, 'approvalStatus')
})

// ── ConfigEntryQueryDto ─────────────────────────────────────────
test('ConfigEntryQueryDto accepts namespace and key filters', () => {
  const dto = Object.assign(new ConfigEntryQueryDto(), {
    namespace: 'feature',
    key: 'dark-mode'
  })
  assert.equal(validateSync(dto).length, 0)
})

// ── CertificateQueryDto ─────────────────────────────────────────
test('CertificateQueryDto accepts valid status filter', () => {
  const dto = Object.assign(new CertificateQueryDto(), {
    name: 'ssl-cert',
    status: 'active',
    expiringWithinDays: 30
  })
  assert.equal(validateSync(dto).length, 0)
})

test('CertificateQueryDto rejects out-of-range expiringWithinDays', () => {
  const dto = Object.assign(new CertificateQueryDto(), {
    expiringWithinDays: 0
  })
  const errors = validateSync(dto)
  assert.equal(errors.length > 0, true)
  assert.equal(errors[0].property, 'expiringWithinDays')
})

test('CertificateQueryDto rejects invalid status value', () => {
  const dto = Object.assign(new CertificateQueryDto(), {
    status: 'unknown'
  })
  const errors = validateSync(dto)
  assert.equal(errors.length > 0, true)
  assert.equal(errors[0].property, 'status')
})

// ── UpsertConfigEntryDto ────────────────────────────────────────
test('UpsertConfigEntryDto accepts valid config entry', () => {
  const dto = Object.assign(new UpsertConfigEntryDto(), {
    namespace: 'feature',
    key: 'dark-mode',
    valueType: 'BOOLEAN',
    scopeType: 'PLATFORM',
    value: true,
    tags: ['ui', 'a11y'],
    status: 'ACTIVE',
    changedBy: 'admin',
    changeReason: 'Enable dark mode for all'
  })
  assert.equal(validateSync(dto).length, 0)
})

test('UpsertConfigEntryDto rejects missing required fields', () => {
  const dto = Object.assign(new UpsertConfigEntryDto(), {})
  const errors = validateSync(dto)
  assert.equal(errors.length > 0, true)
  const props = errors.map((e) => e.property)
  assert.equal(props.includes('namespace'), true)
  assert.equal(props.includes('key'), true)
  assert.equal(props.includes('valueType'), true)
  assert.equal(props.includes('scopeType'), true)
  assert.equal(props.includes('value'), true)
})

test('UpsertConfigEntryDto rejects invalid valueType', () => {
  const dto = Object.assign(new UpsertConfigEntryDto(), {
    namespace: 'test',
    key: 'k',
    valueType: 'BINARY',
    scopeType: 'PLATFORM',
    value: 1
  })
  const errors = validateSync(dto)
  assert.equal(errors.length > 0, true)
  assert.equal(errors[0].property, 'valueType')
})

test('UpsertConfigEntryDto rejects invalid scopeType', () => {
  const dto = Object.assign(new UpsertConfigEntryDto(), {
    namespace: 'test',
    key: 'k',
    valueType: 'STRING',
    scopeType: 'UNKNOWN',
    value: 1
  })
  const errors = validateSync(dto)
  assert.equal(errors.length > 0, true)
  assert.equal(errors[0].property, 'scopeType')
})

test('UpsertConfigEntryDto rejects tags exceeding max size', () => {
  const dto = Object.assign(new UpsertConfigEntryDto(), {
    namespace: 'test',
    key: 'k',
    valueType: 'STRING',
    scopeType: 'PLATFORM',
    value: 1,
    tags: Array.from({ length: 25 }, (_, i) => `tag-${i}`)
  })
  const errors = validateSync(dto)
  assert.equal(errors.length > 0, true)
})

// ── PersistFeatureFlagDto ───────────────────────────────────────
test('PersistFeatureFlagDto accepts valid feature flag', () => {
  const dto = Object.assign(new PersistFeatureFlagDto(), {
    key: 'dark-mode',
    name: 'Dark Mode',
    scopeType: 'PLATFORM',
    status: 'DRAFT',
    strategy: 'ALL',
    enabled: true,
    description: 'Enable dark mode for all users'
  })
  assert.equal(validateSync(dto).length, 0)
})

test('PersistFeatureFlagDto rejects missing required fields', () => {
  const dto = Object.assign(new PersistFeatureFlagDto(), {})
  const errors = validateSync(dto)
  assert.equal(errors.length > 0, true)
  const props = errors.map((e) => e.property)
  assert.equal(props.includes('key'), true)
  assert.equal(props.includes('name'), true)
  assert.equal(props.includes('scopeType'), true)
  assert.equal(props.includes('status'), true)
  assert.equal(props.includes('strategy'), true)
  assert.equal(props.includes('enabled'), true)
})

test('PersistFeatureFlagDto rejects invalid strategy', () => {
  const dto = Object.assign(new PersistFeatureFlagDto(), {
    key: 'k',
    name: 'n',
    scopeType: 'PLATFORM',
    status: 'ACTIVE',
    strategy: 'INVALID',
    enabled: true
  })
  const errors = validateSync(dto)
  assert.equal(errors.length > 0, true)
})

test('PersistFeatureFlagDto rejects percentage out of range', () => {
  const dto = Object.assign(new PersistFeatureFlagDto(), {
    key: 'k',
    name: 'n',
    scopeType: 'PLATFORM',
    status: 'ACTIVE',
    strategy: 'PERCENTAGE',
    enabled: true,
    percentage: 150
  })
  const errors = validateSync(dto)
  assert.equal(errors.length > 0, true)
})

test('PersistFeatureFlagDto accepts valid PERCENTAGE strategy', () => {
  const dto = Object.assign(new PersistFeatureFlagDto(), {
    key: 'k',
    name: 'n',
    scopeType: 'PLATFORM',
    status: 'ACTIVE',
    strategy: 'PERCENTAGE',
    enabled: true,
    percentage: 50
  })
  assert.equal(validateSync(dto).length, 0)
})

test('PersistFeatureFlagDto accepts ALLOW_LIST strategy with allowList', () => {
  const dto = Object.assign(new PersistFeatureFlagDto(), {
    key: 'k',
    name: 'n',
    scopeType: 'TENANT',
    status: 'ACTIVE',
    strategy: 'ALLOW_LIST',
    enabled: true,
    allowList: ['tenant-a', 'tenant-b']
  })
  assert.equal(validateSync(dto).length, 0)
})

// ── RegisterSecretDto ───────────────────────────────────────────
test('RegisterSecretDto accepts valid secret registration', () => {
  const dto = Object.assign(new RegisterSecretDto(), {
    key: 'integration-api-key',
    type: 'api-key',
    scopeType: 'PLATFORM',
    provider: 'VAULT',
    consumers: ['integration-app-001'],
    expiresAt: '2027-01-01T00:00:00Z'
  })
  assert.equal(validateSync(dto).length, 0)
})

test('RegisterSecretDto rejects missing required fields', () => {
  const dto = Object.assign(new RegisterSecretDto(), {})
  const errors = validateSync(dto)
  assert.equal(errors.length > 0, true)
  const props = errors.map((e) => e.property)
  assert.equal(props.includes('key'), true)
  assert.equal(props.includes('type'), true)
  assert.equal(props.includes('scopeType'), true)
})

test('RegisterSecretDto rejects invalid secret type', () => {
  const dto = Object.assign(new RegisterSecretDto(), {
    key: 'k',
    type: 'password',
    scopeType: 'PLATFORM'
  })
  const errors = validateSync(dto)
  assert.equal(errors.length > 0, true)
})
