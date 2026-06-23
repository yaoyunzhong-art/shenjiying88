import assert from 'node:assert/strict'

export function assertExactKeys(target: unknown, keys: string[]) {
  assert.equal(typeof target, 'object')
  assert.notEqual(target, null)
  assert.deepEqual(Object.keys(target as Record<string, unknown>).sort(), keys.slice().sort())
}

