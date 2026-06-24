"use strict";
/**
 * 重试 / 超时 韧性工具
 *
 * 提供两个核心能力:
 *  1. withTimeout — 给 promise 加超时,超时后抛 TimeoutError
 *  2. withRetry — 失败后按指数退避 + 抖动重试,支持 per-attempt timeout
 *
 * 适用场景:
 *  - 外部 HTTP webhook (支付回调) — 偶发网络抖动,需自动重试
 *  - 内部 RPC (e.g. 同步调用 loyalty 服务) — 慢调用熔断前给一次机会
 *  - DB 写入重试 — 处理临时死锁 / 连接抖动
 *
 * 不适用:
 *  - 幂等性未确认的写操作 (e.g. 支付扣款) — 重复执行可能造成双扣
 *  - 业务校验失败 (4xx) — 重试无意义
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryableError = exports.TimeoutError = void 0;
exports.createRetryExhaustedError = createRetryExhaustedError;
exports.isRetryable = isRetryable;
exports.withTimeout = withTimeout;
exports.withRetry = withRetry;
// ─── 错误类型 ──────────────────────────────────────────────────────────
class TimeoutError extends Error {
    timeoutMs;
    label;
    constructor(message, timeoutMs, label) {
        super(message);
        this.timeoutMs = timeoutMs;
        this.label = label;
        this.name = 'TimeoutError';
    }
}
exports.TimeoutError = TimeoutError;
class RetryableError extends Error {
    cause;
    label;
    constructor(message, cause, label) {
        super(message);
        this.cause = cause;
        this.label = label;
        this.name = 'RetryableError';
    }
}
exports.RetryableError = RetryableError;
function createRetryExhaustedError(attempts, lastError, label) {
    const err = new Error(`Retry exhausted after ${attempts} attempts${label ? ` (${label})` : ''}: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
    err.name = 'RetryExhaustedError';
    err.attempts = attempts;
    err.lastError = lastError;
    if (label)
        err.label = label;
    return err;
}
// ─── 默认判断是否可重试 ────────────────────────────────────────────────
/**
 * 启发式判断是否值得重试:
 *  - 网络错误 (ECONNRESET, ETIMEDOUT, ECONNREFUSED, EAI_AGAIN, EHOSTUNREACH)
 *  - 显式抛出的 RetryableError
 *  - HTTP 5xx 状态错误 (若 err 含 .status 或 .statusCode)
 *  - 4xx 状态错误 (非 429) 不重试 — 业务校验失败重试无意义
 *  - 429 单独重试 — 限流
 *  - 其余 Error 不重试(默认保守,避免对业务错误做无意义重试)
 */
function isRetryable(err) {
    if (err instanceof RetryableError)
        return true;
    if (err instanceof TimeoutError)
        return true;
    if (err instanceof Error) {
        const code = err.code;
        if (code === 'ECONNRESET' ||
            code === 'ETIMEDOUT' ||
            code === 'ECONNREFUSED' ||
            code === 'EAI_AGAIN' ||
            code === 'EHOSTUNREACH' ||
            code === 'EPIPE') {
            return true;
        }
        const status = err.status ?? err.statusCode;
        if (typeof status === 'number') {
            // 5xx / 429 — 限流或服务端问题,值得重试
            if (status >= 500 && status < 600)
                return true;
            if (status === 429)
                return true;
        }
    }
    return false;
}
/**
 * 给 promise 加超时。
 * 超时后抛 TimeoutError(可被 isRetryable 识别),原 promise 仍继续(不取消)。
 */
function withTimeout(promise, options) {
    const opts = typeof options === 'number' ? { ms: options } : options;
    const ms = opts.ms ?? 5000;
    const label = opts.label;
    return new Promise((resolve, reject) => {
        let settled = false;
        const timer = setTimeout(() => {
            if (settled)
                return;
            settled = true;
            reject(new TimeoutError(`Operation timed out after ${ms}ms${label ? ` (${label})` : ''}`, ms, label));
        }, ms);
        promise.then((v) => {
            if (settled)
                return;
            settled = true;
            clearTimeout(timer);
            resolve(v);
        }, (e) => {
            if (settled)
                return;
            settled = true;
            clearTimeout(timer);
            reject(e);
        });
    });
}
/**
 * 重试执行函数 fn。
 * 失败时根据 isRetryable 决定是否继续,按指数退避 + 抖动等待后重试。
 * maxAttempts 用尽后抛 RetryExhaustedError(保留 lastError)。
 */
async function withRetry(fn, options = {}) {
    const { maxAttempts = 3, baseDelayMs = 200, maxDelayMs = 5000, backoffMultiplier = 2, jitter = 0.2, timeoutMs, isRetryable: shouldRetry = isRetryable, onRetry, label, } = options;
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            const work = fn();
            const result = timeoutMs ? await withTimeout(work, { ms: timeoutMs, label }) : await work;
            return result;
        }
        catch (err) {
            lastError = err;
            if (attempt >= maxAttempts)
                break;
            if (!shouldRetry(err))
                throw err;
            // 指数退避:baseDelayMs * multiplier^(attempt-1),clamp 到 maxDelayMs
            const raw = baseDelayMs * Math.pow(backoffMultiplier, attempt - 1);
            const capped = Math.min(raw, maxDelayMs);
            // 抖动: ±jitter
            const jitterFactor = 1 + (Math.random() * 2 - 1) * jitter;
            const delayMs = Math.max(0, Math.floor(capped * jitterFactor));
            onRetry?.({ attempt, nextAttempt: attempt + 1, delayMs, error: err, label });
            await sleep(delayMs);
        }
    }
    throw createRetryExhaustedError(maxAttempts, lastError, label);
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
//# sourceMappingURL=retry.js.map