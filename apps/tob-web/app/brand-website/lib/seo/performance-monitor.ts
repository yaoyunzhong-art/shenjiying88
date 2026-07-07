/**
 * Core Web Vitals 性能监控服务
 * 支持 LCP、FID、CLS 全指标监控与告警
 */

export interface WebVitalsMetrics {
  lcp?: number; // Largest Contentful Paint (ms)
  fid?: number; // First Input Delay (ms)
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint (ms)
  ttfb?: number; // Time to First Byte (ms)
  inp?: number; // Interaction to Next Paint (ms)
  tt?: number; // Total Blocking Time (ms)
}

export interface PerformanceThresholds {
  lcp: { good: number; needsImprovement: number; poor: number };
  fid: { good: number; needsImprovement: number; poor: number };
  cls: { good: number; needsImprovement: number; poor: number };
  fcp: { good: number; needsImprovement: number; poor: number };
  ttfb: { good: number; needsImprovement: number; poor: number };
  inp: { good: number; needsImprovement: number; poor: number };
  tt: { good: number; needsImprovement: number; poor: number };
}

interface AlertConfig {
  threshold: number; // 百分比，如 0.1 表示 10%
  window: number; // 时间窗口 (ms)
  callback: (metric: keyof WebVitalsMetrics, value: number, rating: string) => void;
}

export interface PerformanceReport {
  timestamp: number;
  metrics: WebVitalsMetrics;
  rating: Record<string, 'good' | 'needs-improvement' | 'poor'>;
  navigationType: string;
  url: string;
}

/**
 * Core Web Vitals 评分标准 (Google标准)
 */
export const WEB_VITALS_THRESHOLDS: PerformanceThresholds = {
  lcp: { good: 2500, needsImprovement: 4000, poor: 4000 },
  fid: { good: 100, needsImprovement: 300, poor: 300 },
  cls: { good: 0.1, needsImprovement: 0.25, poor: 0.25 },
  fcp: { good: 1800, needsImprovement: 3000, poor: 3000 },
  ttfb: { good: 800, needsImprovement: 1800, poor: 1800 },
  inp: { good: 200, needsImprovement: 500, poor: 500 },
  tt: { good: 200, needsImprovement: 400, poor: 400 },
};

/**
 * 性能监控器类
 */
