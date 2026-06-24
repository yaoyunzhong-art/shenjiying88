"use strict";
/**
 * Circuit breaker 韧性工具
 *
 * 三态状态机:
 *   CLOSED    — 正常通过,统计失败次数,达到 threshold 跳 OPEN
 *   OPEN      — 快速失败(抛 CircuitOpenError),等 resetTimeoutMs → HALF_OPEN
 *   HALF_OPEN — 允许一次探测调用,成功 → CLOSED,失败 → OPEN
 *
 * 用途:
 *  - 保护下游外部 HTTP / RPC 调用,失败过多时熔断,避免雪崩
 *  - 与 retry/timeout 互补: retry 处理瞬时抖动,circuit breaker 处理持续故障
 *
 * 典型组合:
 *   const cb = new CircuitBreaker('payment-gateway', { failureThreshold: 5 })
 *   const result = await cb.execute(() => withRetry(() => callPaymentAPI()))
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CircuitBreaker = exports.CircuitOpenError = void 0;
class CircuitOpenError extends Error {
    breakerName;
    retryAfterMs;
    constructor(message, breakerName, retryAfterMs) {
        super(`Circuit '${breakerName}' ${message}`);
        this.breakerName = breakerName;
        this.retryAfterMs = retryAfterMs;
        this.name = 'CircuitOpenError';
    }
}
exports.CircuitOpenError = CircuitOpenError;
const DEFAULTS = {
    failureThreshold: 5,
    resetTimeoutMs: 30_000,
    halfOpenSuccessThreshold: 1,
};
/**
 * Circuit breaker 实例
 */
class CircuitBreaker {
    name;
    state = 'closed';
    failures = 0;
    successes = 0;
    totalSuccesses = 0;
    totalFailures = 0;
    totalRejections = 0;
    lastFailureAt;
    lastSuccessAt;
    openedAt;
    options;
    constructor(name, options = {}) {
        this.name = name;
        this.options = {
            failureThreshold: options.failureThreshold ?? DEFAULTS.failureThreshold,
            resetTimeoutMs: options.resetTimeoutMs ?? DEFAULTS.resetTimeoutMs,
            halfOpenSuccessThreshold: options.halfOpenSuccessThreshold ?? DEFAULTS.halfOpenSuccessThreshold,
            isFailure: options.isFailure,
            onStateChange: options.onStateChange,
            onReject: options.onReject,
            onSuccess: options.onSuccess,
            onFailure: options.onFailure,
            now: options.now,
        };
    }
    getState() {
        return this.state;
    }
    getStats() {
        return {
            name: this.name,
            state: this.state,
            failures: this.failures,
            successes: this.successes,
            totalSuccesses: this.totalSuccesses,
            totalFailures: this.totalFailures,
            totalRejections: this.totalRejections,
            lastFailureAt: this.lastFailureAt,
            lastSuccessAt: this.lastSuccessAt,
            openedAt: this.openedAt,
        };
    }
    /**
     * 执行受保护的调用 fn。OPEN 状态下立即抛 CircuitOpenError(不调用 fn)。
     * 失败/成功会更新内部状态,可能触发状态切换。
     */
    async execute(fn) {
        const now = this.options.now?.() ?? Date.now();
        if (this.state === 'open') {
            // 检查是否到 reset time → 转 half-open
            if (this.openedAt !== undefined && now - this.openedAt >= this.options.resetTimeoutMs) {
                this.transition('half-open');
            }
            else {
                this.totalRejections += 1;
                const retryAfterMs = this.openedAt !== undefined
                    ? Math.max(0, this.options.resetTimeoutMs - (now - this.openedAt))
                    : this.options.resetTimeoutMs;
                this.options.onReject?.({ name: this.name, retryAfterMs });
                throw new CircuitOpenError(`Circuit '${this.name}' is open${this.openedAt !== undefined ? ` (retry in ${retryAfterMs}ms)` : ''}`, this.name, retryAfterMs);
            }
        }
        try {
            const result = await fn();
            this.recordSuccess(now);
            return result;
        }
        catch (err) {
            this.recordFailure(err, now);
            throw err;
        }
    }
    /** 强制重置(运维用) */
    reset() {
        this.transition('closed', /* force */ true);
        this.failures = 0;
        this.successes = 0;
        this.openedAt = undefined;
    }
    recordSuccess(now) {
        this.lastSuccessAt = now;
        this.totalSuccesses += 1;
        if (this.state === 'half-open') {
            this.successes += 1;
            if (this.successes >= this.options.halfOpenSuccessThreshold) {
                this.failures = 0;
                this.successes = 0;
                this.transition('closed');
            }
        }
        else if (this.state === 'closed') {
            // 连续成功不重置 failures — 失败计数是连续失败,成功时清零
            this.failures = 0;
        }
        this.options.onSuccess?.({ name: this.name, state: this.state });
    }
    recordFailure(err, now) {
        const isFailure = this.options.isFailure ?? (() => true);
        if (!isFailure(err)) {
            // 不算失败,只记录统计
            this.options.onSuccess?.({ name: this.name, state: this.state });
            return;
        }
        this.lastFailureAt = now;
        this.totalFailures += 1;
        if (this.state === 'half-open') {
            // half-open 状态任何失败 → 立即跳回 open
            this.successes = 0;
            this.openedAt = now;
            this.transition('open');
        }
        else if (this.state === 'closed') {
            this.failures += 1;
            if (this.failures >= this.options.failureThreshold) {
                this.openedAt = now;
                this.transition('open');
            }
        }
        this.options.onFailure?.({ name: this.name, state: this.state, error: err });
    }
    transition(to, force = false) {
        if (this.state === to && !force)
            return;
        const from = this.state;
        this.state = to;
        this.options.onStateChange?.({ from, to, name: this.name });
    }
}
exports.CircuitBreaker = CircuitBreaker;
//# sourceMappingURL=circuit-breaker.js.map