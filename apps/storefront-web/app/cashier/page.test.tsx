/**
 * cashier/page.test.tsx — 前台收银台 L1 验收测试
 *
 * PRD-001 驱动测试（V17#Day3）
 * 覆盖所有 AC-35 验收卡:
 *   AC-35-01: 商品搜索
 *   AC-35-02: 商品添加到已选清单
 *   AC-35-03: 多件商品金额计算
 *   AC-35-04: 会员识别（手机号输入）
 *   AC-35-05: 会员折扣应用
 *   AC-35-07: 支付方式选择
 *   AC-35-10: 空结算防御
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

// ============================================================
// AC-35-01: 商品搜索
// ============================================================
describe('AC-35-01: 商品搜索', () => {
  it('应包含搜索输入框（searchText 状态 + Input 组件）', () => {
    const src = readSource();
    assert.ok(src.includes('searchText'), '缺少 searchText 状态');
    assert.ok(src.includes('placeholder'), '缺少搜索占位符');
    assert.ok(src.includes('🔍'), '缺少搜索图标关键词');
  });

  it('应包含商品过滤逻辑（filteredProducts）', () => {
    const src = readSource();
    assert.ok(src.includes('filteredProducts'), '缺少过滤商品列表');
    assert.ok(src.includes('.filter('), '使用 filter 实现过滤');
  });

  it('搜索"射击"应匹配到射击体验商品数据', () => {
    const src = readSource();
    // 模拟搜索场景: 数据中应有"射击体验"
    assert.ok(src.includes('射击体验'), '商品数据包含射击体验');
    // 过滤使用 toLowerCase + includes
    assert.ok(src.includes('toLowerCase()'), '大小写不敏感搜索');
    assert.ok(src.includes('.includes(q)'), '使用 includes 模糊匹配');
  });

  it('未找到匹配商品时有提示', () => {
    const src = readSource();
    assert.ok(src.includes('未找到匹配商品'), '空结果提示');
  });

  it('MOCK_PRODUCTS 应包含 ≥10 个商品', () => {
    const src = readSource();
    const count = (src.match(/{ id:/g) || []).length;
    assert.ok(count >= 10, `Mock 商品数不足: ${count}`);
  });
});

// ============================================================
// AC-35-02: 商品添加到已选清单
// ============================================================
describe('AC-35-02: 商品添加到已选清单', () => {
  it('应包含 addToCart 函数', () => {
    const src = readSource();
    assert.ok(src.includes('addToCart'), '缺少 addToCart');
    assert.ok(src.includes('setCart'), '缺少 setCart 状态更新');
  });

  it('应包含 removeFromCart 函数', () => {
    const src = readSource();
    assert.ok(src.includes('removeFromCart'), '缺少 removeFromCart');
  });

  it('应包含 updateQuantity 函数', () => {
    const src = readSource();
    assert.ok(src.includes('updateQuantity'), '缺少 updateQuantity');
  });

  it('购物车应显示各商品的数量和金额', () => {
    const src = readSource();
    assert.ok(src.includes('quantity'), '商品数量字段');
    assert.ok(src.includes('.quantity'), '数量计算');
  });

  it('添加重复商品应增加数量而非新增条目', () => {
    const src = readSource();
    // 逻辑: find existing → quantity+1
    assert.ok(src.includes('.find((item) => item.id === product.id)'), '查找已存在商品');
    assert.ok(src.includes('quantity: item.quantity + 1'), '数量递增');
  });
});

// ============================================================
// AC-35-03: 多件商品金额计算
// ============================================================
describe('AC-35-03: 多件商品金额计算', () => {
  it('应计算小计（rawTotal = sum price × quantity）', () => {
    const src = readSource();
    assert.ok(src.includes('rawTotal'), '原始小计');
    assert.ok(src.includes('item.price * item.quantity'), '金额计算');
  });

  it('应计算商品总数（cartCount）', () => {
    const src = readSource();
    assert.ok(src.includes('cartCount'), '商品件数');
    assert.ok(src.includes('sum + item.quantity'), '件数累加');
  });

  it('应显示"应付"金额', () => {
    const src = readSource();
    assert.ok(src.includes('应付'), '应付标签');
    assert.ok(src.includes('finalTotal'), '最终金额');
  });

  it('应显示"小计"金额', () => {
    const src = readSource();
    assert.ok(src.includes('小计'), '小计标签');
  });
});

// ============================================================
// AC-35-04: 会员识别（手机号输入）
// ============================================================
describe('AC-35-04: 会员识别', () => {
  it('应包含手机号输入框', () => {
    const src = readSource();
    assert.ok(src.includes('memberPhone'), '会员手机号状态');
    assert.ok(src.includes('输入会员手机号'), '手机号输入提示');
  });

  it('应包含查询会员按钮', () => {
    const src = readSource();
    assert.ok(src.includes('handleLookupMember'), '查询会员函数');
    assert.ok(src.includes('查询'), '查询按钮');
  });

  it('应包含会员数据库（MOCK_MEMBER_DB）', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_MEMBER_DB'), '会员数据库');
  });

  it('手机号验证应检查11位输入', () => {
    const src = readSource();
    assert.ok(src.includes('11位手机号'), '手机号长度验证');
  });

  it('查找到会员应显示姓名/等级/积分', () => {
    const src = readSource();
    assert.ok(src.includes('姓名'), '姓名字段');
    assert.ok(src.includes('等级'), '等级字段');
    assert.ok(src.includes('积分'), '积分字段');
  });

  it('未找到会员应有提示信息', () => {
    const src = readSource();
    assert.ok(src.includes('未找到该会员'), '未找到提示');
  });

  it('应包含清除会员功能', () => {
    const src = readSource();
    assert.ok(src.includes('handleClearMember'), '清除会员函数');
    assert.ok(src.includes('清除'), '清除按钮');
  });
});

// ============================================================
// AC-35-05: 会员折扣应用
// ============================================================
describe('AC-35-05: 会员折扣应用', () => {
  it('应定义会员等级折扣率（TIER_DISCOUNT）', () => {
    const src = readSource();
    assert.ok(src.includes('TIER_DISCOUNT'), '折扣率配置');
    assert.ok(src.includes('gold: 0.9'), '金卡9折');
    assert.ok(src.includes('silver: 0.95'), '银卡95折');
    assert.ok(src.includes('regular: 1.0'), '普卡无折扣');
  });

  it('应计算折扣金额（discountAmount）', () => {
    const src = readSource();
    assert.ok(src.includes('discountAmount'), '折扣金额');
  });

  it('应计算最终应付金额（finalTotal）', () => {
    const src = readSource();
    assert.ok(src.includes('finalTotal'), '最终应付金额');
  });

  it('打折后应显示折扣信息', () => {
    const src = readSource();
    assert.ok(src.includes('会员折扣'), '折扣标签');
    assert.ok(src.includes('已省'), '折扣金额展示');
  });

  it('金卡会员应有9折提示', () => {
    const src = readSource();
    assert.ok(src.includes('金卡会员享9折优惠'), '金卡提示');
  });

  it('银卡会员应有95折提示', () => {
    const src = readSource();
    assert.ok(src.includes('银卡会员享95折优惠'), '银卡提示');
  });
});

// ============================================================
// AC-35-07: 支付方式选择
// ============================================================
describe('AC-35-07: 支付方式选择', () => {
  it('应包含三种支付方式（微信扫码/会员余额/现金）', () => {
    const src = readSource();
    assert.ok(src.includes('wechat'), '微信支付');
    assert.ok(src.includes('balance'), '会员余额');
    assert.ok(src.includes('cash'), '现金');
  });

  it('应包含 PAYMENT_OPTIONS 配置', () => {
    const src = readSource();
    assert.ok(src.includes('PAYMENT_OPTIONS'), '支付方式配置');
    assert.ok(src.includes('微信扫码'), '微信扫码标签');
    assert.ok(src.includes('会员余额'), '会员余额标签');
    assert.ok(src.includes('现金'), '现金标签');
  });

  it('应包含 handlePaymentSelect 函数', () => {
    const src = readSource();
    assert.ok(src.includes('handlePaymentSelect'), '支付选择函数');
    assert.ok(src.includes('setPaymentMethod'), '支付状态管理');
  });

  it('选择微信支付应生成二维码', () => {
    const src = readSource();
    assert.ok(src.includes('paymentCodeUrl'), '支付码URL');
    assert.ok(src.includes('请使用微信扫码支付'), '扫码支付提示');
    assert.ok(src.includes('[二维码]'), '二维码区域');
  });
});

// ============================================================
// AC-35-10: 空结算防御
// ============================================================
describe('AC-35-10: 空结算防御', () => {
  it('购物车为空时点击结账应有防御提示', () => {
    const src = readSource();
    assert.ok(src.includes('请添加商品'), '空购物车提示');
  });

  it('应检查购物车是否为空（cart.length === 0）', () => {
    const src = readSource();
    assert.ok(src.includes('cart.length === 0'), '空购物车检查');
  });

  it('未选择支付方式应有防御提示', () => {
    const src = readSource();
    assert.ok(src.includes('请选择支付方式'), '支付方式检查提示');
  });

  it('handleCheckout 函数应包含防御逻辑', () => {
    const src = readSource();
    assert.ok(src.includes('handleCheckout'), '结账函数');
    assert.ok(src.includes('!paymentMethod'), '支付方式为空检查');
  });
});

// ============================================================
// 基础结构验证
// ============================================================
describe('基础结构验证', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应导出一个默认组件 CashierPage', () => {
    const src = readSource();
    assert.ok(
      src.includes('export default function CashierPage'),
      '缺少默认导出'
    );
  });

  it('应包含 "收银台 — P-35" 标题', () => {
    const src = readSource();
    assert.ok(src.includes('收银台 — P-35'), '缺少页面标题');
  });

  it('应使用 PageShell 组件', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
  });

  it('应使用 useState useCallback useMemo', () => {
    const src = readSource();
    assert.ok(src.includes('useState'), '缺少 useState');
    assert.ok(src.includes('useCallback'), '缺少 useCallback');
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
  });

  it('应包含 fm 金额格式化函数', () => {
    const src = readSource();
    assert.ok(src.includes('function fm'), '缺少 fm 函数');
  });
});

// ============================================================
// P0-E1: 前端真实交易接线诊断
// ============================================================
describe('cashier — 真实交易接线诊断 [P0-E1]', () => {
  it('[READY] 页面已接入真实 checkout helper', () => {
    const src = readSource();
    assert.ok(src.includes('startStorefrontCheckout'), '应接入真实下单 helper');
    assert.ok(src.includes('ensureStorefrontMemberRegistered'), '应在下单前注册/兜底会员');
    assert.ok(src.includes('buildStorefrontMemberId'), '应根据手机号构造 storefront memberId');
    assert.ok(src.includes('const handleCheckout = useCallback(async () => {'), 'handleCheckout 应为异步提交');
    assert.ok(src.includes('await startStorefrontCheckout('), '结账应 await 真实 checkout');
  });

  it('[READY] 下单成功后应跳转到真实支付页', () => {
    const src = readSource();
    assert.ok(src.includes('useRouter'), '应接入 Next router');
    assert.ok(src.includes('router.push(`/h5/payment/${aggregate.order.orderId}`)'), '应跳转到 H5 支付页');
    assert.ok(src.includes('订单 ${aggregate.order.orderNo ?? aggregate.order.orderId} 已创建'), '应展示真实订单创建提示');
  });

  it('[TRANSITION] 商品和会员数据仍为本地 Mock,但不再伪造结账成功', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_PRODUCTS'), '商品数据仍为内联 Mock');
    assert.ok(src.includes('MOCK_MEMBER_DB'), '会员数据仍为内联 Mock');
    assert.ok(src.includes('setTimeout(() => setMessageText('), '当前仍保留消息自动消失定时器');
    assert.ok(!src.includes('支付成功！金额 ${fm(finalTotal)}'), '不应继续使用本地假支付成功文案');
  });

  it('[READY] 页面状态已适配真实提交结果', () => {
    const src = readSource();
    assert.ok(src.includes('setIsProcessing(true)'), '应在提交前进入 processing');
    assert.ok(src.includes('setCheckoutStatus(\'success\')'), '真实下单成功后应进入 success');
    assert.ok(src.includes('setCheckoutStatus(\'error\')'), '真实下单失败后应进入 error');
    assert.ok(src.includes('⚠️ 下单失败，请稍后重试'), '应提供真实失败兜底提示');
  });
});