export class PerformanceMonitor {
  private alerts: AlertConfig[] = [];
  private reports: PerformanceReport[] = [];
  private maxReports: number = 1000;
  private isMonitoring: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initMonitoring();
    }
  }

  /**
   * 初始化监控
   */
  private initMonitoring(): void {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    // 监听 Performance Observer 指标
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeFCP();
    this.observeTTFB();

    // 页面卸载时上报
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flush();
      }
    });
  }

  /**
   * 监听 LCP (Largest Contentful Paint)
   */
  private observeLCP(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
      if (lastEntry) {
        this.handleMetric('lcp', lastEntry.startTime);
      }
    });

    try {
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) {
      // 浏览器不支持
    }
  }

  /**
   * 监听 FID (First Input Delay)
   */
  private observeFID(): void {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        const fidEntry = entry as PerformanceEntry & { processingStart: number; duration: number };
        const value = fidEntry.processingStart - fidEntry.startTime;
        this.handleMetric('fid', value);
      });
    });

    try {
      observer.observe({ type: 'first-input', buffered: true });
    } catch (e) {
      // 浏览器不支持
    }
  }

  /**
   * 监听 CLS (Cumulative Layout Shift)
   */
  private observeCLS(): void {
    let clsValue = 0;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const clsEntry = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
        if (!clsEntry.hadRecentInput) {
          clsValue += clsEntry.value;
        }
      }
      this.handleMetric('cls', clsValue);
    });

    try {
      observer.observe({ type: 'layout-shift', buffered: true });
    } catch (e) {
      // 浏览器不支持
    }
  }

  /**
   * 监听 FCP (First Contentful Paint)
   */
  private observeFCP(): void {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const fcpEntry = entries.find((e) => e.name === 'first-contentful-paint');
      if (fcpEntry) {
        this.handleMetric('fcp', fcpEntry.startTime);
      }
    });

    try {
      observer.observe({ type: 'paint', buffered: true });
    } catch (e) {
      // 浏览器不支持
    }
  }

  /**
   * 监听 TTFB (Time to First Byte)
   */
  private observeTTFB(): void {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const navEntry = entries[0] as PerformanceNavigationTiming;
      if (navEntry && navEntry.responseStart) {
        const ttfb = navEntry.responseStart - navEntry.requestStart;
        this.handleMetric('ttfb', ttfb);
      }
    });

    try {
      observer.observe({ type: 'navigation', buffered: true });
    } catch (e) {
      // 浏览器不支持
    }
  }

  /**
   * 处理指标数据
   */
  private handleMetric(name: keyof WebVitalsMetrics, value: number): void {
    const rating = this.getRating(name, value);

    const report: PerformanceReport = {
      timestamp: Date.now(),
      metrics: { [name]: value },
      rating: { [name]: rating },
      navigationType: 'navigate',
      url: typeof window !== 'undefined' ? window.location.href : '',
    };

    this.reports.push(report);
    if (this.reports.length > this.maxReports) {
      this.reports.shift();
    }

    // 检查告警
    this.checkAlerts(name, value, rating);
  }

  /**
   * 获取指标评分
   */
  getRating(name: keyof WebVitalsMetrics, value: number): 'good' | 'needs-improvement' | 'poor' {
    const threshold = WEB_VITALS_THRESHOLDS[name];
    if (!threshold) return 'needs-improvement';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
  }

  /**
   * 获取评分颜色
   */
  static getRatingColor(rating: 'good' | 'needs-improvement' | 'poor'): string {
    switch (rating) {
      case 'good':
        return '#34c759';
      case 'needs-improvement':
        return '#ff9500';
      case 'poor':
        return '#ff3b30';
    }
  }

  /**
   * 添加告警配置
   */
  addAlert(config: AlertConfig): void {
    this.alerts.push(config);
  }

  /**
   * 检查告警
   */
  private checkAlerts(name: keyof WebVitalsMetrics, value: number, rating: string): void {
    this.alerts.forEach((alert) => {
      alert.callback(name, value, rating);
    });
  }

  /**
   * 获取最新报告
   */
  getLatestReport(): PerformanceReport | null {
    return this.reports[this.reports.length - 1] || null;
  }

  /**
   * 获取汇总统计
   */
  getSummary(): Record<string, { avg: number; min: number; max: number; count: number; poorRate: number }> {
    const summary: Record<string, { sum: number; min: number; max: number; count: number; poor: number }> = {};

    this.reports.forEach((report) => {
      Object.entries(report.metrics).forEach(([key, value]) => {
        if (value === undefined) return;
        if (!summary[key]) {
          summary[key] = { sum: 0, min: Infinity, max: -Infinity, count: 0, poor: 0 };
        }
        summary[key].sum += value;
        summary[key].min = Math.min(summary[key].min, value);
        summary[key].max = Math.max(summary[key].max, value);
        summary[key].count++;
        if (report.rating[key] === 'poor') {
          summary[key].poor++;
        }
      });
    });

    return Object.fromEntries(
      Object.entries(summary).map(([key, data]) => [
        key,
        {
          avg: data.count > 0 ? data.sum / data.count : 0,
          min: data.min === Infinity ? 0 : data.min,
          max: data.max === -Infinity ? 0 : data.max,
          count: data.count,
          poorRate: data.count > 0 ? data.poor / data.count : 0,
        },
      ])
    );
  }

  /**
   * 刷新数据（页面卸载前）
   */
  private flush(): void {
    // 上报数据到服务器
    const data = this.getSummary();
    console.log('[PerformanceMonitor] Flushing data:', data);
    // TODO: 实际上报逻辑
  }

  /**
   * 销毁监控
   */
  destroy(): void {
    this.isMonitoring = false;
    this.reports = [];
    this.alerts = [];
  }
}

// ---- React Hook 集成 ----

export const globalPerformanceMonitor = new PerformanceMonitor();
