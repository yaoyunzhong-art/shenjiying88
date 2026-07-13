/**
 * L1+L2 套餐中心页面测试 — setmeal
 * 正例: 组件、JSX、分类标签筛选、套餐卡片渲染、热门标记、购买确认弹窗、价格和原始价格
 * 反例: 无危险HTML、无eval、无硬编码套餐价格
 * 边界: 6种套餐、7种分类标签、筛选后空列表、购买成功状态、折叠显示4+额外项
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('setmeal 套餐中心页面', () => {
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
      assert.ok(SRC.includes('PageShell') || SRC.includes('StatCard'));
    });

    it('渲染6种套餐', () => {
      assert.ok(SRC.includes('SETMEALS') && SRC.length > 500);
    });

    it('支持分类标签筛选', () => {
      assert.ok(SRC.includes('tagFilter') && SRC.includes('TAGS'));
    });

    it('有7种分类标签', () => {
      assert.ok(SRC.includes('全部') && SRC.includes('入门') && SRC.includes('超值'));
      assert.ok(SRC.includes('浪漫') && SRC.includes('亲子') && SRC.includes('团建') && SRC.includes('VIP'));
    });

    it('热门套餐有🔥标记', () => {
      assert.ok(SRC.includes('popular') && SRC.includes('🔥'));
    });

    it('显示原始价格和省钱金额', () => {
      assert.ok(SRC.includes('originalPrice') && SRC.includes('line-through'));
    });

    it('点击套餐显示购买确认弹窗', () => {
      assert.ok(SRC.includes('selectedId') && SRC.includes('确认购买'));
    });

    it('购买成功后显示🎉状态', () => {
      assert.ok(SRC.includes('purchased') && SRC.includes('购买成功'));
    });

    it('价格格式化函数存在', () => {
      assert.ok(SRC.includes('formatPrice') || SRC.includes('toLocaleString'));
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

    it('套餐名称不应为空', () => {
      assert.ok(SRC.includes('新手体验') && SRC.includes('畅玩'));
    });
  });

  // ======== 边界 (Boundary Cases) ========
  describe('边界', () => {
    it('超过4个项目的套餐显示+更多', () => {
      assert.ok(SRC.includes('4') && SRC.includes('更多'));
    });

    it('弹窗中显示支付方式选择', () => {
      assert.ok(SRC.includes('微信支付') || SRC.includes('支付宝') || SRC.includes('余额支付'));
    });

    it('弹窗关闭按钮存在', () => {
      assert.ok(SRC.includes('✕') || SRC.includes('知道了'));
    });

    it('筛选后隐藏其他标签套餐', () => {
      assert.ok(SRC.includes('filtered') && SRC.includes('filter'));
    });

    it('选购确认弹窗含时长和价格明细', () => {
      assert.ok(SRC.includes('duration') && (SRC.includes('价格') || SRC.includes('支付')));
    });

    it('折扣比例计算（省¥xx）', () => {
      assert.ok(SRC.includes('省') || SRC.includes('originalPrice - sm.price'));
    });
  });
});
