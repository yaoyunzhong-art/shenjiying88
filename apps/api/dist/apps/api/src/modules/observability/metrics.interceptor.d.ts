import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { MetricsService } from './metrics.service';
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
export declare class MetricsInterceptor implements NestInterceptor {
    private readonly metricsService;
    private readonly startTime;
    constructor(metricsService: MetricsService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private incActive;
    private getGauge;
}
//# sourceMappingURL=metrics.interceptor.d.ts.map