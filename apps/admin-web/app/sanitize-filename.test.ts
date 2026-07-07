import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { sanitizeFilename } from './components/sanitize-filename'

describe('sanitizeFilename', () => {
  test('keeps alphanumerics, underscores, and hyphens as-is', () => {
    assert.equal(sanitizeFilename('brands'), 'brands')
    assert.equal(sanitizeFilename('brand_123'), 'brand_123')
    assert.equal(sanitizeFilename('brand-abc-XYZ'), 'brand-abc-XYZ')
  })

  test('replaces non-safe characters with a single dash', () => {
    assert.equal(sanitizeFilename('brand 01'), 'brand-01')
    assert.equal(sanitizeFilename('brand.01'), 'brand-01')
    assert.equal(sanitizeFilename('brand/01'), 'brand-01')
    assert.equal(sanitizeFilename('brand\\01'), 'brand-01')
  })

  test('replaces each unsafe character independently (no collapsing)', () => {
    // We intentionally do NOT collapse runs so that "a   b" becomes
    // "a---b" rather than "a-b". The filename is only used as a
    // download token; users do not compare them.
    assert.equal(sanitizeFilename('a  b'), 'a--b')
    assert.equal(sanitizeFilename('a/./b'), 'a---b')
  })

  test('handles path traversal attempts', () => {
    assert.equal(sanitizeFilename('../../etc/passwd'), '------etc-passwd')
    assert.equal(sanitizeFilename('..\\..\\windows'), '------windows')
  })

  test('strips NUL and control bytes', () => {
    assert.equal(sanitizeFilename('brand\0name'), 'brand-name')
    assert.equal(sanitizeFilename('brand\nname'), 'brand-name')
  })

  test('returns an empty string for empty / non-safe input', () => {
    assert.equal(sanitizeFilename(''), '')
    assert.equal(sanitizeFilename('   '), '---')
    assert.equal(sanitizeFilename('///'), '---')
  })

  test('preserves Unicode characters', () => {
    // The implementation preserves CJK unified ideographs (\u4e00-\u9fff)
    // for Chinese filename compatibility on all major platforms.
    assert.equal(sanitizeFilename('品牌'), '品牌')
    assert.equal(sanitizeFilename('brand-品牌-1'), 'brand-品牌-1')
  })
})
