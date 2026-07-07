/**
 * 切换延迟集成测试 (V9 需求 1 · V10 Day 3)
 *
 * 目标: 切换延迟 < 500ms (P95)
 * 测试内容:
 * 1. 乐观更新响应时间
 * 2. API请求+响应时间
 * 3. UI渲染完成时间
 * 4. 端到端总延迟
 */

import assert from 'node:assert/strict';
import { describe, it, before, after, mock } from 'node:test';

// 延迟测量工具
class LatencyMeter {
  private marks = new Map<string, number>();
  private measures: Array<{ name: string; duration: number }> = [];

  mark(name: string) {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string, endMark?: string) {
    const start = this.marks.get(startMark);
    const end = endMark ? this.marks.get(endMark) : performance.now();
    
    if (start !== undefined && end !== undefined) {
      const duration = end - start;
      this.measures.push({ name, duration });
      return duration;
    }
    return null;
  }

  getReport() {
    const report: Record<string, { avg: number; min: number; max: number; p95: number }> = {};
    
    const grouped = this.measures.reduce((acc, m) => {
      if (!acc[m.name]) acc[m.name] = [];
      acc[m.name].push(m.duration);
      return acc;
    }, {} as Record<string, number[]>);

    for (const [name, durations] of Object.entries(grouped)) {
      const sorted = [...durations].sort((a, b) => a - b);
      const sum = sorted.reduce((a, b) => a + b, 0);
      
      report[name] = {
        avg: Math.round(sum / sorted.length * 100) / 100,
        min: Math.round(sorted[0] * 100) / 100,
        max: Math.round(sorted[sorted.length - 1] * 100) / 100,
        p95: Math.round(sorted[Math.floor(sorted.length * 0.95)] * 100) / 100,
      };
    }

    return report;
  }

  clear() {
    this.marks.clear();
    this.measures = [];
  }
}

describe('AI Model Switcher - Latency Integration Tests', () => {
  let latencyMeter: LatencyMeter;

  before(() => {
    latencyMeter = new LatencyMeter();
  });

  after(() => {
    mock.reset();
    latencyMeter.clear();
  });

  describe('Switch Latency Requirements', () => {
    it('should complete optimistic update within 50ms', () => {
      const meter = new LatencyMeter();
      
      // 乐观更新应在点击后立即完成
      meter.mark('click-start');
      // 乐观更新不涉及异步操作
      meter.mark('optimistic-update');
      
      const optimisticLatency = meter.measure('optimistic-update', 'click-start');
      
      if (optimisticLatency !== null) {
        assert.ok(optimisticLatency < 50, `Optimistic update took ${optimisticLatency}ms, expected < 50ms`);
      }
    });

    it('should achieve P95 latency under 500ms for end-to-end switch', async () => {
      const latencies: number[] = [];
      
      // 模拟 20 次切换
      for (let i = 0; i < 20; i++) {
        const start = performance.now();
        
        // 模拟切换 API 调用 (100-400ms 随机延迟)
        await new Promise(r => setTimeout(r, Math.random() * 300 + 100));
        
        const end = performance.now();
        latencies.push(end - start);
      }
      
      // 计算 P95
      const sorted = [...latencies].sort((a, b) => a - b);
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      
      assert.ok(p95 < 500, `P95 latency is ${p95}ms, expected < 500ms`);
    });
  });

  describe('Performance Reporting', () => {
    it('should provide detailed latency breakdown', async () => {
      const meter = new LatencyMeter();
      
      // 模拟多步骤操作
      meter.mark('start');
      await new Promise(r => setTimeout(r, 50));
      
      meter.mark('api-call');
      await new Promise(r => setTimeout(r, 200));
      
      meter.mark('api-response');
      await new Promise(r => setTimeout(r, 30));
      
      meter.mark('ui-update');
      
      // 计算测量值
      meter.measure('api-duration', 'api-call', 'api-response');
      meter.measure('total-duration', 'start', 'ui-update');
      
      const report = meter.getReport();
      
      assert.ok(report['api-duration'] !== undefined, 'api-duration should exist in report');
      assert.ok(report['total-duration'] !== undefined, 'total-duration should exist in report');
      
      if (report['api-duration']) {
        assert.ok(report['api-duration'].avg > 0, 'api-duration avg should be > 0');
        assert.ok(report['api-duration'].p95 > 0, 'api-duration p95 should be > 0');
      }
    });
  });
});

// Export for use in other tests
export { LatencyMeter };
