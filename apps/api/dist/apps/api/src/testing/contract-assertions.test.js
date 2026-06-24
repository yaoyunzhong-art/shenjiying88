"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importDefault(require("node:test"));
const contract_assertions_1 = require("./contract-assertions");
(0, node_test_1.default)('assertExactKeys passes when keys match exactly', () => {
    const target = { a: 1, b: 2, c: 3 };
    (0, contract_assertions_1.assertExactKeys)(target, ['a', 'b', 'c']);
    // no throw means pass
});
(0, node_test_1.default)('assertExactKeys passes when keys match regardless of order', () => {
    const target = { x: 10, y: 20, z: 30 };
    (0, contract_assertions_1.assertExactKeys)(target, ['z', 'x', 'y']);
    // no throw means pass
});
(0, node_test_1.default)('assertExactKeys throws when target is missing expected keys', () => {
    const target = { a: 1 };
    strict_1.default.throws(() => (0, contract_assertions_1.assertExactKeys)(target, ['a', 'b']), (err) => {
        return err instanceof strict_1.default.AssertionError;
    });
});
(0, node_test_1.default)('assertExactKeys throws when target has extra keys', () => {
    const target = { a: 1, b: 2, c: 3 };
    strict_1.default.throws(() => (0, contract_assertions_1.assertExactKeys)(target, ['a', 'b']), (err) => {
        return err instanceof strict_1.default.AssertionError;
    });
});
(0, node_test_1.default)('assertExactKeys throws when keys are completely disjoint', () => {
    const target = { a: 1 };
    strict_1.default.throws(() => (0, contract_assertions_1.assertExactKeys)(target, ['x', 'y']), (err) => {
        return err instanceof strict_1.default.AssertionError;
    });
});
(0, node_test_1.default)('assertExactKeys throws when target is null', () => {
    strict_1.default.throws(() => (0, contract_assertions_1.assertExactKeys)(null, ['a']), (err) => {
        return err instanceof strict_1.default.AssertionError;
    });
});
(0, node_test_1.default)('assertExactKeys throws when target is not an object (string)', () => {
    strict_1.default.throws(() => (0, contract_assertions_1.assertExactKeys)('hello', ['a']), (err) => {
        return err instanceof strict_1.default.AssertionError;
    });
});
(0, node_test_1.default)('assertExactKeys passes with empty keys array', () => {
    const target = {};
    (0, contract_assertions_1.assertExactKeys)(target, []);
    // no throw means pass
});
(0, node_test_1.default)('assertExactKeys throws with non-empty keys and empty object', () => {
    const target = {};
    strict_1.default.throws(() => (0, contract_assertions_1.assertExactKeys)(target, ['a']), (err) => {
        return err instanceof strict_1.default.AssertionError;
    });
});
//# sourceMappingURL=contract-assertions.test.js.map