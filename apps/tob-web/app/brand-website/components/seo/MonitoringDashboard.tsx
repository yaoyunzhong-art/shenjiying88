'use client';

/**
 * SEO与GEO效果监测看板
 * 实时展示核心指标与系统状态
 */

import { useEffect, useState, useCallback } from 'react';
import { intelligentSystem, type AnomalyAlert, type OptimizationTask } from '../../../../lib/intelligent/self-system';
import { globalPerformanceMonitor } from '../../lib/seo/performance-monitor';

interface DashboardData {
  seoMetrics: {
    pageIndexCount: number;
    organicTraffic: number;
    clickThroughRate: number;
    crawlErrors: number;
    keywordTop10: number;
  };
  geoMetrics: {
    brandCitations: number;
    localExposure: number;
    localLeadConversion: number;
    aiReferenceRate: number;
  };
  performanceMetrics: {
    lcp: { avg: number; rating: string };
    fid: { avg: number; rating: string };
    cls: { avg: number; rating: string };
  };
  systemStatus: {
    isRunning: boolean;
    lastCycleTime: number;
    alertCount: number;
    pendingTaskCount: number;
  };
}

/**
 * 监测看板组件
 */
export default function SEOMonitoringDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [alerts, setAlerts] = useState<AnomalyAlert[]>([]);
  const [tasks, setTasks] = useState<OptimizationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = useCallback(() => {
    try {
      const health = intelligentSystem.getHealthStatus();
      const perfSummary = globalPerformanceMonitor.getSummary();

      setData({
        seoMetrics: {
          pageIndexCount: health.seoMetrics.pageIndexCount,
          organicTraffic: health.seoMetrics.organicTraffic,
          clickThroughRate: health.seoMetrics.clickThroughRate,
          crawlErrors: health.seoMetrics.crawlErrors,
          keywordTop10: Object.values(health.seoMetrics.keywordRankings).filter(
            (r) => r[0] <= 10
          ).length,
        },
        geoMetrics: {
          brandCitations: health.geoMetrics.brandCitations,
          localExposure: health.geoMetrics.localExposure,
          localLeadConversion: health.geoMetrics.localLeadConversion,
          aiReferenceRate: health.geoMetrics.brandCitations > 0
            ? (health.geoMetrics.brandCitations / 1000) * 100
            : 0,
        },
        performanceMetrics: {
          lcp: {
            avg: perfSummary.lcp?.avg || 0,
            rating: perfSummary.lcp?.avg
              ? globalPerformanceMonitor.getRating('lcp', perfSummary.lcp.avg)
              : 'good',
          },
          fid: {
            avg: perfSummary.fid?.avg || 0,
            rating: perfSummary.fid?.avg
              ? globalPerformanceMonitor.getRating('fid', perfSummary.fid.avg)
              : 'good',
          },
          cls: {
            avg: perfSummary.cls?.avg || 0,
            rating: perfSummary.cls?.avg
              ? globalPerformanceMonitor.getRating('cls', perfSummary.cls.avg)
              : 'good',
          },
        },
        systemStatus: {
          isRunning: health.isRunning,
          lastCycleTime: health.lastCycleTime,
          alertCount: health.alertCount,
          pendingTaskCount: health.pendingTaskCount,
        },
      });

      setAlerts(intelligentSystem.getAlerts());
      setTasks(intelligentSystem.getTasks());
    } catch (error) {
      console.error('[Dashboard] Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    if (autoRefresh) {
      const interval = setInterval(fetchData, 30000); // 30秒刷新
      return () => clearInterval(interval);
    }
  }, [autoRefresh, fetchData]);

  const handleRefresh = () => {
    setLoading(true);
    fetchData();
  };

  const handleTriggerCycle = async () => {
    setLoading(true);
    await intelligentSystem.triggerCycle();
    fetchData();
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">加载监测数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SEO与GEO智能监测看板</h1>
            <p className="text-sm text-gray-500 mt-1">神机营B2B官网 · 实时监控</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              自动刷新
            </label>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 disabled:opacity-50"
            >
              {loading ? '刷新中...' : '手动刷新'}
            </button>
            <button
              onClick={handleTriggerCycle}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium text-white disabled:opacity-50"
            >
              触发检测
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* 系统状态概览 */}
        <div className="mb-6 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${data?.systemStatus.isRunning ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-medium text-gray-900">
                系统状态: {data?.systemStatus.isRunning ? '运行中' : '已停止'}
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-600">
              <span>未解决告警: <strong className={data?.systemStatus.alertCount ? 'text-red-600' : 'text-green-600'}>{data?.systemStatus.alertCount || 0}</strong></span>
              <span>待执行任务: <strong className={data?.systemStatus.pendingTaskCount ? 'text-yellow-600' : 'text-green-600'}>{data?.systemStatus.pendingTaskCount || 0}</strong></span>
              <span>最后检测: <strong>{data?.systemStatus.lastCycleTime ? new Date(data.systemStatus.lastCycleTime).toLocaleTimeString() : '无'}</strong></span>
            </div>
          </div>
        </div>

        {/* 核心指标卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* SEO指标 */}
          <MetricCard title="页面收录量" value={data?.seoMetrics.pageIndexCount || 0} unit="页" trend="up" />
          <MetricCard title="自然流量" value={data?.seoMetrics.organicTraffic || 0} unit="次/月" trend="up" />
          <MetricCard title="点击率" value={data?.seoMetrics.clickThroughRate || 0} unit="%" trend="neutral" />
          <MetricCard title="Top10关键词" value={data?.seoMetrics.keywordTop10 || 0} unit="个" trend="up" />
        </div>

        {/* GEO指标 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <MetricCard title="AI品牌引用量" value={data?.geoMetrics.brandCitations || 0} unit="次" trend="up" />
          <MetricCard title="地域曝光量" value={data?.geoMetrics.localExposure || 0} unit="次" trend="up" />
          <MetricCard title="线索转化率" value={data?.geoMetrics.localLeadConversion || 0} unit="%" trend="up" />
          <MetricCard title="AI引用率" value={data?.geoMetrics.aiReferenceRate || 0} unit="%" trend="up" />
        </div>

        {/* Core Web Vitals */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Core Web Vitals 性能指标</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PerformanceMetric
              name="LCP"
              fullName="Largest Contentful Paint"
              value={data?.performanceMetrics.lcp.avg || 0}
              unit="ms"
              rating={data?.performanceMetrics.lcp.rating || 'good'}
              goodThreshold={2500}
            />
            <PerformanceMetric
              name="FID"
              fullName="First Input Delay"
              value={data?.performanceMetrics.fid.avg || 0}
              unit="ms"
              rating={data?.performanceMetrics.fid.rating || 'good'}
              goodThreshold={100}
            />
            <PerformanceMetric
              name="CLS"
              fullName="Cumulative Layout Shift"
              value={data?.performanceMetrics.cls.avg || 0}
              unit=""
              rating={data?.performanceMetrics.cls.rating || 'good'}
              goodThreshold={0.1}
              decimals={3}
            />
          </div>
        </div>

        {/* 告警列表 */}
        {alerts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">异常告警</h2>
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert) => (
                <AlertItem key={alert.id} alert={alert} />
              ))}
            </div>
          </div>
        )}

        {/* 优化任务 */}
        {tasks.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">优化任务队列</h2>
            <div className="space-y-3">
              {tasks.slice(0, 5).map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/**
 * 指标卡片
 */
function MetricCard({ title, value, unit, trend }: { title: string; value: number; unit: string; trend: 'up' | 'down' | 'neutral' }) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-3xl font-bold text-gray-900">
        {value.toLocaleString()}
        <span className="text-lg font-normal text-gray-400 ml-1">{unit}</span>
      </p>
      <p className={`text-xs mt-2 ${trendColors[trend]}`}>
        {trend === 'up' && '↑ 较上周'}
        {trend === 'down' && '↓ 较上周'}
        {trend === 'neutral' && '→ 持平'}
      </p>
    </div>
  );
}

