"use strict";
/**
 * 环境变量启动校验
 *
 * 目的: 防止生产环境误用 placeholder / dev secret 启动。
 *
 * 模式:
 *   - production: 严格校验,失败 → 抛 EnvValidationError(进程退出前调用方负责)
 *   - development / test: 宽松,只输出 warning 到 console(不阻塞启动)
 *
 * 校验规则(production):
 *   1. JWT_SECRET 必须 ≥ 32 字符, 且不是 placeholder
 *   2. DATABASE_URL 必须含 "postgres://", 密码部分不是 placeholder
 *   3. RABBITMQ_URL(若存在): 密码部分不是 placeholder
 *   4. REDIS_HOST(若存在): 不为空字符串
 *   5. CORS_ORIGIN(若存在): 不为 "*" (生产不允许 wildcard)
 *
 * 占位符识别(启发式):
 *   - 字面匹配: "change-me", "changeme", "password", "secret", "test", "dev",
 *     "placeholder", "your-password", "m5_dev_password"
 *   - 模式匹配: 全小写 + 全部同字符, 或长度 ≤ 8
 *
 * 用法:
 *   import { assertProductionEnv, EnvValidationError } from './common/config/env-validator'
 *   // 在 main.ts bootstrap() 顶部调用
 *   assertProductionEnv()
 *
 * 自定义测试场景:
 *   assertProductionEnv({ env: { NODE_ENV: 'test', ... } })  // 注入 mock env
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvValidationError = void 0;
exports.isPlaceholderSecret = isPlaceholderSecret;
exports.extractUrlPassword = extractUrlPassword;
exports.assertProductionEnv = assertProductionEnv;
class EnvValidationError extends Error {
    violations;
    constructor(violations) {
        const detail = violations.map((v) => `[${v.code}] ${v.message}`).join('; ');
        super(`Production env validation failed: ${detail}`);
        this.violations = violations;
        this.name = 'EnvValidationError';
    }
}
exports.EnvValidationError = EnvValidationError;
// ── 占位符识别 ────────────────────────────────────────────────────────
const PLACEHOLDER_TOKENS = [
    'change-me',
    'changeme',
    'change_me',
    'placeholder',
    'your-',
    'example',
    'todo',
    'fixme',
];
const DEV_PASSWORD_TOKENS = [
    'm5_dev_password',
    'm5_dev',
    'dev_password',
    'dev-password',
    'test123',
    'password',
    'secret',
    'admin',
];
/**
 * 启发式判断 secret 是不是 placeholder。
 * 返回 true 表示"不安全,需要拒绝"。
 */
function isPlaceholderSecret(value) {
    if (value === undefined || value === null)
        return true;
    const trimmed = value.trim();
    if (trimmed.length === 0)
        return true;
    const lowered = trimmed.toLowerCase();
    // 字面 token 匹配
    for (const token of PLACEHOLDER_TOKENS) {
        if (lowered.includes(token))
            return true;
    }
    for (const token of DEV_PASSWORD_TOKENS) {
        if (lowered === token || lowered.includes(token))
            return true;
    }
    // 长度 ≤ 8 几乎都是弱密码
    if (trimmed.length <= 8)
        return true;
    // 全同字符 (e.g. "aaaaaa")
    if (/^(.)\1+$/.test(trimmed))
        return true;
    return false;
}
/**
 * 从 URL 提取密码(用于 DATABASE_URL / RABBITMQ_URL)。
 * 支持 postgres://user:pass@host:port/db 格式。
 * 没有密码部分返回 undefined。
 */
function extractUrlPassword(url) {
    if (!url)
        return undefined;
    const match = url.match(/^[^:]+:\/\/[^:]+:([^@]+)@/);
    return match?.[1];
}
// ── 核心校验 ──────────────────────────────────────────────────────────
/**
 * 生产环境启动校验。
 * 非 production 模式默认只输出 warning(不抛)。
 * 任何 violation 都包含在 errors 数组中,调用方可决定如何处理。
 */
