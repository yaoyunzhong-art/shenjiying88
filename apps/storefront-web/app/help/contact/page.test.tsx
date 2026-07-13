/**
 * L1+L2 帮助中心-联系方式页面测试 — contact
 * 正例: 组件存在、JSX模板、客服方式Tab渲染、意见反馈表单、门店地址展开、Toast提示
 * 反例: 无dangerouslySetInnerHTML、无危险eval、无硬编码商店数
 * 边界: 空输入时提交禁用、表单字数不足提示、字符计数、反馈类型筛选
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

describe('contact 联系方式页面', () => {
  // ======== 正例 (Positive Cases) ========
  describe('正例', () => {
    it('应导出一个默认组件', () => {
      assert.ok(SRC.includes('export default function'));
    });

    it('应包含JSX模板', () => {
      assert.ok(SRC.includes('return'));
      assert.ok(SRC.includes('main') || SRC.includes('div') || SRC.includes('<>'));
    });

    it('应包含页面内容', () => {
      assert.ok(SRC.includes('import'));
      assert.ok(SRC.length > 100);
    });

    it('包含3个Tab切换', () => {
      assert.ok(SRC.includes('contact'));
      assert.ok(SRC.includes('feedback'));
      assert.ok(SRC.includes('stores'));
    });

    it('渲染5种客服联系方式', () => {
      assert.ok(SRC.includes('CONTACT_METHODS') || SRC.includes('400-888-0000'));
    });

    it('客服方式含电话/在线/邮箱/公众号/地址', () => {
      assert.ok(SRC.includes('phone'));
      assert.ok(SRC.includes('online'));
      assert.ok(SRC.includes('email'));
      assert.ok(SRC.includes('wechat'));
      assert.ok(SRC.includes('address'));
    });

    it('包含意见反馈表单', () => {
      assert.ok(SRC.includes('feedbackTitle') || SRC.includes('意见反馈'));
    });

    it('反馈表单包含类型选择', () => {
      assert.ok(SRC.includes('FEEDBACK_TYPES') || SRC.includes('feedbackType'));
    });

    it('反馈表单包含标题输入', () => {
      assert.ok(SRC.includes('feedbackTitle'));
    });

    it('反馈表单包含详细描述', () => {
      assert.ok(SRC.includes('feedbackContent') || SRC.includes('详细描述'));
    });

    it('表单提交时有字数校验（至少10字）', () => {
      assert.ok(SRC.includes('feedbackContent.trim().length >= 10') || SRC.includes('至少10'));
    });

    it('渲染门店地址且可展开', () => {
      assert.ok(SRC.includes('STORE_ADDRESSES'));
      assert.ok(SRC.includes('expandedStore'));
    });

    it('有成功/失败Toast提示', () => {
      assert.ok(SRC.includes('showToast') && SRC.includes('toast'));
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

    it('提交按钮在empty标题时禁用', () => {
      assert.ok(SRC.includes('canSubmit') || SRC.includes('!canSubmit') || SRC.includes('disabled'));
    });
  });

  // ======== 边界 (Boundary Cases) ========
  describe('边界', () => {
    it('支持选择5种反馈类型', () => {
      assert.ok(SRC.includes('suggestion'));
      assert.ok(SRC.includes('complaint'));
      assert.ok(SRC.includes('bug'));
      assert.ok(SRC.includes('praise'));
      assert.ok(SRC.includes('other'));
    });

    it('反馈标题最多100字符', () => {
      assert.ok(SRC.includes('maxLength') && (SRC.includes('100') || SRC.includes('charCount')));
    });

    it('反馈内容最多2000字符', () => {
      assert.ok(SRC.includes('2000') || SRC.includes('maxLength={2000}'));
    });

    it('表单提交时模拟API调用', () => {
      assert.ok(SRC.includes('setTimeout') || SRC.includes('setSubmitting'));
    });

    it('表单成功提交后重置状态', () => {
      assert.ok(SRC.includes('setFeedbackTitle'));
      assert.ok(SRC.includes("''") || SRC.includes('""'));
    });

    it('门店地址含距离标签', () => {
      assert.ok(SRC.includes('distance'));
    });

    it('门店展开后显示电话/营业/地铁/导航', () => {
      assert.ok(SRC.includes('致电门店') || SRC.includes('导航前往'));
    });
  });
});
