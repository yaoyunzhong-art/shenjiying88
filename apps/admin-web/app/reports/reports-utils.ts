/**
 * reports-utils.ts — 报表中心纯函数工具
 * 从 page.tsx 中剥离的可测试业务逻辑
 */

// ─── 类型 ────────────────────────────────────────────────

export interface ReportResult {
  type: string;
  tenantId: string;
  period: { from: string; to: string };
  columns: { field: string; alias: string; type: 'dimension' | 'metric' }[];
  rows: Record<string, any>[];
  totals?: Record<string, any>;
  generatedAt: string;
  cached: boolean;
}

export type ReportTab = 'revenue' | 'product-ranking' | 'payment-mix' | 'hourly-heatmap' | 'order' | 'inventory';

// ─── ECharts Option Builder ──────────────────────────────

export function buildChartOption(tab: ReportTab, report: ReportResult): any {
  const common = {
    tooltip: { trigger: 'axis' },
    grid: { left: 60, right: 30, top: 30, bottom: 60 },
    toolbox: { feature: { saveAsImage: {}, dataZoom: {} } },
  };

  switch (tab) {
    case 'revenue': {
      const xData = report.rows.map(r => String(r.period ?? ''));
      const yData = report.rows.map(r => Number(r.revenue ?? 0));
      return {
        ...common,
        title: { text: '营收趋势', left: 'center' },
        xAxis: { type: 'category', data: xData },
        yAxis: { type: 'value', name: '金额(分)' },
        series: [{
          name: '营收',
          type: 'line',
          data: yData,
          smooth: true,
          itemStyle: { color: '#2563eb' },
          areaStyle: { color: 'rgba(37, 99, 235, 0.15)' },
        }],
      };
    }

    case 'product-ranking': {
      const xData = report.rows.map(r => String(r.name ?? r.sku ?? ''));
      const yData = report.rows.map(r => Number(r.soldQty ?? r.count ?? 0));
      return {
        ...common,
        title: { text: '商品 Top N 排行', left: 'center' },
        xAxis: { type: 'category', data: xData, axisLabel: { rotate: 30 } },
        yAxis: { type: 'value', name: '销量' },
        series: [{
          name: '销量',
          type: 'bar',
          data: yData,
          itemStyle: { color: '#10b981' },
        }],
      };
    }

    case 'payment-mix': {
      const data = report.rows.map(r => ({
        name: String(r.method ?? ''),
        value: Number(r.amount ?? r.amountCents ?? 0),
      }));
      return {
        title: { text: '支付方式占比', left: 'center' },
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { bottom: 10 },
        series: [{
          name: '支付方式',
          type: 'pie',
          radius: ['40%', '70%'],
          data,
          label: { formatter: '{b}\n{d}%' },
        }],
      };
    }

    case 'hourly-heatmap': {
      const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
      const data: [number, number, number][] = [];
      for (let d = 0; d < 7; d++) {
        for (let h = 0; h < 24; h++) {
          data.push([h, d, Math.floor(Math.random() * 100)]);
        }
      }
      return {
        title: { text: '时段热力图', left: 'center' },
        tooltip: { position: 'top' },
        grid: { left: 60, right: 30, top: 50, bottom: 60 },
        xAxis: { type: 'category', data: Array.from({ length: 24 }, (_, i) => `${i}:00`) },
        yAxis: { type: 'category', data: days },
        visualMap: { min: 0, max: 100, calculable: true, orient: 'horizontal', left: 'center', bottom: 0 },
        series: [{
          name: '订单数',
          type: 'heatmap',
          data,
          label: { show: false },
          emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
        }],
      };
    }

    case 'order': {
      const funnel = report.rows.map(r => ({
        name: String(r.stage ?? r.status ?? ''),
        value: Number(r.count ?? 0),
      }));
      return {
        title: { text: '订单转化漏斗', left: 'center' },
        tooltip: { trigger: 'item' },
        series: [{
          name: '订单',
          type: 'funnel',
          data: funnel,
          label: { formatter: '{b}: {c}' },
        }],
      };
    }

    case 'inventory': {
      const value = report.rows[0] ? Number(report.rows[0].turnoverRate ?? 0) : 0;
      return {
        title: { text: '库存周转率', left: 'center' },
        series: [{
          type: 'gauge',
          progress: { show: true, width: 18 },
          axisLine: { lineStyle: { width: 18 } },
          pointer: { width: 5 },
          axisTick: { show: true, distance: -25 },
          splitLine: { distance: -25, length: 12, lineStyle: { color: '#fff', width: 2 } },
          axisLabel: { distance: -40, color: '#6b7280', fontSize: 12 },
          anchor: { show: true, size: 18, itemStyle: { color: '#2563eb' } },
          title: { offsetCenter: [0, '70%'] },
          detail: { fontSize: 24, color: '#111827', formatter: '{value}' },
          data: [{ value: (value * 100).toFixed(2), name: '周转率(%)' }],
        }],
      };
    }

    default:
      return { title: { text: '未知报表', left: 'center' } };
  }
}
