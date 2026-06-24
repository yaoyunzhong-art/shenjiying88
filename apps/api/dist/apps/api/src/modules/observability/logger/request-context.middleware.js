"use strict";
/**
 * Request Context Middleware
 *
 * 为每个 HTTP 请求分配/继承 correlation id:
 *   - 优先取入站 header `x-request-id` (上游调用链已传递)
 *   - 否则用 nanoid() 生成 21 字符 ID
 *   - 注入到 req.requestId / res header `x-request-id` (回传给上游)
 *   - 注入 tenant context (从 x-tenant-id 等 headers)
 *
 * 后续通过 AsyncLocalStorage 让 LoggerService 自动获取 traceId/requestId。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachRequestContext = attachRequestContext;
const nanoid_1 = require("nanoid");
function attachRequestContext(req, res, next) {
    const r = req;
    const inbound = req.header('x-request-id');
    const requestId = inbound && /^[A-Za-z0-9_-]{6,64}$/.test(inbound) ? inbound : (0, nanoid_1.nanoid)(21);
    r.requestId = requestId;
    res.setHeader('x-request-id', requestId);
    // 同时透传 W3C trace context (来自 OpenTelemetry)
    const traceparent = req.header('traceparent');
    if (traceparent) {
        const m = traceparent.match(/^00-([a-f0-9]{32})-([a-f0-9]{16})-[a-f0-9]{2}$/);
        if (m) {
            r.traceId = m[1];
        }
    }
    next();
}
//# sourceMappingURL=request-context.middleware.js.map