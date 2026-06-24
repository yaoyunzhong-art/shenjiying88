"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsInterceptor = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const metrics_service_1 = require("./metrics.service");
/**
 * HTTP 请求 metrics 拦截器:
 *   - http_requests_total{method, path, status}
 *   - http_request_duration_ms{method, path}
 *   - http_active_connections (gauge)
 *   - http_exceptions_total{method, path, kind} (出异常时)
 *   - process_uptime_seconds (启动时记录基线)
 *
 * 通过 NestJS 全局注册生效 (useGlobalInterceptors)。
 */
let MetricsInterceptor = class MetricsInterceptor {
    metricsService;
    startTime = Date.now();
    constructor(metricsService) {
        this.metricsService = metricsService;
    }
    intercept(context, next) {
        if (context.getType() !== 'http')
            return next.handle();
        const http = context.switchToHttp();
        const req = http.getRequest();
        const res = http.getResponse();
        const start = process.hrtime.bigint();
        const method = req.method;
        // Express 路由路径 (e.g. /metrics) — 避免被 query string 污染
        const path = req.route?.path ?? req.path ?? 'unknown';
        // 增加 active connections (gauge)
        this.incActive(1);
        // 设置 uptime
        this.metricsService.setGauge('process_uptime_seconds', {}, Math.floor((Date.now() - this.startTime) / 1000));
        return next.handle().pipe((0, rxjs_1.tap)({
            next: () => {
                const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
                const status = res.statusCode;
                this.metricsService.incrementCounter('http_requests_total', { method, path, status });
                this.metricsService.observeHistogram('http_request_duration_ms', durationMs, { method, path });
                this.incActive(-1);
            },
            error: (err) => {
                const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
                const status = err?.status ?? 500;
                const kind = err?.name ?? 'Error';
                this.metricsService.incrementCounter('http_requests_total', { method, path, status });
                this.metricsService.observeHistogram('http_request_duration_ms', durationMs, { method, path });
                this.metricsService.incrementCounter('http_exceptions_total', { method, path, kind });
                this.incActive(-1);
            }
        }));
    }
    incActive(delta) {
        const current = this.getGauge('http_active_connections');
        this.metricsService.setGauge('http_active_connections', {}, current + delta);
    }
    getGauge(name) {
        // 内部读取 (避免抛错)
        const render = this.metricsService.render();
        const line = render.split('\n').find((l) => l.startsWith(`${name} `) || l.startsWith(`${name}{`));
        if (!line)
            return 0;
        const lastSpace = line.lastIndexOf(' ');
        return Number(line.slice(lastSpace + 1).trim()) || 0;
    }
};
exports.MetricsInterceptor = MetricsInterceptor;
exports.MetricsInterceptor = MetricsInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [metrics_service_1.MetricsService])
], MetricsInterceptor);
//# sourceMappingURL=metrics.interceptor.js.map