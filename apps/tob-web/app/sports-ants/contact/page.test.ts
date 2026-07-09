/**
 * sports-ants/contact/page.test.ts — 联系我们页面 L1 冒烟测试
 * 覆盖: 数据常量 · 表单定义 · 业务逻辑
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');
const DATA = readFileSync(SOURCE, 'utf-8');

// ---- 正例: 模块结构检查 ----

describe('sports-ants/contact — 页面结构', () => {
  it('应导出默认组件 ContactPage', () => {
    assert.ok(
      DATA.includes('export default function ContactPage'),
      '缺少默认导出 ContactPage'
    );
  });

  it('应为 "use client" 组件', () => {
    assert.ok(
      DATA.includes("'use client'") || DATA.includes('"use client"'),
      '缺少 "use client" 指令'
    );
  });

  it('应使用 Suspense 包裹 ContactContent', () => {
    assert.ok(DATA.includes('Suspense'), '缺少 Suspense');
    assert.ok(DATA.includes('<ContactContent'), '缺少 ContactContent');
  });

  it('应包含 SEO 元数据组件 SEOMeta', () => {
    assert.ok(DATA.includes('SEOMeta'), '缺少 SEOMeta');
    assert.ok(DATA.includes('title='), '缺少 title 属性');
    assert.ok(DATA.includes('description='), '缺少 description 属性');
  });

  it('应包含 ConversionTracker', () => {
    assert.ok(DATA.includes('ConversionTracker'), '缺少 ConversionTracker');
    assert.ok(DATA.includes('page="contact"'), 'ConversionTracker 缺少 page=contact');
  });

  it('应包含 Footer / FloatingContact / ExitIntentPopup', () => {
    assert.ok(DATA.includes('<Footer'), '缺少 Footer');
    assert.ok(DATA.includes('<FloatingContact'), '缺少 FloatingContact');
    assert.ok(DATA.includes('<ExitIntentPopup'), '缺少 ExitIntentPopup');
  });
});

// ---- 常量数据检查 ----

describe('sports-ants/contact — 数据常量', () => {
  it('应定义 COOPERATION_TYPES 且包含 6 种合作类型', () => {
    const match = DATA.match(/COOPERATION_TYPES\s*=\s*\[([\s\S]*?)\];/);
    assert.ok(match, '未找到 COOPERATION_TYPES 定义');

    const types = DATA.match(/\{ value: '[^']+', label: '[^']+' \}/g);
    const expectedLabels = ['直接购买设备', '特许加盟', '合资联营', '品牌授权', 'EPC+O项目', '其他合作'];
    for (const lbl of expectedLabels) {
      assert.ok(DATA.includes(lbl), `COOPERATION_TYPES 缺少选项: ${lbl}`);
    }
  });

  it('应定义 SERVICE_CHANNELS 且包含 3 个服务渠道', () => {
    const channels = ['商务热线', '企业微信', '商务邮箱'];
    for (const ch of channels) {
      assert.ok(DATA.includes(ch), `SERVICE_CHANNELS 缺少: ${ch}`);
    }
    assert.ok(DATA.includes('400-888-8888'), '缺少商务热线号码');
    assert.ok(DATA.includes('business@bigants.net'), '缺少商务邮箱');
  });

  it('应定义 FAQ_ITEMS 且包含 3 个常见问题', () => {
    const faqItems = ['投资数字运动馆需要多少钱？', '场地需要多大面积？', '设备多久回本？'];
    for (const q of faqItems) {
      assert.ok(DATA.includes(q), `FAQ 缺少问题: ${q}`);
    }
  });
});

// ---- 输入样式定义 ----

describe('sports-ants/contact — 表单字段', () => {
  it('应包含必填字段: 企业名称、联系人、联系电话', () => {
    assert.ok(DATA.includes('companyName'), '缺少 companyName 字段');
    assert.ok(DATA.includes('contactPerson'), '缺少 contactPerson 字段');
    assert.ok(DATA.includes('phone'), '缺少 phone 字段');
  });

  it('应包含合作类型下拉框', () => {
    assert.ok(DATA.includes('合作类型'), '缺少合作类型标签');
    assert.ok(DATA.includes('cooperationType'), '缺少 cooperationType');
  });

  it('应包含需求描述文本域', () => {
    assert.ok(DATA.includes('需求描述'), '缺少需求描述');
    assert.ok(DATA.includes('message'), '缺少 message 字段');
  });

  it('应包含提交按钮', () => {
    assert.ok(DATA.includes('提交咨询'), '缺少提交按钮文字');
    assert.ok(DATA.includes('type="submit"'), '缺少 submit 类型按钮');
  });

  it('应包含 "继续填写" 按钮（提交后重填）', () => {
    assert.ok(DATA.includes('继续填写'), '缺少继续填写按钮');
  });
});

// ---- 交互逻辑 ----

describe('sports-ants/contact — 状态管理', () => {
  it('应管理 submitted / isSubmitting 状态', () => {
    assert.ok(DATA.includes('setSubmitted'), '缺少 setSubmitted');
    assert.ok(DATA.includes('setIsSubmitting'), '缺少 setIsSubmitting');
  });

  it('应在提交成功时展示 assignedTo 和 estimatedCallbackTime', () => {
    assert.ok(DATA.includes('assignedTo'), '缺少 assignedTo');
    assert.ok(DATA.includes('estimatedCallbackTime'), '缺少 estimatedCallbackTime');
  });

  it('提交按钮应在 isSubmitting 时展示 "提交中..."', () => {
    assert.ok(DATA.includes("提交中...") || DATA.includes('提交中...'), '缺少提交中状态文字');
  });

  it('应调用 conversionService.trackCTAClick 追踪表单交互', () => {
    const pattern = /conversionService\s*\.\s*trackCTAClick/g;
    const matches = DATA.match(pattern);
    assert.ok(matches && matches.length >= 3,
      `conversionService.trackCTAClick 调用次数应为 ≥3, 实际: ${matches?.length || 0}`
    );
  });

  it('应调用 conversionService.submitContactForm', () => {
    assert.ok(
      DATA.includes('conversionService.submitContactForm') || DATA.includes('conversionService\.submitContactForm'),
      '缺少 conversionService.submitContactForm 调用'
    );
  });
});

// ---- 设计系统常量 ----

describe('sports-ants/contact — 设计系统', () => {
  it('应定义设计系统常量 designSystem', () => {
    assert.ok(DATA.includes('designSystem'), '缺少 designSystem');
    assert.ok(DATA.includes('#000000'), '缺少主色');
    assert.ok(DATA.includes('#0066FF'), '缺少品牌蓝');
  });

  it('应包含 AnimatedSection 滚动动画组件', () => {
    assert.ok(DATA.includes('AnimatedSection'), '缺少 AnimatedSection');
    assert.ok(DATA.includes('useScrollAnimation'), '缺少 useScrollAnimation');
    assert.ok(DATA.includes('IntersectionObserver'), '缺少 IntersectionObserver');
  });

  it('应包含 HoverCard 交互卡片组件', () => {
    assert.ok(DATA.includes('HoverCard'), '缺少 HoverCard');
    assert.ok(DATA.includes('isHovered'), '缺少 hover 状态');
  });

  it('应包含 ClickableLink 组件的 scale 动画', () => {
    assert.ok(DATA.includes('ClickableLink'), '缺少 ClickableLink');
    assert.ok(DATA.includes('scale(1.05)'), '缺少 hover 缩放效果');
  });
});

// ---- 快速链接 ----

describe('sports-ants/contact — 快捷链接', () => {
  const links = [
    ['浏览产品', '/sports-ants/products'],
    ['招商加盟', '/sports-ants/franchise'],
    ['查看案例', '/sports-ants/cases'],
    ['决策资源', '/sports-ants/resources'],
  ];

  for (const [label, href] of links) {
    it(`应包含 "${label}" 链接到 ${href}`, () => {
      assert.ok(DATA.includes(label), `缺少链接: ${label}`);
      assert.ok(DATA.includes(href), `缺少路径: ${href}`);
    });
  }
});
