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

  test('arrays of primitives join with pipe separator', () => {
    assert.deepEqual(flattenForCsv([1, 2, 3]), { value: '1|2|3' })
    assert.deepEqual(flattenForCsv(['a', 'b'], 'tags'), { tags: 'a|b' })
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
    assert.deepEqual(flattenForCsv([d], 'dates'), { dates: '2026-06-22T08:00:00.000Z' })
  })

  test('null and string mix in array flattens the nulls to empty cells', () => {
    assert.deepEqual(flattenForCsv([null, 'x', null], 'col'), { col: '|x|' })
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
