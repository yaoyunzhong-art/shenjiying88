import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildProductEditSnapshot,
  diffProductEdit,
  saveProductEdit,
  type ProductEditInput
} from './storefront-product-edit';

const baseInput: ProductEditInput = {
  productId: 'prod-001',
  name: '智能咖啡机',
  description: '支持远程控制的智能咖啡机',
  priceCents: 49900,
  currency: 'CNY',
  status: 'DRAFT',
  tags: ['智能', '家居', '咖啡'],
  categoryId: 'cat-appliance',
  brandId: 'brand-001',
  inventory: {
    sku: 'SKU-COFFEE-001',
    quantity: 50,
    lowStockThreshold: 5
  }
};

test('view-model: buildProductEditSnapshot flags no issues for valid DRAFT', () => {
  const snap = buildProductEditSnapshot(baseInput, { dirty: true })
  assert.equal(snap.issues.length, 0)
  assert.equal(snap.canSubmitForReview, true)
  assert.equal(snap.canPublishDirectly, false)
  assert.equal(snap.dirty, true)
})

test('view-model: buildProductEditSnapshot surfaces priceCents=0 as warning', () => {
  const snap = buildProductEditSnapshot({ ...baseInput, priceCents: 0 })
  const warnings = snap.issues.filter((i) => i.severity === 'warning')
  assert.ok(warnings.some((w) => w.field === 'priceCents'), 'expected priceCents warning')
})

test('view-model: buildProductEditSnapshot blocks submit when name empty', () => {
  const snap = buildProductEditSnapshot({ ...baseInput, name: '' })
  const errors = snap.issues.filter((i) => i.severity === 'error')
  assert.ok(errors.some((e) => e.field === 'name'), 'expected name error')
  assert.equal(snap.canSubmitForReview, false)
  assert.equal(snap.canPublishDirectly, false)
})

test('view-model: buildProductEditSnapshot canPublishDirectly true with approval permission and DRAFT', () => {
  const snap = buildProductEditSnapshot(baseInput, { hasApprovalPermission: true })
  assert.equal(snap.canPublishDirectly, true)
})

test('view-model: buildProductEditSnapshot PUBLISHED product cannot submit again', () => {
  const snap = buildProductEditSnapshot({ ...baseInput, status: 'PUBLISHED' })
  assert.equal(snap.canSubmitForReview, false)
})

test('view-model: buildProductEditSnapshot rejects negative inventory', () => {
  const snap = buildProductEditSnapshot({ ...baseInput, inventory: { ...baseInput.inventory, quantity: -1 } })
  const errors = snap.issues.filter((i) => i.severity === 'error')
  assert.ok(errors.some((e) => e.field === 'inventory.quantity'), 'expected inventory.quantity error')
})

test('view-model: buildProductEditSnapshot rejects tag count over max', () => {
  const tooManyTags = Array.from({ length: 20 }, (_, i) => `tag-${i}`)
  const snap = buildProductEditSnapshot({ ...baseInput, tags: tooManyTags })
  const errors = snap.issues.filter((i) => i.severity === 'error')
  assert.ok(errors.some((e) => e.field === 'tags'), 'expected tags error')
})

test('view-model: diffProductEdit returns empty when identical', () => {
  const diffs = diffProductEdit(baseInput, baseInput)
  assert.equal(diffs.length, 0)
})

test('view-model: diffProductEdit detects priceCents change', () => {
  const updated = { ...baseInput, priceCents: 59900 }
  const diffs = diffProductEdit(baseInput, updated)
  assert.ok(diffs.some((d) => d.field === 'priceCents' && d.before === 49900 && d.after === 59900))
})

test('view-model: diffProductEdit detects inventory sku change', () => {
  const updated = { ...baseInput, inventory: { ...baseInput.inventory, sku: 'SKU-COFFEE-002' } }
  const diffs = diffProductEdit(baseInput, updated)
  assert.ok(diffs.some((d) => d.field === 'inventory.sku'))
})

test('view-model: diffProductEdit detects tag list mutation', () => {
  const updated = { ...baseInput, tags: ['智能', '家居'] }
  const diffs = diffProductEdit(baseInput, updated)
  assert.ok(diffs.some((d) => d.field === 'tags'))
})

test('view-model: saveProductEdit with action=submit transitions to PENDING_REVIEW', async () => {
  const result = await saveProductEdit(baseInput, { action: 'submit' })
  assert.equal(result.status, 'submitted')
  assert.equal(result.newStatus, 'PENDING_REVIEW')
})

test('view-model: saveProductEdit with action=publish without permission stays DRAFT', async () => {
  const result = await saveProductEdit(baseInput, { action: 'publish' })
  assert.equal(result.status, 'saved')
  assert.equal(result.newStatus, 'DRAFT')
})

test('view-model: saveProductEdit with action=publish and permission transitions to PUBLISHED', async () => {
  const result = await saveProductEdit(baseInput, { action: 'publish', hasApprovalPermission: true })
  assert.equal(result.status, 'published')
  assert.equal(result.newStatus, 'PUBLISHED')
})

