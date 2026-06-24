"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertExactKeys = assertExactKeys;
const strict_1 = __importDefault(require("node:assert/strict"));
function assertExactKeys(target, keys) {
    strict_1.default.equal(typeof target, 'object');
    strict_1.default.notEqual(target, null);
    strict_1.default.deepEqual(Object.keys(target).sort(), keys.slice().sort());
}
//# sourceMappingURL=contract-assertions.js.map