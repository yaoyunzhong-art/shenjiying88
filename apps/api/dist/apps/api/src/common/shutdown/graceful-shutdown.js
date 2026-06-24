"use strict";
/**
 * Graceful shutdown 工具 — 让服务在收到 SIGTERM / SIGINT 时
 * 完成进行中的请求后再退出,避免硬终止导致数据丢失 / 5xx。
 *
 * 触发顺序:
 *   1. 收到信号 (SIGTERM / SIGINT)
 *   2. 标记 shuttingDown = true,新请求直接 503
 *   3. 等待进行中的请求完成 (drain timeout)
 *   4. 关闭 NestJS app (app.close())
 *   5. 关闭外部资源 (tracing SDK / 外部连接)
 *   6. process.exit(0)
 *
 * 用法 (main.ts):
 *   registerGracefulShutdown({
 *     app,
 *     drainTimeoutMs: 30_000,
 *     onDraining: () => logger.info('draining in-flight requests'),
 *     onClosed: () => logger.info('app closed'),
 *   })
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGracefulShutdown = registerGracefulShutdown;
exports.trackInFlight = trackInFlight;
const DEFAULT_DRAIN_TIMEOUT = 30_000;
const DEFAULT_SIGNALS = ['SIGTERM', 'SIGINT'];
/**
 * 注册 graceful shutdown。返回 handle 供中间件查询状态。
 */
function registerGracefulShutdown(options) {
    const { app, drainTimeoutMs = DEFAULT_DRAIN_TIMEOUT, inFlightRef = { count: 0 }, onDraining, onClosed, signals = DEFAULT_SIGNALS, onCloseCustom, } = options;
    let draining = false;
    let shutting = false;
    const listeners = [];
    const shutdown = async (_signal) => {
        if (shutting)
            return;
        shutting = true;
        draining = true;
        onDraining?.();
        const deadline = Date.now() + drainTimeoutMs;
        // 等待 in-flight 请求归零
        while (inFlightRef.count > 0 && Date.now() < deadline) {
            await sleep(50);
        }
        if (inFlightRef.count > 0) {
            // drain timeout:仍有请求未完成,放弃等待
        }
        try {
            await app.close();
        }
        catch {
            // 关闭失败时忽略,继续
        }
        if (onCloseCustom) {
            try {
                await onCloseCustom();
            }
            catch {
                // 关闭自定义资源失败时忽略
            }
        }
        onClosed?.();
        // 给 logger 200ms 缓冲再退出
        setTimeout(() => process.exit(0), 200);
    };
    for (const sig of signals) {
        const fn = () => {
            shutdown(sig).catch(() => {
                process.exit(1);
            });
        };
        process.on(sig, fn);
        listeners.push({ sig, fn });
    }
    return {
        get draining() {
            return draining;
        },
        async forceClose() {
            await shutdown('SIGTERM');
        },
        dispose() {
            for (const { sig, fn } of listeners) {
                process.off(sig, fn);
            }
        },
    };
}
/**
 * 中间件辅助:追踪 in-flight 请求数量。
 * 使用方式:
 *   const ref = { count: 0 }
 *   app.use(trackInFlight(ref, () => shutdownHandle.draining))
 */
function trackInFlight(ref, isDraining) {
    return (req, res, next) => {
        void req; // express middleware 签名保留,未读取
        if (isDraining()) {
            res.statusCode = 503;
            res.on('end', () => { });
            next();
            return;
        }
        ref.count += 1;
        res.on('finish', () => {
            ref.count -= 1;
        });
        res.on('close', () => {
            ref.count -= 1;
        });
        next();
    };
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
//# sourceMappingURL=graceful-shutdown.js.map