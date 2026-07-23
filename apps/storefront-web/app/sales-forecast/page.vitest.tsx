/**
 * sales-forecast/page.vitest.tsx — 销售预测 L2 组件测试 (vitest + @testing-library/react)
 * 覆盖: 渲染 · 快捷指标 · 品类预测表格 · 搜索 · 预测模型对比 · 准确性历史 · 季节因子 · 边界
 * 角色: 👔店长 · 🎯运营专员
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

import SalesForecastPage from './page';

async function waitForData() {
  await screen.findByText('📈 销售预测', {}, { timeout: 5000 });
}

describe('SalesForecastPage — 销售预测', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 加载状态测试 ======

  test('renders without crashing', () => {
    expect(() => render(<SalesForecastPage />)).not.toThrow();
  });

  // ====== 渲染测试 ======

  test('renders page title', async () => {
    render(<SalesForecastPage />);
    await waitForData();
    expect(screen.getByText('📈 销售预测')).toBeInTheDocument();
  });

  test('renders subtitle', async () => {
    render(<SalesForecastPage />);
    await waitForData();
    expect(screen.getByText(/AI 驱动的门店销售趋势分析与预测/)).toBeInTheDocument();
  });

  test('renders last updated timestamp', async () => {
    render(<SalesForecastPage />);
    await waitForData();
    expect(screen.getByText(/最后更新/)).toBeInTheDocument();
  });

  // ====== 快捷指标测试 ======

  test('renders forecast stats', async () => {
    render(<SalesForecastPage />);
    await waitForData();
    expect(screen.getByText('明日预测')).toBeInTheDocument();
    expect(screen.getByText('周同比')).toBeInTheDocument();
    expect(screen.getByText('预测置信度')).toBeInTheDocument();
    expect(screen.getByText('库存建议')).toBeInTheDocument();
  });

  test('renders forecast stat values', async () => {
    render(<SalesForecastPage />);
    await waitForData();
    expect(screen.getByText('¥52,380')).toBeInTheDocument();
    expect(screen.getByText('+12.5%')).toBeInTheDocument();
    expect(screen.getByText('88%')).toBeInTheDocument();
  });

  // ====== 预测面板测试 ======

  test('renders sales forecast panel', async () => {
    render(<SalesForecastPage />);
    await waitForData();
    expect(screen.getByText('Shenjiying 旗舰店 — 7 日销售预测')).toBeInTheDocument();
  });

  test('renders panel description', async () => {
    render(<SalesForecastPage />);
    await waitForData();
    expect(screen.getByText(/基于历史交易、季节因子和会员活跃度的多模型集成预测/)).toBeInTheDocument();
  });

  // ====== 品类预测表格测试 ======

  test('renders category forecast table', async () => {
    render(<SalesForecastPage />);
    await waitForData();
    expect(screen.getByText('📊 品类销售预测')).toBeInTheDocument();
  });

  test('renders all 5 categories', async () => {
    render(<SalesForecastPage />);
    await waitForData();
    expect(screen.getByText('男装')).toBeInTheDocument();
    expect(screen.getByText('女装')).toBeInTheDocument();
    expect(screen.getByText('童装')).toBeInTheDocument();
    expect(screen.getByText('配饰')).toBeInTheDocument();
    expect(screen.getByText('鞋类')).toBeInTheDocument();
  });

  test('renders forecast amounts for categories', async () => {
    render(<SalesForecastPage />);
    await waitForData();
    expect(screen.getByText('¥18,600')).toBeInTheDocument();
    expect(screen.getByText('¥22,400')).toBeInTheDocument();
    expect(screen.getByText('¥8,200')).toBeInTheDocument();
  });

  test('renders growth rates with percentages', async () => {
    render(<SalesForecastPage />);
    await waitForData();
    expect(screen.getByText('+14.8%')).toBeInTheDocument();
    expect(screen.getByText('+11.4%')).toBeInTheDocument();
  });

  test('renders stock suggestions', async () => {
    render(<SalesForecastPage />);
    await waitForData();
    expect(screen.getByText('加单 420 件')).toBeInTheDocument();
    expect(screen.getByText('加单 580 件')).toBeInTheDocument();
    expect(screen.getByText('维持库存')).toBeInTheDocument();
  });

  test('renders confidence values for categories', async () => {
    render(<SalesForecastPage />);
    await waitForData();
    expect(screen.getByText('89%')).toBeInTheDocument();
    expect(screen.getByText('87%')).toBeInTheDocument();
  });

  // ====== 品类搜索测试 ======

  test('category search input renders', async () => {
    render(<SalesForecastPage />);
    await waitForData();
    const searchInput = screen.getByTestId('category-search-input');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute('placeholder', '搜索品类…');
  });

  test('category search filters table rows', async () => {
    render(<SalesForecastPage />);
    await waitForData();
    const searchInput = screen.getByTestId('category-search-input');
    fireEvent.change(searchInput, { target: { value: '女装' } });
    await waitFor(() => {
      expect(screen.getByText('女装')).toBeInTheDocument();
      expect(screen.queryByText('男装')).not.toBeInTheDocument();
    });
  });

  test('category search clears to show all', async () => {
    render(<SalesForecastPage />);
    await waitForData();
    const searchInput = screen.getByTestId('category-search-input');
    fireEvent.change(searchInput, { target: { value: '男装' } });
    await waitFor(() => {
      expect(screen.queryByText('女装')).not.toBeInTheDocument();
    });
    fireEvent.change(searchInput, { target: { value: '' } });
    await waitFor(() => {
      expect(screen.getByText('女装')).toBeInTheDocument();
    });
  });

  // ====== 季节因子测试 ======

  test('renders seasonal factor panel', async () => {
    render(<SalesForecastPage />);
    await waitForData();
    expect(screen.getByText('🌤️ 季节因子分析')).toBeInTheDocument();
  });

  test('renders all 5 seasonal factors', async () => {
    render(<SalesForecastPage />);
    await waitForData();
    expect(screen.getByText('夏季高温')).toBeInTheDocument();
    expect(screen.getByText('暑假出行')).toBeInTheDocument();
    expect(screen.getByText('新品上市')).toBeInTheDocument();
    expect(screen.getByText('库存压力')).toBeInTheDocument();
    expect(screen.getByText('竞品活动')).toBeInTheDocument();
  });

  test('renders factor impact values', async () => {
    render(<SalesForecastPage />);
    await waitForData();
    expect(screen.getByText(/↑ 8%/)).toBeInTheDocument();
    expect(screen.getByText(/↑ 5%/)).toBeInTheDocument();
    expect(screen.getByText(/↑ 12%/)).toBeInTheDocument();
    expect(screen.getByText(/↓ 6%/)).toBeInTheDocument();
    expect(screen.getByText(/↓ 4%/)).toBeInTheDocument();
  });

  test('renders factor descriptions', async () => {
    render(<SalesForecastPage />);
    await waitForData();
    expect(screen.getByText(/持续高温带动夏装、冷饮等品类需求/)).toBeInTheDocument();
    expect(screen.getByText(/商圈内同类品牌折扣促销活动/)).toBeInTheDocument();
  });

  // ====== 预测模型对比测试 ======

  test('renders model comparison section', async () => {
    render(<SalesForecastPage />);
    await waitForData();
    expect(screen.getByText('🤖 预测模型对比')).toBeInTheDocument();
  });

  test('renders all 4 models', async () => {
    render(<SalesForecastPage />);
    await waitForData();
    expect(screen.getByText('ARIMA + 季节分解')).toBeInTheDocument();
    expect(screen.getByText('LSTM 深度学习')).toBeInTheDocument();
    expect(screen.getByText('Prophet 模型')).toBeInTheDocument();
    expect(screen.getByText('集成模型')).toBeInTheDocument();
  });

  test('renders model accuracy values', async () => {
    render(<SalesForecastPage />);
    await waitForData();
    expect(screen.getByText('91%')).toBeInTheDocument();
    expect(screen.getByText('93%')).toBeInTheDocument();
    expect(screen.getByText('94%')).toBeInTheDocument();
  });

  test('renders model status badges', async () => {
    render(<SalesForecastPage />);
    await waitForData();
    expect(screen.getByText('运行中')).toBeInTheDocument();
    expect(screen.getByText('训练中')).toBeInTheDocument();
  });

  test('renders model descriptions', async () => {
    render(<SalesForecastPage />);
    await waitForData();
    expect(screen.getByText('基于历史时序的统计模型')).toBeInTheDocument();
    expect(screen.getByText('多模型加权集成预测')).toBeInTheDocument();
  });

  // ====== 准确性历史测试 ======

  test('renders accuracy history section', async () => {
    render(<SalesForecastPage />);
    await waitForData();
    expect(screen.getByText('🎯 预测准确性追踪')).toBeInTheDocument();
  });

  test('renders all 4 accuracy periods', async () => {
    render(<SalesForecastPage />);
    await waitForData();
    expect(screen.getByText('7月第1周')).toBeInTheDocument();
    expect(screen.getByText('7月第2周')).toBeInTheDocument();
    expect(screen.getByText('7月第3周')).toBeInTheDocument();
    expect(screen.getByText('7月第4周(当前)')).toBeInTheDocument();
  });

  test('renders accuracy values', async () => {
    render(<SalesForecastPage />);
    await waitForData();
    expect(screen.getByText('1.81%')).toBeInTheDocument();
    expect(screen.getByText('1.70%')).toBeInTheDocument();
    expect(screen.getByText('2.69%')).toBeInTheDocument();
    expect(screen.getByText('0.95%')).toBeInTheDocument();
  });

  // ====== 底部说明测试 ======

  test('renders footer disclaimer', async () => {
    render(<SalesForecastPage />);
    await waitForData();
    expect(screen.getByText(/预测数据仅供决策参考/)).toBeInTheDocument();
  });

  // ====== 边界情况 ======

  test('empty category search shows no results', async () => {
    render(<SalesForecastPage />);
    await waitForData();
    const searchInput = screen.getByTestId('category-search-input');
    fireEvent.change(searchInput, { target: { value: 'zzz' } });
    await waitFor(() => {
      expect(screen.queryByText('男装')).not.toBeInTheDocument();
      expect(screen.queryByText('女装')).not.toBeInTheDocument();
    });
  });

  test('handles gauge computation without error', async () => {
    render(<SalesForecastPage />);
    await waitForData();
    // The gaugeValue is computed based on FORECAST_DATA
    // It should not throw
    expect(screen.getByText('📈 销售预测')).toBeInTheDocument();
  });

  test('activeSection state updates without crash', async () => {
    render(<SalesForecastPage />);
    await waitForData();
    // activeSection is used but not directly rendered — just verify no crash
    expect(screen.getByText(/预测数据仅供决策参考/)).toBeInTheDocument();
  });
});
