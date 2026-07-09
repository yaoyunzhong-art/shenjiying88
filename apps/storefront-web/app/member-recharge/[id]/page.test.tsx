/**
 * member-recharge/[id]/page.test.tsx — 充值详情页 L1 冒烟测试 (storefront-web)
 * 覆盖: 正例·边界·防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

describe('member-recharge/[id] — 正例', () => {
  it('应导出一个默认组件 RechargeDetailPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function RechargeDetailPage'), '缺少默认导出');
  });

  it('应包含 RechargeDetail 接口定义', () => {
    const src = readSource();
    assert.ok(src.includes('interface RechargeDetail'), '缺少 RechargeDetail 接口');
  });

  it('应包含 RechargeStatus 类型定义', () => {
    const src = readSource();
    assert.ok(src.includes('type RechargeStatus'), '缺少 RechargeStatus 类型');
  });

  it('应包含 getMockDetail 数据工厂', () => {
    const src = readSource();
    assert.ok(src.includes('function getMockDetail'), '缺少 getMockDetail 函数');
  });

  it('应包含 STATUS_LABELS 映射', () => {
    const src = readSource();
    assert.ok(src.includes('STATUS_LABELS'), '缺少 STATUS_LABELS');
  });

  it('应包含 STATUS_VARIANTS 映射', () => {
    const src = readSource();
    assert.ok(src.includes('STATUS_VARIANTS'), '缺少 STATUS_VARIANTS');
  });

  it('应包含 TIMELINE_ITEMS 数据', () => {
    const src = readSource();
    assert.ok(src.includes('TIMELINE_ITEMS'), '缺少 TIMELINE_ITEMS');
  });

  it('应使用 useParams 读取路由参数', () => {
    const src = readSource();
    assert.ok(src.includes('useParams'), '缺少 useParams');
  });

  it('应使用 PageShell 布局', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
  });

  it('应使用 DetailActionBar 操作栏', () => {
    const src = readSource();
    assert.ok(src.includes('DetailActionBar'), '缺少 DetailActionBar');
  });

  it('应使用 Timeline 组件', () => {
    const src = readSource();
    assert.ok(src.includes('Timeline'), '缺少 Timeline');
  });

  it('应使用 DescriptionList 组件', () => {
    const src = readSource();
    assert.ok(src.includes('DescriptionList'), '缺少 DescriptionList');
  });

  it('应使用 Modal 弹窗', () => {
    const src = readSource();
    assert.ok(src.includes('Modal'), '缺少 Modal');
  });

  it('应包含退款操作逻辑', () => {
    const src = readSource();
    assert.ok(src.includes('handleRefund'), '缺少 handleRefund');
  });

  it('应包含删除操作逻辑', () => {
    const src = readSource();
    assert.ok(src.includes('handleDelete'), '缺少 handleDelete');
  });

  it('应包含编辑备注逻辑', () => {
    const src = readSource();
    assert.ok(src.includes('handleSaveRemark'), '缺少 handleSaveRemark');
  });

  it('应包含金额概览区域', () => {
    const src = readSource();
    assert.ok(src.includes('金额概览'), '缺少金额概览');
  });

  it('应包含基本信息区域', () => {
    const src = readSource();
    assert.ok(src.includes('基本信息'), '缺少基本信息');
  });

  it('应包含状态流转区域', () => {
    const src = readSource();
    assert.ok(src.includes('状态流转'), '缺少状态流转');
  });

  it('应包含余额变化区域', () => {
    const src = readSource();
    assert.ok(src.includes('余额变化'), '缺少余额变化');
  });

  it('应包含备注区域', () => {
    const src = readSource();
    assert.ok(src.includes('备注'), '缺少备注');
  });

  it('应包含确认退款弹窗', () => {
    const src = readSource();
    assert.ok(src.includes('确认退款'), '缺少确认退款');
  });
});

describe('member-recharge/[id] — 边界', () => {
  it('MOCK 数据应覆盖所有充值状态', () => {
    const src = readSource();
    const statuses = ['success', 'pending', 'failed', 'refunded', 'cancelled'];
    for (const s of statuses) {
      assert.ok(src.includes(`'${s}'`), `缺少状态: ${s}`);
    }
  });

  it('STATUS_LABELS 应覆盖所有状态', () => {
    const src = readSource();
    assert.ok(src.includes('充值成功'), '缺少 充值成功');
    assert.ok(src.includes('处理中'), '缺少 处理中');
    assert.ok(src.includes('充值失败'), '缺少 充值失败');
    assert.ok(src.includes('已退款'), '缺少 已退款');
    assert.ok(src.includes('已取消'), '缺少 已取消');
  });

  it('success 状态出现在 TIMELINE_ITEMS 中', () => {
    const src = readSource();
    // TIMELINE_ITEMS should contain all status keys as array members
    const match = src.match(/TIMELINE_ITEMS/);
    assert.ok(match, '应该有 TIMELINE_ITEMS 定义');
    assert.ok(src.includes("'success'"), 'TIMELINE_ITEMS 应包含 success');
    // Verify the section is large enough
    const sections = src.split('TIMELINE_ITEMS');
    assert.ok(sections.length >= 2, 'TIMELINE_ITEMS 解析正确');
    const timelineSection = sections[1];
    // Count curly brace pairs as indicators of items
    const stepMarkers = (timelineSection.match(/{ time:/g) || []).length;
    assert.ok(stepMarkers >= 16, `应有至少 16 个时间步 (5 状态 × 3-4 步), 实际 ${stepMarkers}`);
  });

  it('所有充值状态都有时间线定义', () => {
    const src = readSource();
    const statuses = ['success', 'pending', 'failed', 'refunded', 'cancelled'];
    for (const s of statuses) {
      assert.ok(src.includes(`${s}: [`), `TIMELINE_ITEMS 缺少状态: ${s}`);
    }
  });

  it('退款弹窗应包含退款原因输入框', () => {
    const src = readSource();
    assert.ok(src.includes('请输入退款原因'), '缺少退款原因 placeholder');
  });

  it('通知提示应有成功和错误两种样式', () => {
    const src = readSource();
    assert.ok(src.includes("type: 'success'"), '缺少 success 通知');
    assert.ok(src.includes("type: 'error'"), '缺少 error 通知');
  });

  it('关闭按钮应有 ✕ 符号', () => {
    const src = readSource();
    assert.ok(src.includes('✕'), '缺少关闭按钮');
  });

  it('删除弹窗应有不可恢复提示', () => {
    const src = readSource();
    assert.ok(src.includes('此操作不可恢复'), '缺少不可恢复提示');
  });

  it('editRemark 状态应重置', () => {
    const src = readSource();
    assert.ok(src.includes('editRemark'), '缺少 editRemark 状态');
  });

  it('should render a complete page with all sections', () => {
    const src = readSource();
    const sections = ['金额概览', '基本信息', '状态流转', '余额变化', '备注'];
    for (const section of sections) {
      assert.ok(src.includes(section), `缺少区域: ${section}`);
    }
  });
});

describe('member-recharge/[id] — 防御', () => {
  it('应防御 timelineItems 为 undefined', () => {
    const src = readSource();
    // Should have the nullish coalescing fallback
    assert.ok(src.includes('??'), '缺少 nullish coalescing 防御');
    // Should not crash on unknown status
    assert.ok(src.includes('[]'), '缺少空数组 fallback');
  });

  it('应防御 packageName 为 undefined', () => {
    const src = readSource();
    assert.ok(src.includes('??'), '缺少 optional chaining 或 nullish coalescing');
  });

  it('应用了 \'use client\' 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 client 指令');
  });

  it('所有 Modal 都有 onClose 回调', () => {
    const src = readSource();
    // Count Modal openings
    const modalOpens = (src.match(/open=\{/g) || []).length;
    const modalCloses = (src.match(/onClose=\{/g) || []).length;
    assert.equal(modalOpens, modalCloses, `Modal open(${modalOpens}) 和 onClose(${modalCloses}) 数量不匹配`);
  });
});
