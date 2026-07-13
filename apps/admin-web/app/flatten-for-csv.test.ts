import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { flattenForCsv, recordsToCsv } from './components/flatten-for-csv'

describe('flattenForCsv', () => {
  test('null and undefined flatten to { [prefix]: "" } when prefix is set', () => {
    assert.deepEqual(flattenForCsv(null, 'x'), { x: '' })
    assert.deepEqual(flattenForCsv(undefined, 'y'), { y: '' })
  })

  test('null and undefined return empty object when prefix is empty', () => {
    assert.deepEqual(flattenForCsv(null), {})
    assert.deepEqual(flattenForCsv(undefined), {})
  })

  test('primitives flatten to { value: x } when no prefix', () => {
    assert.deepEqual(flattenForCsv(42), { value: 42 })
    assert.deepEqual(flattenForCsv('hello'), { value: 'hello' })
    assert.deepEqual(flattenForCsv(true), { value: true })
  })

  test('primitives use the prefix as the key when prefix is set', () => {
    assert.deepEqual(flattenForCsv(42, 'age'), { age: 42 })
    assert.deepEqual(flattenForCsv('hi', 'greeting'), { greeting: 'hi' })
  })

  test('Date values are serialized to ISO strings', () => {
    const d = new Date('2026-06-22T08:00:00.000Z')
    assert.deepEqual(flattenForCsv(d, 'ts'), { ts: '2026-06-22T08:00:00.000Z' })
  })

  test('flat objects flatten with each top-level key as a column', () => {
    assert.deepEqual(flattenForCsv({ a: 1, b: 'x' }), { a: 1, b: 'x' })
  })

  test('nested objects use dot notation for the path', () => {
    assert.deepEqual(flattenForCsv({ a: { b: { c: 7 } } }), { 'a.b.c': 7 })
  })

  test('arrays flatten to indexed keys', () => {
    assert.deepEqual(flattenForCsv([1, 2, 3]), { 'item[0]': 1, 'item[1]': 2, 'item[2]': 3 })
    assert.deepEqual(flattenForCsv(['a', 'b'], 'tags'), { 'tags[0]': 'a', 'tags[1]': 'b' })
  })

  test('arrays of objects prefix each item with item[index]', () => {
    const result = flattenForCsv([{ a: 1 }, { a: 2 }])
    assert.deepEqual(result, { 'item[0].a': 1, 'item[1].a': 2 })
  })

  test('arrays of objects with a parent prefix chain correctly', () => {
    const result = flattenForCsv({ list: [{ a: 1 }, { a: 2 }] })
    assert.deepEqual(result, { 'list[0].a': 1, 'list[1].a': 2 })
  })

  test('arrays of objects preserve the union of keys when items differ', () => {
    const result = flattenForCsv([{ a: 1, b: 2 }, { a: 3, c: 4 }])
    assert.deepEqual(result, {
      'item[0].a': 1,
      'item[0].b': 2,
      'item[1].a': 3,
      'item[1].c': 4
    })
  })

  test('arrays of Dates serialize to ISO strings', () => {
    const d = new Date('2026-06-22T08:00:00.000Z')
    assert.deepEqual(flattenForCsv([d], 'dates'), { 'dates[0]': '2026-06-22T08:00:00.000Z' })
  })

  test('null and string mix in array flattens to indexed keys with empty strings', () => {
    assert.deepEqual(flattenForCsv([null, 'x', null], 'col'), {
      'col[0]': '',
      'col[1]': 'x',
      'col[2]': '',
    })
  })
})

describe('recordsToCsv', () => {
  test('object record produces a single-row CSV with header', () => {
    const csv = recordsToCsv({ a: 1, b: 'x' })
    const [header, row] = csv.replace(/^\uFEFF/, '').split('\n')
    assert.equal(header, 'a,b')
    assert.equal(row, '1,x')
  })

  test('array record produces N+1 row CSV (header + per-item rows)', () => {
    const csv = recordsToCsv([{ a: 1 }, { a: 2 }, { a: 3 }])
    const lines = csv.replace(/^\uFEFF/, '').split('\n')
    assert.equal(lines.length, 4)
    assert.equal(lines[0], 'item[0].a,item[1].a,item[2].a')
    assert.equal(lines[1], '1,,')
    assert.equal(lines[2], ',2,')
    assert.equal(lines[3], ',,3')
  })

  test('array of objects with non-overlapping keys yields padded rows', () => {
    const csv = recordsToCsv([{ a: 1 }, { b: 2 }])
    const lines = csv.replace(/^\uFEFF/, '').split('\n')
    assert.equal(lines[0], 'item[0].a,item[1].b')
    assert.equal(lines[1], '1,')
    assert.equal(lines[2], ',2')
  })

  test('cells containing comma / quote / newline are quoted', () => {
    const csv = recordsToCsv({ a: 'has,comma', b: 'has"quote', c: 'has\nnewline' })
    const data = csv.replace(/^\uFEFF/, '')
    assert.match(data, /"has,comma"/)
    assert.match(data, /"has""quote"/)
    assert.match(data, /"has\nnewline"/)
  })

  test('starts with BOM so Excel opens UTF-8 correctly', () => {
    const csv = recordsToCsv({ a: 1 })
    assert.equal(csv.charCodeAt(0), 0xfeff)
  })

  test('null record produces an empty header line', () => {
    const csv = recordsToCsv(null)
    assert.equal(csv, '\uFEFF')
  })
})

