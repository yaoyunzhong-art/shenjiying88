"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = require("node:test");
const env_validation_1 = require("./env.validation");
(0, node_test_1.describe)('envValidation', () => {
    (0, node_test_1.test)('returns config when required env set is complete', () => {
        const config = {
            API_PORT: '3001',
            JWT_SECRET: 'super-secret-key',
            DATABASE_URL: 'postgresql://m5:m5_local_password@localhost:5432/m5_core',
            REDIS_HOST: 'localhost',
            REDIS_PORT: '6379',
            LYT_MODE: 'mock',
            OTHER_KEY: 'value'
        };
        const result = (0, env_validation_1.envValidation)(config);
        strict_1.default.deepEqual(result, config);
    });
    (0, node_test_1.test)('returns config when numeric env values are numbers', () => {
        const config = {
            API_PORT: 3001,
            JWT_SECRET: 'abc123',
            DATABASE_URL: 'postgresql://m5:m5_local_password@localhost:5432/m5_core',
            REDIS_HOST: 'localhost',
            REDIS_PORT: 6379,
            LYT_MODE: 'mock'
        };
        const result = (0, env_validation_1.envValidation)(config);
        strict_1.default.strictEqual(result, config);
    });
    (0, node_test_1.test)('throws when JWT_SECRET is missing', () => {
        strict_1.default.throws(() => (0, env_validation_1.envValidation)({
            API_PORT: '3001',
            DATABASE_URL: 'postgresql://m5:m5_local_password@localhost:5432/m5_core',
            REDIS_HOST: 'localhost',
            REDIS_PORT: '6379',
            LYT_MODE: 'mock'
        }), { message: 'Missing required env: JWT_SECRET' });
    });
    (0, node_test_1.test)('throws when JWT_SECRET is empty string', () => {
        strict_1.default.throws(() => (0, env_validation_1.envValidation)({
            API_PORT: '3001',
            JWT_SECRET: '',
            DATABASE_URL: 'postgresql://m5:m5_local_password@localhost:5432/m5_core',
            REDIS_HOST: 'localhost',
            REDIS_PORT: '6379',
            LYT_MODE: 'mock'
        }), { message: 'Missing required env: JWT_SECRET' });
    });
    (0, node_test_1.test)('throws when DATABASE_URL is undefined', () => {
        strict_1.default.throws(() => (0, env_validation_1.envValidation)({
            API_PORT: '3001',
            JWT_SECRET: 'abc123',
            DATABASE_URL: undefined,
            REDIS_HOST: 'localhost',
            REDIS_PORT: '6379',
            LYT_MODE: 'mock'
        }), { message: 'Missing required env: DATABASE_URL' });
    });
    (0, node_test_1.test)('throws when DATABASE_URL is invalid', () => {
        strict_1.default.throws(() => (0, env_validation_1.envValidation)({
            API_PORT: '3001',
            JWT_SECRET: 'abc123',
            DATABASE_URL: 'not-a-url',
            REDIS_HOST: 'localhost',
            REDIS_PORT: '6379',
            LYT_MODE: 'mock'
        }), { message: 'Invalid DATABASE_URL' });
    });
    (0, node_test_1.test)('throws when API_PORT is invalid', () => {
        strict_1.default.throws(() => (0, env_validation_1.envValidation)({
            API_PORT: 'not-a-number',
            JWT_SECRET: 'abc123',
            DATABASE_URL: 'postgresql://m5:m5_local_password@localhost:5432/m5_core',
            REDIS_HOST: 'localhost',
            REDIS_PORT: '6379',
            LYT_MODE: 'mock'
        }), { message: 'Invalid numeric env: API_PORT' });
    });
    (0, node_test_1.test)('throws when REDIS_PORT is zero', () => {
        strict_1.default.throws(() => (0, env_validation_1.envValidation)({
            API_PORT: '3001',
            JWT_SECRET: 'abc123',
            DATABASE_URL: 'postgresql://m5:m5_local_password@localhost:5432/m5_core',
            REDIS_HOST: 'localhost',
            REDIS_PORT: '0',
            LYT_MODE: 'mock'
        }), { message: 'Invalid numeric env: REDIS_PORT' });
    });
    (0, node_test_1.test)('throws when LYT_MODE is blank', () => {
        strict_1.default.throws(() => (0, env_validation_1.envValidation)({
            API_PORT: '3001',
            JWT_SECRET: 'abc123',
            DATABASE_URL: 'postgresql://m5:m5_local_password@localhost:5432/m5_core',
            REDIS_HOST: 'localhost',
            REDIS_PORT: '6379',
            LYT_MODE: '   '
        }), { message: 'Missing required env: LYT_MODE' });
    });
});
//# sourceMappingURL=env.validation.test.js.map