test('view-model: saveProductEdit with action=archive transitions to ARCHIVED', async () => {
  const result = await saveProductEdit({ ...baseInput, status: 'PUBLISHED' }, { action: 'archive' })
  assert.equal(result.status, 'archived')
  assert.equal(result.newStatus, 'ARCHIVED')
})

test('view-model: saveProductEdit returns issues when name empty (blocks non-archive actions)', async () => {
  const result = await saveProductEdit({ ...baseInput, name: '' }, { action: 'submit' })
  assert.equal(result.issues.some((i) => i.severity === 'error' && i.field === 'name'), true)
})

// ── 附加边界覆盖 ──

test('view-model: buildProductEditSnapshot rejects negative priceCents', () => {
  const snap = buildProductEditSnapshot({ ...baseInput, priceCents: -100 })
  const errors = snap.issues.filter((i) => i.severity === 'error')
  assert.ok(errors.some((e) => e.field === 'priceCents'), 'expected priceCents error')
  assert.equal(snap.canSubmitForReview, false)
})

test('view-model: buildProductEditSnapshot warns empty categoryId as error', () => {
  const snap = buildProductEditSnapshot({ ...baseInput, categoryId: '' })
  const errors = snap.issues.filter((i) => i.severity === 'error')
  assert.ok(errors.some((e) => e.field === 'categoryId'), 'expected categoryId error')
})

test('view-model: buildProductEditSnapshot warns long name as error', () => {
  const longName = '超'.repeat(81)
  const snap = buildProductEditSnapshot({ ...baseInput, name: longName })
  const errors = snap.issues.filter((i) => i.severity === 'error')
  assert.ok(errors.some((e) => e.field === 'name'), 'expected name length error')
})

test('view-model: buildProductEditSnapshot warns long description as error', () => {
  const longDesc = '长'.repeat(2001)
  const snap = buildProductEditSnapshot({ ...baseInput, description: longDesc })
  const errors = snap.issues.filter((i) => i.severity === 'error')
  assert.ok(errors.some((e) => e.field === 'description'), 'expected description length error')
})

test('view-model: buildProductEditSnapshot rejects price over max', () => {
  const snap = buildProductEditSnapshot({ ...baseInput, priceCents: 100_000_000 })
  const errors = snap.issues.filter((i) => i.severity === 'error')
  assert.ok(errors.some((e) => e.field === 'priceCents'), 'expected priceCents over max error')
})

test('view-model: buildProductEditSnapshot rejects empty SKU', () => {
  const snap = buildProductEditSnapshot({ ...baseInput, inventory: { ...baseInput.inventory, sku: '' } })
  const errors = snap.issues.filter((i) => i.severity === 'error')
  assert.ok(errors.some((e) => e.field === 'inventory.sku'), 'expected sku error')
})

test('view-model: buildProductEditSnapshot rejects negative lowStockThreshold', () => {
  const snap = buildProductEditSnapshot({ ...baseInput, inventory: { ...baseInput.inventory, lowStockThreshold: -1 } })
  const errors = snap.issues.filter((i) => i.severity === 'error')
  assert.ok(errors.some((e) => e.field === 'inventory.lowStockThreshold'), 'expected lowStockThreshold error')
})

test('view-model: buildProductEditSnapshot empty name shows proper canSubmit state', () => {
  const snap = buildProductEditSnapshot({ ...baseInput, name: '   ' })
  assert.equal(snap.canSubmitForReview, false)
  assert.equal(snap.canPublishDirectly, false)
})

test('view-model: buildProductEditSnapshot empty tags with whitespace only category', () => {
  const snap = buildProductEditSnapshot({ ...baseInput, categoryId: '   ' })
  // non-empty string, so no categoryId error despite being whitespace
  // but logically a store should handle; this documents current behavior
  const catErrors = snap.issues.filter((i) => i.field === 'categoryId')
  assert.equal(catErrors.length, 0)
})

test('view-model: diffProductEdit detects inventory.quantity change', () => {
  const updated = { ...baseInput, inventory: { ...baseInput.inventory, quantity: 100 } }
  const diffs = diffProductEdit(baseInput, updated)
  assert.ok(diffs.some((d) => d.field === 'inventory.quantity'))
})

test('view-model: diffProductEdit detects inventory.lowStockThreshold change', () => {
  const updated = { ...baseInput, inventory: { ...baseInput.inventory, lowStockThreshold: 10 } }
  const diffs = diffProductEdit(baseInput, updated)
  assert.ok(diffs.some((d) => d.field === 'inventory.lowStockThreshold'))
})

test('view-model: diffProductEdit detects status change', () => {
  const updated = { ...baseInput, status: 'PENDING_REVIEW' as const }
  const diffs = diffProductEdit(baseInput, updated)
  assert.ok(diffs.some((d) => d.field === 'status'))
})

test('view-model: diffProductEdit detects brandId change', () => {
  const updated = { ...baseInput, brandId: 'brand-002' }
  const diffs = diffProductEdit(baseInput, updated)
  assert.ok(diffs.some((d) => d.field === 'brandId'))
})

test('view-model: saveProductEdit action=archive bypasses validation errors', async () => {
  const result = await saveProductEdit({ ...baseInput, name: '', priceCents: -1 }, { action: 'archive' })
  assert.equal(result.status, 'archived')
  assert.equal(result.newStatus, 'ARCHIVED')
})
