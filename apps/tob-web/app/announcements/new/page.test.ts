/**
 * announcements/new/page.test.ts — 发布公告表单页 L1 冒烟测试
 * 覆盖: 表单验证 / 字段完整性 / 错误处理 / 提交状态
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

describe('NewAnnouncementPage (tob-web) 发布公告表单', () => {
  describe('正例', () => {
    it('1. 导出一个默认组件', () => {
      const src = readSource();
      assert.ok(src.includes('export default function NewAnnouncementPage'), '缺少默认导出');
    });

    it('2. 包含 use client', () => {
      const src = readSource();
      assert.ok(src.includes("'use client'"), '缺少 use client');
    });

    it('3. 包含表单字段 title / summary / content', () => {
      const src = readSource();
      assert.ok(src.includes('title'), '缺少 title');
      assert.ok(src.includes('summary'), '缺少 summary');
      assert.ok(src.includes('content'), '缺少 content');
    });

    it('4. 包含分类和优先级选择', () => {
      const src = readSource();
      assert.ok(src.includes('category'), '缺少 category');
      assert.ok(src.includes('priority'), '缺少 priority');
    });

    it('5. 包含表单验证函数 validate', () => {
      const src = readSource();
      assert.ok(src.includes('validate'), '缺少 validate');
    });

    it('6. 包含提交处理 handleSubmit', () => {
      const src = readSource();
      assert.ok(src.includes('handleSubmit'), '缺少 handleSubmit');
    });
  });

  describe('边界', () => {
    it('7. 标题必填验证', () => {
      const src = readSource();
      assert.ok(src.includes('请输入公告标题'), '缺少标题必填');
      assert.ok(src.includes('标题至少2个字符'), '缺少标题最短');
      assert.ok(src.includes('标题不能超过100个字符'), '缺少标题最长');
    });

    it('8. 摘要长度限制', () => {
      const src = readSource();
      assert.ok(src.includes('请输入公告摘要'), '缺少摘要必填');
      assert.ok(src.includes('摘要不能超过200个字符'), '缺少摘要最长');
    });

    it('9. 正文长度限制', () => {
      const src = readSource();
      assert.ok(src.includes('请输入公告正文'), '缺少正文必填');
      assert.ok(src.includes('正文至少10个字符'), '缺少正文最短');
    });

    it('10. 支持五种分类', () => {
      const src = readSource();
      assert.ok(src.includes('system'), '缺少 system');
      assert.ok(src.includes('promotion'), '缺少 promotion');
      assert.ok(src.includes('operation'), '缺少 operation');
      assert.ok(src.includes('emergency'), '缺少 emergency');
      assert.ok(src.includes('training'), '缺少 training');
    });

    it('11. 支持四种优先级', () => {
      const src = readSource();
      assert.ok(src.includes('low'), '缺少 low');
      assert.ok(src.includes('normal'), '缺少 normal');
      assert.ok(src.includes('high'), '缺少 high');
      assert.ok(src.includes('urgent'), '缺少 urgent');
    });
  });

  describe('防御', () => {
    it('12. 未登录跳转', () => {
      const src = readSource();
      assert.ok(src.includes('enterprise_access_token'), '缺少 token 检查');
      assert.ok(src.includes('router.push'), '缺少 router.push');
    });

    it('13. 提交失败显示错误', () => {
      const src = readSource();
      assert.ok(src.includes('setSubmitError'), '缺少 setSubmitError');
      assert.ok(src.includes('submitError'), '缺少 submitError');
    });

    it('14. 提交中禁用按钮', () => {
      const src = readSource();
      assert.ok(src.includes('submitting'), '缺少 submitting');
      assert.ok(src.includes('disabled'), '缺少 disabled');
    });

    it('15. 清除单个字段错误', () => {
      const src = readSource();
      assert.ok(src.includes('handleChange'), '缺少 handleChange');
      assert.ok(src.includes('field: keyof'), '缺少字段类型');
    });
  });
});