/**
 * 性能指标展示
 */
function PerformanceMetric({
  name,
  fullName,
  value,
  unit,
  rating,
  goodThreshold,
  decimals = 0,
}: {
  name: string;
  fullName: string;
  value: number;
  unit: string;
  rating: string;
  goodThreshold: number;
  decimals?: number;
}) {
  const ratingConfig = {
    good: { color: 'bg-green-500', text: '良好' },
    'needs-improvement': { color: 'bg-yellow-500', text: '需改进' },
    poor: { color: 'bg-red-500', text: '较差' },
  };

  const config = ratingConfig[rating as keyof typeof ratingConfig] || ratingConfig.good;

  return (
    <div className="text-center">
      <p className="text-sm text-gray-500 mb-2">{fullName}</p>
      <p className="text-4xl font-bold text-gray-900 mb-2">
        {value.toFixed(decimals)}
        <span className="text-lg font-normal text-gray-400">{unit}</span>
      </p>
      <div className="flex items-center justify-center gap-2">
        <span className={`w-3 h-3 rounded-full ${config.color}`} />
        <span className="text-sm text-gray-600">{config.text}</span>
      </div>
      <p className="text-xs text-gray-400 mt-1">目标: {goodThreshold}{unit}以内</p>
    </div>
  );
}

/**
 * 告警项
 */
function AlertItem({ alert }: { alert: AnomalyAlert }) {
  const severityConfig = {
    low: { color: 'text-yellow-600 bg-yellow-50', label: '低' },
    medium: { color: 'text-orange-600 bg-orange-50', label: '中' },
    high: { color: 'text-red-600 bg-red-50', label: '高' },
    critical: { color: 'text-purple-600 bg-purple-50', label: '严重' },
  };

  const config = severityConfig[alert.severity] || severityConfig.low;

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <span className={`px-2 py-1 rounded text-xs font-medium ${config.color}`}>{config.label}</span>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{alert.rootCause}</p>
        <p className="text-xs text-gray-500 mt-1">
          检测时间: {new Date(alert.detectedAt).toLocaleString()} · 偏差: {(alert.deviation * 100).toFixed(1)}%
        </p>
      </div>
    </div>
  );
}

/**
 * 任务项
 */
function TaskItem({ task }: { task: OptimizationTask }) {
  const statusConfig = {
    pending: { color: 'text-yellow-600 bg-yellow-50', label: '待执行' },
    executing: { color: 'text-blue-600 bg-blue-50', label: '执行中' },
    completed: { color: 'text-green-600 bg-green-50', label: '已完成' },
    failed: { color: 'text-red-600 bg-red-50', label: '失败' },
  };

  const config = statusConfig[task.status] || statusConfig.pending;

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      <span className={`px-2 py-1 rounded text-xs font-medium ${config.color}`}>{config.label}</span>
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">{task.action}</p>
        <p className="text-xs text-gray-500 mt-1">
          优先级: {task.priority} · 预计影响: {(task.estimatedImpact * 100).toFixed(0)}%
        </p>
      </div>
    </div>
  );
}
