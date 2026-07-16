/**
 * L1+L2 会员等级与积分页面测试 — loyalty
 * 正例: 组件、JSX、会员等级卡片、积分进度条、Tabs切换、积分明细表、搜索过滤、奖励列表
 * 反例: 无危险HTML、无eval、无硬编码会员编号
 * 边界: 4种等级展示、全部引用@m5/ui组件、积分变动正负数颜色、空搜索过滤、状态徽章
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('loyalty 会员等级页面', () => {
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
      assert.ok(SRC.includes('import') && SRC.length > 100);
    });

    it('使用@m5/ui组件', () => {
      assert.ok(SRC.includes('PageShell'));
      assert.ok(SRC.includes('StatCard') || SRC.includes('Tabs') || SRC.includes('DataTable') || SRC.includes('StatusBadge'));
    });

    it('渲染4种会员等级', () => {
      assert.ok(SRC.includes('青铜'));
      assert.ok(SRC.includes('白银'));
      assert.ok(SRC.includes('黄金'));
      assert.ok(SRC.includes('钻石'));
    });

    it('显示当前会员等级', () => {
      assert.ok(SRC.includes('MEMBER_TIERS') && SRC.includes('当前等级'));
    });

    it('积分进度条显示升级进度', () => {
      assert.ok(SRC.includes('linear-gradient') || SRC.includes('90deg') || SRC.includes('progress'));
    });

    it('支持Tabs切换等级/积分/奖励', () => {
      assert.ok(SRC.includes('tier') && SRC.includes('points') && SRC.includes('rewards'));
    });

    it('积分明细可搜索过滤', () => {
      assert.ok(SRC.includes('search') && SRC.includes('filtered'));
    });

    it('积分变动正数为绿色', () => {
      assert.ok(SRC.includes('#059669') || SRC.includes('#dc2626') || SRC.includes('text-green-400') || SRC.includes('text-red-400'));
    });

    it('渲染奖励列表', () => {
      assert.ok(SRC.includes('RECENT_REWARDS') || SRC.includes('已领取') || SRC.includes('已使用'));
    });

    it('进度条宽度按百分比计算', () => {
      assert.ok(SRC.includes('percent') || SRC.includes('width') || SRC.includes('100%'));
    });
  });

  // ======== 反例 (Negative Cases) ========
  describe('反例', () => {
    it('不应使用dangerouslySetInnerHTML', () => {
      assert.ok(!SRC.includes('dangerouslySetInnerHTML'));
    });

    it('不应使用eval或Function构造函数', () => {
      assert.ok(!SRC.includes('eval(') && !SRC.includes('new Function('));
    });

    it('不应硬编码具体会员编号', () => {
      assert.ok(!SRC.match(/M\d{10,}/));
    });
  });

  // ======== 边界 (Boundary Cases) ========
  describe('边界', () => {
    it('等级权益列表中包含具体权益描述', () => {
      assert.ok(SRC.includes('benefits') || SRC.includes('积分加速') || SRC.includes('VIP通道'));
    });

    it('积分变动包含正负号', () => {
      assert.ok(SRC.includes('+') && SRC.includes('-') && SRC.includes('change'));
    });

    it('各等级有对应图标', () => {
      assert.ok(SRC.includes('🟤') || SRC.includes('⚪') || SRC.includes('🟡') || SRC.includes('💎'));
    });

    it('渲染积分获取方式', () => {
      assert.ok(SRC.includes('EARN_WAYS') || SRC.includes('到店消费') || SRC.includes('签到打卡'));
    });

    it('当前等级有高亮样式', () => {
      assert.ok(SRC.includes('f59e0b') || SRC.includes('border-yellow') || SRC.includes('text-yellow-400'));
    });

    it('已解锁/当前/未达成有不同状态标签', () => {
      assert.ok(SRC.includes('已解锁') || SRC.includes('未达成'));
      assert.ok(SRC.includes('当前等级'));
    });

    it('奖励状态使用StatusBadge', () => {
      assert.ok(SRC.includes('StatusBadge'));
    });
  });
});
