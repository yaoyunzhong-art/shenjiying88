import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { sanitizeFilename } from './components/sanitize-filename'

describe('sanitizeFilename', () => {
  // ---- 正例 ----
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
    assert.equal(sanitizeFilename('品牌'), '品牌')
    assert.equal(sanitizeFilename('brand-品牌-1'), 'brand-品牌-1')
  })

  // ---- 反例 ----
  test('rejects tab characters', () => {
    assert.equal(sanitizeFilename('brand\tname'), 'brand-name')
  })

  test('rejects carriage return characters', () => {
    assert.equal(sanitizeFilename('brand\rname'), 'brand-name')
  })

  test('rejects mixed path traversal with dots and slashes', () => {
    const result = sanitizeFilename('..\\..\\..\\secret.txt')
    // All backslashes and dots replaced with '-', preserves alphanumeric + dot in 'txt'
    assert.ok(!result.includes('/'), '不应包含斜线')
    assert.ok(!result.includes('\\'), '不应包含反斜线')
    assert.ok(result.includes('secret'), '应保留 secret')
    assert.ok(result.includes('txt'), '应保留 txt')
  })

  test('handles all-unsafe input with no safe chars', () => {
    assert.equal(sanitizeFilename('!@#$%^&*()'), '----------')
    assert.equal(sanitizeFilename('~`+=[]{}|;:\'",.<>?'), '------------------')
  })

  test('handles strings that start and end with unsafe chars', () => {
    assert.equal(sanitizeFilename(' brand '), '-brand-')
    assert.equal(sanitizeFilename('.brand.'), '-brand-')
  })

  // ---- 边界 ----
  test('handles extremely long input without throwing', () => {
    const long = 'a'.repeat(1000)
    assert.equal(sanitizeFilename(long), long)
  })

  test('handles long input with unsafe chars interspersed', () => {
    const long = 'a/' .repeat(500).slice(0, -1) // 'a/a/a/...'
    const result = sanitizeFilename(long)
    assert.ok(result.length <= long.length)
    assert.ok(!result.includes('/'))
  })

  test('preserves CJK mixed with English and numbers', () => {
    assert.equal(sanitizeFilename('文件01'), '文件01')
    assert.equal(sanitizeFilename('测试报告-final'), '测试报告-final')
    assert.equal(sanitizeFilename('测试 报告'), '测试-报告')
  })

  test('handles single character inputs', () => {
    assert.equal(sanitizeFilename('a'), 'a')
    assert.equal(sanitizeFilename('.'), '-')
    assert.equal(sanitizeFilename('/'), '-')
  })

  test('handles null-like edge cases without crashing', () => {
    assert.equal(sanitizeFilename('null'), 'null')
    assert.equal(sanitizeFilename('undefined'), 'undefined')
  })

  test('preserves underscore and hyphen dominance over unsafe chars', () => {
    assert.equal(sanitizeFilename('a_b-c'), 'a_b-c')
    assert.equal(sanitizeFilename('a b-c'), 'a-b-c')
    assert.equal(sanitizeFilename('a_b c'), 'a_b-c')
  })

  test('handles multiple consecutive control characters', () => {
    assert.equal(sanitizeFilename('\0\0\0'), '---')
    assert.equal(sanitizeFilename('\n\n\n'), '---')
  })
})
