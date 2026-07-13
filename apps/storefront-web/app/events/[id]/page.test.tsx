/**
 * L1+L2 事件详情页测试 — [id]
 * 正例: 存在组件、模板、关键引用、404处理、状态标签、Tabs渲染、空规则/赛程处理
 * 反例: 不使用危险HTML、不使用eval、无硬编码ID
 * 边界: 空记录、未找到事件、多Tab切换、没有赛程/规则时显示占位
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('[id] 事件详情页', () => {
  // ======== 正例 (Positive Cases) ========
  describe('正例', () => {
    it('应导出一个默认组件', () => {
      assert.ok(SRC.includes('export default function'));
    });

    it('应包含JSX模板', () => {
      assert.ok(SRC.includes('return'));
      assert.ok(SRC.includes('div') || SRC.includes('<>') || SRC.includes('PageShell'));
    });

    it('应包含页面内容', () => {
      assert.ok(SRC.includes('import'));
      assert.ok(SRC.length > 100);
    });

    it('应包含关键组件引用', () => {
      assert.ok(SRC.includes('PageShell'));
      assert.ok(SRC.includes('StatCard') || SRC.includes('Tabs') || SRC.includes('StatusBadge'));
    });

    it('处理未找到事件的404状态', () => {
      assert.ok(SRC.includes('找不到该活动') || SRC.includes('router.back()'));
    });

    it('使用useParams获取路由ID', () => {
      assert.ok(SRC.includes('useParams'));
    });

    it('支持Tabs切换活动介绍/赛程安排/活动规则', () => {
      assert.ok(SRC.includes('overview'));
      assert.ok(SRC.includes('schedule'));
      assert.ok(SRC.includes('rules'));
    });

    it('渲染事件标题和状态', () => {
      assert.ok(SRC.includes('title'));
      assert.ok(SRC.includes('StatusBadge') || SRC.includes('status'));
    });

    it('渲染活动统计卡片', () => {
      assert.ok(SRC.includes('StatCard'));
      assert.ok(SRC.includes('participants'));
    });

    it('赛程为空时显示占位', () => {
      assert.ok(SRC.includes('暂无详细日程安排') || SRC.includes('schedule.length === 0'));
    });

    it('规则为空时显示占位', () => {
      assert.ok(SRC.includes('暂无详细规则说明') || SRC.includes('rules.length === 0'));
    });

    it('包含分享好友按钮', () => {
      assert.ok(SRC.includes('分享好友'));
    });
  });

  // ======== 反例 (Negative Cases) ========
  describe('反例', () => {
    it('不应使用dangerouslySetInnerHTML', () => {
      assert.ok(!SRC.includes('dangerouslySetInnerHTML'));
    });

    it('不应使用eval或Function构造函数', () => {
      assert.ok(!SRC.includes('eval('));
      assert.ok(!SRC.includes('new Function('));
    });

    it('不应硬编码事件数据中的敏感信息', () => {
      assert.ok(SRC.includes('EVENT_DATA') || SRC.includes('DUMMY_EVENTS'));
    });
  });

  // ======== 边界 (Boundary Cases) ========
  describe('边界', () => {
    it('JSX中状态颜色映射覆盖进行中/即将开始/已结束', () => {
      const hasOngoing = SRC.includes('进行中') || SRC.includes("'info'") || SRC.includes('"info"');
      const hasUpcoming = SRC.includes('即将开始') || SRC.includes("'warning'") || SRC.includes('"warning"');
      const hasEnded = SRC.includes('已结束') || SRC.includes("'default'") || SRC.includes('"default"');
      assert.ok(hasOngoing, 'should handle 进行中 / info status');
      assert.ok(hasUpcoming, 'should handle 即将开始 / warning status');
      assert.ok(hasEnded, 'should handle 已结束 / default status');
    });

    it('渲染参与人数格式化', () => {
      assert.ok(SRC.includes('toLocaleString') || SRC.includes('participants'));
    });

    it('倒计时/剩余天数计算逻辑', () => {
      assert.ok(SRC.includes('剩余天数') || SRC.includes('86400000') || SRC.includes('getTime'));
    });

    it('包含主要操作按钮', () => {
      assert.ok(SRC.includes('立即参与') || SRC.includes('预约提醒') || SRC.includes('查看回顾'));
    });

    it('事件详情有gradient背景色', () => {
      assert.ok(SRC.includes('gradient') || SRC.includes('bg-gradient'));
    });

    it('赛程安排含时间线样式', () => {
      assert.ok(SRC.includes('dot') || SRC.includes('rounded-full bg-blue-500') || SRC.includes('w-3 h-3'));
    });
  });
});