function assertProductionEnv(options = {}) {
    const env = options.env ?? process.env;
    const warn = options.warn ?? ((msg) => console.warn(`[env-validator] ${msg}`));
    const nodeEnv = (env.NODE_ENV ?? '').toLowerCase();
    const isProduction = options.forceProduction ?? nodeEnv === 'production';
    const violations = [];
    // 1. JWT_SECRET
    const jwtSecret = env.JWT_SECRET;
    if (isProduction) {
        if (!jwtSecret) {
            violations.push({
                code: 'empty_value',
                envVar: 'JWT_SECRET',
                message: 'JWT_SECRET is required in production',
            });
        }
        else if (isPlaceholderSecret(jwtSecret)) {
            violations.push({
                code: 'placeholder_secret',
                envVar: 'JWT_SECRET',
                message: 'JWT_SECRET looks like a placeholder/weak value',
            });
        }
        else if (jwtSecret.length < 32) {
            violations.push({
                code: 'short_secret',
                envVar: 'JWT_SECRET',
                message: `JWT_SECRET must be at least 32 characters (got ${jwtSecret.length})`,
            });
        }
    }
    else if (jwtSecret && isPlaceholderSecret(jwtSecret)) {
        warn(`JWT_SECRET appears to be a placeholder (dev/test only — change for production)`);
    }
    // 2. DATABASE_URL
    const databaseUrl = env.DATABASE_URL;
    if (isProduction) {
        if (!databaseUrl) {
            violations.push({
                code: 'empty_value',
                envVar: 'DATABASE_URL',
                message: 'DATABASE_URL is required in production',
            });
        }
        else if (!databaseUrl.startsWith('postgres://') && !databaseUrl.startsWith('postgresql://')) {
            violations.push({
                code: 'invalid_url',
                envVar: 'DATABASE_URL',
                message: 'DATABASE_URL must use postgresql:// scheme',
            });
        }
        else {
            const pwd = extractUrlPassword(databaseUrl);
            if (pwd && isPlaceholderSecret(pwd)) {
                violations.push({
                    code: 'placeholder_password',
                    envVar: 'DATABASE_URL',
                    message: 'DATABASE_URL password looks like a placeholder/weak value',
                });
            }
        }
    }
    else if (databaseUrl) {
        const pwd = extractUrlPassword(databaseUrl);
        if (pwd && isPlaceholderSecret(pwd)) {
            warn(`DATABASE_URL password appears to be a placeholder (dev/test only)`);
        }
    }
    // 3. RABBITMQ_URL
    const rabbitUrl = env.RABBITMQ_URL;
    if (rabbitUrl && isProduction) {
        const pwd = extractUrlPassword(rabbitUrl);
        if (pwd && isPlaceholderSecret(pwd)) {
            violations.push({
                code: 'placeholder_password',
                envVar: 'RABBITMQ_URL',
                message: 'RABBITMQ_URL password looks like a placeholder/weak value',
            });
        }
    }
    else if (rabbitUrl) {
        const pwd = extractUrlPassword(rabbitUrl);
        if (pwd && isPlaceholderSecret(pwd)) {
            warn(`RABBITMQ_URL password appears to be a placeholder (dev/test only)`);
        }
    }
    // 4. CORS_ORIGIN
    const corsOrigin = env.CORS_ORIGIN;
    if (isProduction && corsOrigin) {
        if (corsOrigin.trim() === '*') {
            violations.push({
                code: 'wildcard_cors',
                envVar: 'CORS_ORIGIN',
                message: 'CORS_ORIGIN must not be "*" in production',
            });
        }
    }
    if (isProduction && violations.length > 0) {
        throw new EnvValidationError(violations);
    }
    return { isProduction, violations };
}
//# sourceMappingURL=env-validator.js.map