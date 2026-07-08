/**
 * products/[id]/page.test.tsx — 商品详情页 L1 冒烟测试
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

describe('products/[id] — 正例', () => {
  it('应导出一个默认组件', () => {
    const src = readSource();
    assert.match(src, /export default function ProductDetailPage/);
  });

  it('应导入 useParams / useRouter', () => {
    const src = readSource();
    assert.match(src, /useParams/);
    assert.match(src, /useRouter/);
  });

  it('应导入页面级组件', () => {
    const src = readSource();
    assert.match(src, /PageShell/);
    assert.match(src, /DetailShell/);
    assert.match(src, /Modal/);
    assert.match(src, /SubmitButton/);
    assert.match(src, /FormField/);
    assert.match(src, /FormSubmitFeedback/);
    assert.match(src, /StatusBadge/);
  });

  it('应导入 products-data', () => {
    const src = readSource();
    assert.match(src, /from ['"]\.\.\/\.\.\/products-data['"]/);
    assert.match(src, /MOCK_PRODUCTS/);
    assert.match(src, /PRODUCT_STATUS_MAP/);
    assert.match(src, /PRODUCT_CATEGORY_MAP/);
  });

  it('应包含 findProduct 辅助函数', () => {
    const src = readSource();
    assert.match(src, /function findProduct/);
  });

  it('应包含编辑模式', () => {
    const src = readSource();
    assert.match(src, /editMode/);
    assert.match(src, /setEditMode/);
  });

  it('应包含状态切换逻辑', () => {
    const src = readSource();
    assert.match(src, /toggleStatus/);
    assert.match(src, /setConfirmAction/);
  });

  it('应包含删除逻辑', () => {
    const src = readSource();
    assert.match(src, /deleteProduct/);
    assert.match(src, /router\.push\(['"']\/products['"]?\)/);
  });

  it('应包含错误/空状态处理', () => {
    const src = readSource();
    assert.match(src, /商品未找到/);
  });
});

describe('products/[id] — 边界', () => {
  it('应处理空 id', () => {
    const src = readSource();
    // 使用了 params.id，id 为空时 findProduct 返回 undefined，展示错误态
    assert.match(src, /typeof params\.id === 'string'/);
    assert.match(src, /product === undefined/);
  });

  it('应使用 useFormSubmit 管理提交状态', () => {
    const src = readSource();
    assert.match(src, /useFormSubmit/);
    assert.match(src, /submitting/);
    assert.match(src, /feedback/);
    assert.match(src, /handleSubmit/);
  });

  it('应展示所有详情分组', () => {
    const src = readSource();
    assert.match(src, /基本信息/);
    assert.match(src, /价格与库存/);
    assert.match(src, /供应链信息/);
    assert.match(src, /时间信息/);
  });

  it('应展示编辑表单字段', () => {
    const src = readSource();
    assert.match(src, /商品名称/);
    assert.match(src, /售价/);
    assert.match(src, /库存/);
    assert.match(src, /成本/);
    assert.match(src, /品牌/);
    assert.match(src, /供应商/);
  });
});

describe('products/[id] — 防御', () => {
  it('不应硬编码商品 id', () => {
    const src = readSource();
    // 应通过 params 动态获取
    assert.match(src, /params\.id/);
    // 不应有未验证的 id
    assert.doesNotMatch(src, /id\s*===?\s*['"]tp-/);
  });

  it('不应包含 eval / Function 构造函数', () => {
    const src = readSource();
    assert.doesNotMatch(src, /eval\s*\(/);
    assert.doesNotMatch(src, /new\s+Function\s*\(/);
  });

  it('不应使用 dangerouslySetInnerHTML', () => {
    const src = readSource();
    assert.doesNotMatch(src, /dangerouslySetInnerHTML/);
  });

  it('所有 confirmAction 分支都应提供确认文案', () => {
    const src = readSource();
    assert.match(src, /确定/);
    assert.match(src, /确认操作/);
  });

  it('delete 按钮应带 danger variant', () => {
    const src = readSource();
    assert.match(src, /variant.*danger/);
  });
});
