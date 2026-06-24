"use strict";
/**
 * TracingService — NestJS 注入式 OTel Span 包装
 *
 * 用于业务代码主动创建 span (例如:跨服务的关键业务操作)
 *   constructor(@Inject(TracingService) private readonly trace: TracingService) {}
 *   await this.trace.withSpan('cashier.createOrder', async (span) => {
 *     span.setAttribute('tenantId', tenantId)
 *     // ... 业务
 *   })
 *
 * 当 OTel 未初始化时 (tracing=none),span 为 no-op,业务无感
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TracingService = void 0;
const common_1 = require("@nestjs/common");
const api_1 = require("@opentelemetry/api");
let TracingService = class TracingService {
    tracer;
    constructor(tracerName) {
        this.tracer = api_1.trace.getTracer(tracerName ?? 'm5-api');
    }
    /**
     * 在 span 内执行函数。函数抛错时 span 自动记录 error。
     *
     * @param name span 名 (建议 business.action 格式,如 'cashier.createOrder')
     * @param fn 业务函数,接收 Span 用于 setAttribute / addEvent
     */
    async withSpan(name, fn, options) {
        return this.tracer.startActiveSpan(name, options ?? {}, async (span) => {
            try {
                const result = await fn(span);
                span.setStatus({ code: 1 }); // OK
                return result;
            }
            catch (err) {
                span.recordException(err);
                span.setStatus({ code: 2, message: err.message }); // ERROR
                throw err;
            }
            finally {
                span.end();
            }
        });
    }
    /**
     * 同步版本。用于非异步代码块
     */
    withSpanSync(name, fn, options) {
        return this.tracer.startActiveSpan(name, options ?? {}, (span) => {
            try {
                const result = fn(span);
                span.setStatus({ code: 1 });
                return result;
            }
            catch (err) {
                span.recordException(err);
                span.setStatus({ code: 2, message: err.message });
                throw err;
            }
            finally {
                span.end();
            }
        });
    }
    /** 获取当前 active span (可能为 noopSpan,业务需兼容) */
    currentSpan() {
        return api_1.trace.getActiveSpan() ?? api_1.trace.getTracer('noop').startSpan('noop');
    }
    /** 直接获取底层 tracer (高级用法) */
    raw() {
        return this.tracer;
    }
};
exports.TracingService = TracingService;
exports.TracingService = TracingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [String])
], TracingService);
//# sourceMappingURL=tracing.service.js.map