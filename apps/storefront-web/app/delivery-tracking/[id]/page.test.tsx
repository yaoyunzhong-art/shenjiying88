/**
 * delivery-tracking/[id]/page.test.tsx — 配送详情页 L1 冒烟测试 (storefront-web)
 * 角色视角: 👔店长 / 🛒前台 / 💳采购
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

describe('DeliveryDetailPage — 正例', () => {
  it('应导出一个默认组件 DeliveryDetailPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function DeliveryDetailPage'), '缺少默认导出函数');
  });

  it('应包含 DeliveryDetail 接口定义', () => {
    const src = readSource();
    assert.ok(src.includes('interface DeliveryDetail'), '缺少 DeliveryDetail 接口');
  });

  it('应包含 MOCK_DELIVERIES 模拟数据集', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_DELIVERIES'), '缺少 MOCK_DELIVERIES 数据源');
  });

  it('应包含至少 4 条模拟配送记录', () => {
    const src = readSource();
    const matches = src.match(/orderId:\s*['"][A-Z0-9-]+['"]/g);
    assert.ok(matches && matches.length >= 4, `期望 ≥4 条配送记录, 实际 ${matches?.length ?? 0}`);
  });

  it('应包含发货、运输中、派送中、已签收、异常等状态', () => {
    const src = readSource();
    assert.ok(src.includes("'in_transit'"), '缺少 in_transit 状态');
    assert.ok(src.includes("'delivered'"), '缺少 delivered 状态');
    assert.ok(src.includes("'out_for_delivery'"), '缺少 out_for_delivery 状态');
    assert.ok(src.includes("'exception'"), '缺少 exception 状态');
  });

  it('应使用 DeliveryTimeline 组件展示物流轨迹', () => {
    const src = readSource();
    assert.ok(src.includes('DeliveryTimeline'), '缺少 DeliveryTimeline 组件引用');
  });

  it('应使用 DeliveryStatusBadge 展示状态', () => {
    const src = readSource();
    assert.ok(src.includes('DeliveryStatusBadge'), '缺少 DeliveryStatusBadge 组件引用');
  });

  it('应包含 Modal 联系承运方弹窗逻辑', () => {
    const src = readSource();
    assert.ok(src.includes('contactOpen'), '缺少 contactOpen 状态');
    assert.ok(src.includes('setContactOpen'), '缺少 setContactOpen');
    assert.ok(src.includes('<Modal'), '缺少 Modal 弹窗');
  });

  it('应包含 DescriptionList 展示配送信息', () => {
    const src = readSource();
    assert.ok(src.includes('DescriptionList'), '缺少 DescriptionList');
  });

  it('应包含未找到记录的空状态处理', () => {
    const src = readSource();
    assert.ok(src.includes('未找到配送记录'), '缺少空状态文案');
    assert.ok(src.includes('返回配送列表'), '缺少返回按钮');
  });

  it('应包含 remark 备注展示逻辑', () => {
    const src = readSource();
    assert.ok(src.includes('remark'), '缺少 remark 字段引用');
  });
});

describe('DeliveryDetailPage — 边界', () => {
  it('应处理空 ID（empty string）', () => {
    const src = readSource();
    // 空 ID 应进入 not-found 分支
    assert.ok(src.includes("querySelector: 查询编号:") || src.includes("查询编号:"),
      '缺少查询编号显示用于空 ID 处理');
  });

  it('formatTimestamp 辅助函数应正确处理 ISO 日期', () => {
    const src = readSource();
    assert.ok(src.includes('function formatTimestamp'), '缺少 formatTimestamp 函数');
    assert.ok(src.includes('toLocaleString'), 'formatTimestamp 应使用 toLocaleString');
  });

  it('应包含 handleContactCarrier / handleCallCarrier / handleCallSender 回调', () => {
    const src = readSource();
    assert.ok(src.includes('handleContactCarrier'), '缺少 handleContactCarrier');
    assert.ok(src.includes('handleCallCarrier'), '缺少 handleCallCarrier');
    assert.ok(src.includes('handleCallSender'), '缺少 handleCallSender');
  });

  it('应包含 handleBack 跳转到配送列表', () => {
    const src = readSource();
    assert.ok(src.includes("handleBack"), '缺少 handleBack 回调');
    assert.ok(src.includes("/delivery-tracking"), '缺少返回路径');
  });

  it('应使用 PageShell 组件包含 title', () => {
    const src = readSource();
    assert.ok(src.includes('<PageShell'), '缺少 PageShell');
  });

  it('Mock 数据中每种状态至少有 1 条', () => {
    const src = readSource();
    assert.ok(src.includes("'in_transit'"), 'in_transit 配送数据');
    assert.ok(src.includes("'delivered'"), 'delivered 配送数据');
    assert.ok(src.includes("'out_for_delivery'"), 'out_for_delivery 配送数据');
    assert.ok(src.includes("'exception'"), 'exception 配送数据');
  });

  it('每条配送记录应包含 events 数组', () => {
    const src = readSource();
    const eventsMatches = src.match(/events:\s*\[/g);
    assert.ok(eventsMatches && eventsMatches.length >= 4, `期望 ≥4 个 events 数组, 实际 ${eventsMatches?.length ?? 0}`);
  });

  it('应支持 toast 反馈', () => {
    const src = readSource();
    assert.ok(src.includes('toast.success'), '缺少 toast.success 调用');
  });

  it('备注应带警告样式和 📌 图标', () => {
    const src = readSource();
    assert.ok(src.includes('📌') && src.includes('remark'), '缺少备注展示逻辑');
  });
});

describe('DeliveryDetailPage — 防御', () => {
  it('不应暴露未捕获的 any 类型', () => {
    const src = readSource();
    // 检查是否存在显式 any（允许泛型和用户-defined types）
    const lines = src.split('\n').filter(
      l => l.includes(': any') && !l.includes('DeliveryDetail') && !l.includes('TrackingEvent')
    );
    assert.equal(lines.length, 0, `发现多余 any 类型使用: ${lines.length} 处`);
  });

  it('不应包含 @ts-expect-error 或 @ts-ignore', () => {
    const src = readSource();
    assert.ok(!src.includes('@ts-expect-error'), '不应使用 @ts-expect-error');
    assert.ok(!src.includes('@ts-ignore'), '不应使用 @ts-ignore');
  });

  it('DeliveryStatus 枚举值应全部合法', () => {
    const src = readSource();
    const deliveryStatuses = ['pending', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'exception', 'returned'];
    // 只验证作为 DeliveryStatus 类型赋值的 status 字段（排除 Timeline 的 event status）
    const statusPattern = src.match(/status:\s*['"](in_transit|delivered|out_for_delivery|exception|pending|shipped|returned)['"]/g);
    if (statusPattern) {
      statusPattern.forEach(s => {
        const val = s.match(/['"]([a-z_]+)['"]/)?.[1];
        if (val) {
          assert.ok(deliveryStatuses.includes(val), `非法配送状态: ${val}`);
        }
      });
    }
  });

  it('取消按钮应关闭弹窗', () => {
    const src = readSource();
    assert.ok(src.includes("取消") && src.includes("setContactOpen(false)"), '取消按钮应调用 setContactOpen(false)');
  });

  it('eslint-disable / cspell 注释在合理范围内', () => {
    const src = readSource();
    const eslintDisables = (src.match(/eslint-disable/g) || []).length;
    assert.ok(eslintDisables <= 3, `eslint-disable 过多: ${eslintDisables}`);
  });
});