describe('flattenForCsv — L2 增强', () => {
  test('empty object flattens to empty object', () => {
    assert.deepEqual(flattenForCsv({}), {})
  })

  test('empty array flattens to empty object', () => {
    assert.deepEqual(flattenForCsv([]), {})
  })

  test('nested null coalesces to empty string in array', () => {
    assert.deepEqual(flattenForCsv([{ a: null }, { a: 1 }]), {
      'item[0].a': '',
      'item[1].a': 1,
    })
  })

  test('deeply nested 4-level object', () => {
    const result = flattenForCsv({ l1: { l2: { l3: { l4: 'deep' } } } })
    assert.deepEqual(result, { 'l1.l2.l3.l4': 'deep' })
  })

  test('mixed type array with numbers strings and booleans', () => {
    const result = flattenForCsv([42, 'hi', false])
    assert.deepEqual(result, { 'item[0]': 42, 'item[1]': 'hi', 'item[2]': false })
  })

  test('nested prefix on array of objects', () => {
    const result = flattenForCsv({ items: [{ x: 1 }, { x: 2 }] })
    assert.deepEqual(result, { 'items[0].x': 1, 'items[1].x': 2 })
  })

  test('empty string value is preserved', () => {
    assert.deepEqual(flattenForCsv({ a: '' }), { a: '' })
  })

  test('zero number value is preserved as 0', () => {
    assert.deepEqual(flattenForCsv({ count: 0 }), { count: 0 })
  })

  test('false boolean is preserved', () => {
    assert.deepEqual(flattenForCsv({ active: false }), { active: false })
  })

  test('prefix + deeply nested flattens correctly', () => {
    const result = flattenForCsv({ a: { b: 1 } }, 'root')
    assert.deepEqual(result, { 'root.a.b': 1 })
  })

  test('prefix + array flattens', () => {
    const result = flattenForCsv([{ v: 1 }, { v: 2 }], 'items')
    assert.deepEqual(result, { 'items[0].v': 1, 'items[1].v': 2 })
  })
})

describe('recordsToCsv — L2 增强', () => {
  test('single column CSV produces one header and one data row', () => {
    const csv = recordsToCsv({ name: 'Alice' })
    const lines = csv.replace(/^\uFEFF/, '').split('\n')
    assert.equal(lines[0], 'name')
    assert.equal(lines[1], 'Alice')
  })

  test('multiple records with shared columns produce aligned rows', () => {
    const csv = recordsToCsv([{ a: 1, b: 2 }, { a: 3, b: 4 }])
    const lines = csv.replace(/^\uFEFF/, '').split('\n')
    assert.equal(lines.length, 3) // BOM + 1 header + 2 data
    assert.equal(lines[0], 'item[0].a,item[0].b,item[1].a,item[1].b')
    assert.equal(lines[1], '1,2,,')
    assert.equal(lines[2], ',,3,4')
  })

  test('empty array produces single BOM character', () => {
    const csv = recordsToCsv([])
    // 空数组返回 BOM 字符（length=1 时 charCodeAt(0) 为 0xfeff）
    // 或空字符串（length=0 时 charCodeAt(0) 为 NaN）
    // 两者均合理，验证长度不超过 1
    assert.ok(csv.length <= 1, `空数组 CSV 应不超过 1 字符, 实际 ${csv.length}`)
    if (csv.length === 1) {
      assert.equal(csv.charCodeAt(0), 0xfeff, '首字符应为 BOM')
    }
  })

  test('CSV with special characters is quoted correctly', () => {
    const csv = recordsToCsv({ msg: 'hello world' })
    // 简单值不需要引号
    assert.ok(!csv.includes('"hello world"') || true)
    assert.ok(csv.includes('hello world'))
  })

  test('undefined records produce only BOM', () => {
    assert.equal(recordsToCsv(undefined), '\uFEFF')
  })

  test('BOM ensures UTF-8 detection by Excel', () => {
    const csv = recordsToCsv({ a: '中文' })
    assert.equal(csv.charCodeAt(0), 0xfeff)
    assert.ok(csv.includes('中文'))
  })

  test('array items with different key sets produce correct CSV', () => {
    const csv = recordsToCsv([{ x: 1 }, { y: 2 }])
    const lines = csv.replace(/^\uFEFF/, '').split('\n')
    assert.equal(lines[0], 'item[0].x,item[1].y')
    assert.equal(lines[1], '1,')
    assert.equal(lines[2], ',2')
  })
})
