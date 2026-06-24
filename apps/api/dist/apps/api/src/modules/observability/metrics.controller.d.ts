import type { Response } from 'express';
import { MetricsService } from './metrics.service';
export declare class MetricsController {
    private readonly metricsService;
    constructor(metricsService: MetricsService);
    /**
     * Prometheus 抓取端点 (text/plain; version=0.0.4)
     * 暴露所有已注册的 Counter / Gauge / Histogram
     */
    getMetrics(res: Response): Promise<void>;
    /**
     * 健康检查端点 (轻量,不影响 metrics 收集)
     */
    getHealth(): {
        status: string;
        metrics: number;
    };
}
//# sourceMappingURL=metrics.controller.d.ts.map