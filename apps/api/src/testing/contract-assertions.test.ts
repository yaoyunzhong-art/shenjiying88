import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict';
import { assertExactKeys } from './contract-assertions';

it('assertExactKeys passes when keys match exactly', () => {
  const target = { a: 1, b: 2, c: 3 };
  assertExactKeys(target, ['a', 'b', 'c']);
  // no throw means pass
});

it('assertExactKeys passes when keys match regardless of order', () => {
  const target = { x: 10, y: 20, z: 30 };
  assertExactKeys(target, ['z', 'x', 'y']);
  // no throw means pass
});

it('assertExactKeys throws when target is missing expected keys', () => {
  const target = { a: 1 };
  assert.throws(
    () => assertExactKeys(target, ['a', 'b']),
    (err: unknown) => {
      return err instanceof assert.AssertionError;
    }
  );
});

it('assertExactKeys throws when target has extra keys', () => {
  const target = { a: 1, b: 2, c: 3 };
  assert.throws(
    () => assertExactKeys(target, ['a', 'b']),
    (err: unknown) => {
      return err instanceof assert.AssertionError;
    }
  );
});

it('assertExactKeys throws when keys are completely disjoint', () => {
  const target = { a: 1 };
  assert.throws(
    () => assertExactKeys(target, ['x', 'y']),
    (err: unknown) => {
      return err instanceof assert.AssertionError;
    }
  );
});

it('assertExactKeys throws when target is null', () => {
  assert.throws(
    () => assertExactKeys(null, ['a']),
    (err: unknown) => {
      return err instanceof assert.AssertionError;
    }
  );
});

it('assertExactKeys throws when target is not an object (string)', () => {
  assert.throws(
    () => assertExactKeys('hello', ['a']),
    (err: unknown) => {
      return err instanceof assert.AssertionError;
    }
  );
});

it('assertExactKeys passes with empty keys array', () => {
  const target = {};
  assertExactKeys(target, []);
  // no throw means pass
});

it('assertExactKeys throws with non-empty keys and empty object', () => {
  const target = {};
  assert.throws(
    () => assertExactKeys(target, ['a']),
    (err: unknown) => {
      return err instanceof assert.AssertionError;
    }
  );
});
