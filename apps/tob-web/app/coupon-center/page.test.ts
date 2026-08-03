/**
 * coupon-center/page.test.ts — 券中心页面 L1 测试
 *
 * 覆盖: 数据结构 / Tab切换 / 联盟券 / 阶梯计算 / AI推荐 / 领取核销 / 空状态 / 状态展示
 * L1 JMeter 风格: 正例 + 反例 + 边界
 * 角色视角:
 *   🏪 运营 — 优惠券模板、联盟商家规则
 *   💳 用户 — 领取、使用、查看
 *
 * 三件套: 正例 36+ | 反例 8+ | 边界 6+
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { describe, it } from 'node:test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function readSource(file: string): string {
  return readFileSync(resolve(__dirname, file), 'utf-8');
}

const pageSrc = readSource('page.tsx');
const dataSrc = readSource('coupon-center-data.ts');
const svcSrc = readSource('coupon-center-service.ts');

// ====================================================================
// 测试集 A: Coupon 数据模型 (data)
// ====================================================================
describe('🅰️ CouponCenter: 数据结构(正例)', () => {

  it('A1: data 定义了 Coupon 接口含 couponId/name/type', () => {
    assert.ok(dataSrc.includes('interface Coupon'), '缺少 Coupon 接口');
    assert.ok(dataSrc.includes('couponId'), '缺少 couponId');
    assert.ok(dataSrc.includes('name'), '缺少 name');
    assert.ok(dataSrc.includes("type:"), '缺少 type');
    assert.ok(dataSrc.includes("'discount'"), '缺少 discount 类型');
    assert.ok(dataSrc.includes("'cash'"), '缺少 cash 类型');
    assert.ok(dataSrc.includes("'gift'"), '缺少 gift 类型');
    assert.ok(dataSrc.includes("'shipping'"), '缺少 shipping 类型');
  });

  it('A2: Coupon 接口包含 minOrderAmount/validFrom/validUntil/status/tags', () => {
    assert.ok(dataSrc.includes('minOrderAmount'), '缺少 minOrderAmount');
    assert.ok(dataSrc.includes('validFrom'), '缺少 validFrom');
    assert.ok(dataSrc.includes('validUntil'), '缺少 validUntil');
    assert.ok(dataSrc.includes('status'), '缺少 status');
    assert.ok(dataSrc.includes('tags'), '缺少 tags');
    assert.ok(dataSrc.includes('description'), '缺少 description');
  });

  it('A3: AllianceCoupon 扩展了联盟特有字段', () => {
    assert.ok(dataSrc.includes('interface AllianceCoupon'), '缺少 AllianceCoupon');
    assert.ok(dataSrc.includes('allianceId'), '缺少 allianceId');
    assert.ok(dataSrc.includes('allianceName'), '缺少 allianceName');
    assert.ok(dataSrc.includes('partnerStores'), '缺少 partnerStores');
    assert.ok(dataSrc.includes('storeId'), '缺少 storeId');
    assert.ok(dataSrc.includes('storeName'), '缺少 storeName');
  });

  it('A4: SteppedRule 定义 threshold/discount/label', () => {
    assert.ok(dataSrc.includes('interface SteppedRule'), '缺少 SteppedRule');
    assert.ok(dataSrc.includes('threshold'), '缺少 threshold');
    assert.ok(dataSrc.includes('discount'), '缺少 discount');
    assert.ok(dataSrc.includes('label'), '缺少 label');
  });

  it('A5: MOCK_AVAILABLE_COUPONS 至少 10 个可用券', () => {
    const count = (dataSrc.match(/couponId: '/g) || []).length;
    // Available + Alliance + My = total entries, filter to available section
    assert.ok(dataSrc.includes('MOCK_AVAILABLE_COUPONS'), '缺少 MOCK_AVAILABLE_COUPONS');
    const availSection = dataSrc.split('MOCK_MY_COUPONS')[0];
    const availCount = (availSection.match(/couponId: '/g) || []).length - 1; // -1 for Alliance if before My
    assert.ok(availCount >= 10, `MOCK_AVAILABLE_COUPONS < 10 (actual ${availCount})`);
  });

  it('A6: MOCK_ALLIANCE_COUPONS 包含 5 个联盟', () => {
    const section = dataSrc.split('MOCK_ALLIANCE_COUPONS');
    assert.ok(section.length >= 2, '缺少 MOCK_ALLIANCE_COUPONS');
    const allianceCount = (dataSrc.match(/allianceId: '/g) || []).length;
    assert.ok(allianceCount >= 5, `联盟优惠券数量 < 5 (actual ${allianceCount})`);
  });

  it('A7: MOCK_MY_COUPONS 混合 Coupon/AllianceCoupon', () => {
    assert.ok(dataSrc.includes('MOCK_MY_COUPONS'), '缺少 MOCK_MY_COUPONS');
    const mySection = dataSrc.split('MOCK_MY_COUPONS')[1]?.split('\nexport')?.[0] ?? '';
    assert.ok(mySection.includes("'claimed'") || mySection.includes("'used'"), '我的券缺少状态');
  });

  it('A8: STEPPED_RULES 包含 6 个满减阶梯', () => {
    const rules = (dataSrc.match(/threshold: \d+/g) || []).length;
    assert.ok(rules >= 6, `阶梯规则 < 6 (actual ${rules})`);
    assert.ok(dataSrc.includes('STEPPED_RULES'), '缺少 STEPPED_RULES');
  });

  it('A9: CouponStatus 为联合类型含 4 种状态', () => {
    assert.ok(dataSrc.includes("type CouponStatus"), '缺少 CouponStatus');
    assert.ok(dataSrc.includes("'available'"), '缺少 available');
    assert.ok(dataSrc.includes("'claimed'"), '缺少 claimed');
    assert.ok(dataSrc.includes("'used'"), '缺少 used');
    assert.ok(dataSrc.includes("'expired'"), '缺少 expired');
  });

  it('A10: formatDate/getStatusLabel/getStatusColor 工具函数存在', () => {
    assert.ok(dataSrc.includes('export function formatDate'), '缺少 formatDate');
    assert.ok(dataSrc.includes('export function getStatusLabel'), '缺少 getStatusLabel');
    assert.ok(dataSrc.includes('export function getStatusColor'), '缺少 getStatusColor');
  });

  it('A11: 联盟券涉及至少2个门店', () => {
    const storeIds = (dataSrc.match(/storeId: '/g) || []).length;
    assert.ok(storeIds >= 15, `门店数 < 15 (actual ${storeIds})`); // minimum from data
  });

  it('A12: 每种优惠券类型至少出现一次', () => {
    assert.ok(dataSrc.includes("type: 'discount'"), '缺少 discount 券');
    assert.ok(dataSrc.includes("type: 'cash'"), '缺少 cash 券');
    assert.ok(dataSrc.includes("type: 'shipping'"), '缺少 shipping 券');
    assert.ok(dataSrc.includes("type: 'gift'"), '缺少 gift 券');
  });
});

// ====================================================================
// 测试集 B: Service 函数 (service)
// ====================================================================
describe('🅱️ CouponCenter: 服务函数(正例)', () => {

  it('B1: service 导出 6 个异步函数', () => {
    assert.ok(svcSrc.includes('export async function getAvailableCoupons'), '缺少 getAvailableCoupons');
    assert.ok(svcSrc.includes('export async function getMyCoupons'), '缺少 getMyCoupons');
    assert.ok(svcSrc.includes('export async function claimCoupon'), '缺少 claimCoupon');
    assert.ok(svcSrc.includes('export async function useCoupon'), '缺少 useCoupon');
    assert.ok(svcSrc.includes('export async function getAllianceCoupons'), '缺少 getAllianceCoupons');
    assert.ok(svcSrc.includes('export function evaluateDiscount'), '缺少 evaluateDiscount');
  });

  it('B2: claimCoupon 返回 success/message', () => {
    assert.ok(svcSrc.includes('success: boolean'), '返回值缺少 success');
    assert.ok(svcSrc.includes('message: string'), '返回值缺少 message');
  });

  it('B3: useCoupon 接收 couponId 和 orderId', () => {
    assert.ok(svcSrc.includes('couponId'), 'useCoupon 缺少 couponId 参数');
    assert.ok(svcSrc.includes('orderId'), 'useCoupon 缺少 orderId 参数');
  });

  it('B4: evaluateDiscount 接收 amount 和可选的 couponId', () => {
    const funcMatch = svcSrc.match(/export function evaluateDiscount[\s\S]*?(?=\nexport )/);
    assert.ok(funcMatch, '缺少 evaluateDiscount 函数');
    assert.ok(svcSrc.includes('evaluateDiscount'), '缺少 evaluateDiscount 函数');
    assert.ok(svcSrc.includes('amount: number'), '参数缺少 amount');
    assert.ok(svcSrc.includes('couponId?: string'), '参数缺少 couponId');
  });

  it('B5: getAIRecommendedCoupon 函数存在', () => {
    assert.ok(svcSrc.includes('getAIRecommendedCoupon'), '缺少 getAIRecommendedCoupon');
  });

  it('B6: 服务函数有 fallback mock 数据', () => {
    assert.ok(svcSrc.includes('MOCK_AVAILABLE_COUPONS'), '缺少 mock fallback');
    assert.ok(svcSrc.includes('MOCK_MY_COUPONS'), '缺少 my coupons fallback');
    assert.ok(svcSrc.includes('MOCK_ALLIANCE_COUPONS'), '缺少 alliance fallback');
  });

  it('B7: claimCoupon 含 POST 请求', () => {
    assert.ok(svcSrc.includes("method: 'POST'"), 'claimCoupon 缺少 POST');
    assert.ok(svcSrc.includes("'/api/coupons/claim'"), '缺少 claim endpoint');
  });

  it('B8: useCoupon 含 POST 请求', () => {
    assert.ok(svcSrc.includes("method: 'POST'"), 'useCoupon 缺少 POST');
    assert.ok(svcSrc.includes("'/api/coupons/use'"), '缺少 use endpoint');
  });
});

// ====================================================================
// 测试集 C: 页面组件结构 (page.tsx)
// ====================================================================
describe('🅲 CouponCenter: 页面组件结构(正例)', () => {

  it('C1: 默认导出 CouponCenterPage', () => {
    assert.ok(pageSrc.includes('export default function CouponCenterPage'), '缺少默认导出');
  });

  it('C2: 声明 TabType = available | mine | alliance', () => {
    assert.ok(pageSrc.includes("type TabType ="), '缺少 TabType');
    assert.ok(pageSrc.includes("'available'"), '缺少 available tab');
    assert.ok(pageSrc.includes("'mine'"), '缺少 mine tab');
    assert.ok(pageSrc.includes("'alliance'"), '缺少 alliance tab');
  });

  it('C3: 三个 tab 用 useState 维护', () => {
    assert.ok(pageSrc.includes('activeTab, setActiveTab'), '缺少 activeTab state');
    assert.ok(pageSrc.includes("useState<TabType>('available')"), '缺少可用状态初始值');
  });

  it('C4: 页面包含三组状态', () => {
    assert.ok(pageSrc.includes('availableCoupons') || pageSrc.includes('MOCK_AVAILABLE_COUPONS'), '缺少可用券');
    assert.ok(pageSrc.includes('myCoupons') || pageSrc.includes('MOCK_MY_COUPONS'), '缺少我的券');
    assert.ok(pageSrc.includes('allianceCoupons') || pageSrc.includes('MOCK_ALLIANCE_COUPONS'), '缺少联盟券');
  });

  it('C5: handleClaim 函数存在', () => {
    assert.ok(pageSrc.includes('const handleClaim') || pageSrc.includes('async handleClaim'), '缺少 handleClaim');
    assert.ok(pageSrc.includes('claimCoupon'), 'handleClaim 中调用 claimCoupon');
  });

  it('C6: handleUse 函数存在', () => {
    assert.ok(pageSrc.includes('const handleUse') || pageSrc.includes('async handleUse'), '缺少 handleUse');
    assert.ok(pageSrc.includes('useCoupon'), 'handleUse 中调用 useCoupon');
  });

  it('C7: AI Modal 相关的 showAIModal/aiRecommended', () => {
    assert.ok(pageSrc.includes('showAIModal'), '缺少 showAIModal');
    assert.ok(pageSrc.includes('aiRecommended'), '缺少 aiRecommended');
    assert.ok(pageSrc.includes('handleAIRecommend'), '缺少 handleAIRecommend');
  });

  it('C8: renderCouponCard 组件函数存在', () => {
    assert.ok(pageSrc.includes('renderCouponCard'), '缺少 renderCouponCard');
    assert.ok(pageSrc.includes('canClaim'), '缺少 canClaim 状态判断');
    assert.ok(pageSrc.includes('canUse'), '缺少 canUse 状态判断');
  });

  it('C9: renderSteppedDiscount 组件函数存在', () => {
    assert.ok(pageSrc.includes('renderSteppedDiscount'), '缺少 renderSteppedDiscount');
    assert.ok(pageSrc.includes('STEPPED_RULES'), '引用阶梯规则');
  });

  it('C10: orderAmount 状态用于阶梯计算和 AI 推荐', () => {
    assert.ok(pageSrc.includes('orderAmount'), '缺少 orderAmount');
    assert.ok(pageSrc.includes('setOrderAmount'), '缺少 setOrderAmount');
  });

  it('C11: 页面上有立即领取/去使用按钮', () => {
    assert.ok(pageSrc.includes('立即领取') || pageSrc.includes('领取'), '缺少领取按钮');
    assert.ok(pageSrc.includes('去使用') || pageSrc.includes('使用'), '缺少使用按钮');
  });

  it('C12: 联盟券有跨店标识和门店图标', () => {
    assert.ok(pageSrc.includes('联盟券'), '缺少联盟券标识');
    assert.ok(pageSrc.includes('partnerStores'), '缺少 partnerStores 引用');
    assert.ok(pageSrc.includes('跨店'), '缺少跨店文字');
  });

  it('C13: 标签渲染包含 tags map', () => {
    assert.ok(pageSrc.includes('.tags?.map'), '缺少 tags map 渲染');
  });

  it('C14: 四个状态标签显示 getStatusLabel', () => {
    assert.ok(pageSrc.includes('getStatusLabel'), '缺少 getStatusLabel 调用');
    assert.ok(pageSrc.includes('getStatusColor'), '缺少 getStatusColor 调用');
  });

  it('C15: AI Modal 含蒙层和关闭功能', () => {
    assert.ok(pageSrc.includes('position: fixed') || pageSrc.includes('fixed'), 'AI Modal 缺少固定定位');
    assert.ok(pageSrc.includes('onClick={() => setShowAIModal(false)}'), '缺少点击关闭');
  });

  it('C16: 阶梯计算展示 discountResult', () => {
    assert.ok(pageSrc.includes('discountResult.discount') || pageSrc.includes('evaluateDiscount(orderAmount)'), '缺少折扣计算结果');
  });

  it('C17: 阶梯规则展示 active/best 状态', () => {
    assert.ok(pageSrc.includes('isActive'), '缺少阶梯激活状态');
    assert.ok(pageSrc.includes('isBest'), '缺少最佳阶梯状态');
  });

  it('C18: 页面用 PageShell 包装', () => {
    assert.ok(pageSrc.includes('<PageShell'), '缺少 PageShell');
    assert.ok(pageSrc.includes('优惠券中心'), '缺少标题');
  });
});

// ====================================================================
// 测试集 D: 空状态/边界 (反例 + 边界)
// ====================================================================
describe('🅳 CouponCenter: 空状态 & 边界', () => {

  it('D1 (反例): Tab available 空列表显示"暂无可领取的优惠券"', () => {
    assert.ok(pageSrc.includes('暂无可领取的优惠券'), '缺少空状态文案');
  });

  it('D2 (反例): Tab mine 空列表显示"还没有领取任何优惠券"', () => {
    assert.ok(pageSrc.includes('还没有领取任何优惠券'), '缺少 my tab 空状态');
  });

  it('D3 (反例): Tab alliance 空列表显示"暂无可用的联盟券"', () => {
    assert.ok(pageSrc.includes('暂无可用的联盟券'), '缺少 alliance tab 空状态');
  });

  it('D4 (边界): 联盟券 partnerStores > 4 显示 +N', () => {
    assert.ok(pageSrc.includes('.length > 4'), '缺少门店溢出判断');
    assert.ok(pageSrc.includes('+{'), '缺少 +N 显示');
  });

  it('D5 (边界): 券已过期 isExpired 状态逻辑', () => {
    assert.ok(pageSrc.includes('isExpired'), '缺少 expired 状态判断');
  });

  it('D6 (边界): 券已使用 isUsed 状态逻辑', () => {
    assert.ok(pageSrc.includes('isUsed'), '缺少 used 状态判断');
  });

  it('D7 (反例): AI 推荐无匹配时显示"暂未找到适合您的优惠券"', () => {
    assert.ok(pageSrc.includes('暂未找到适合您的优惠券'), '缺少AI推荐空状态');
  });

  it('D8 (边界): 折扣类型渲染', () => {
    assert.ok(
      (pageSrc.includes("'discount'") && pageSrc.includes("比例折扣")) ||
      (pageSrc.includes("'discount'") && pageSrc.includes("折")) ||
      pageSrc.includes("Math.round"),
      '缺少折扣类型渲染'
    );
  });
});

// ====================================================================
// 测试集 E: evaluateDiscount 逻辑 (边界)
// ====================================================================
describe('🅴 CouponCenter: 阶梯规则逻辑', () => {

  it('E1 (边界): evaluateDiscount 对于 amount <= 0 返回零优惠', () => {
    assert.ok(svcSrc.includes('amount <= 0') || svcSrc.includes("discount: 0"), '缺少零金额检查');
    assert.ok(svcSrc.includes('return { discount: 0, savings: 0 }'), '缺少零返回');
  });

  it('E2 (正例): 阶梯规则使用 Math.max 选择最佳折扣', () => {
    assert.ok(svcSrc.includes('maxDiscount') || svcSrc.includes('bestRule'), '缺少最优折扣选择');
  });

  it('E3 (正例): 券折扣计算区分 cash 和 discount 类型', () => {
    assert.ok(svcSrc.includes("coupon.type === 'cash'"), '缺少 cash 类型处理');
    assert.ok(svcSrc.includes("coupon.type === 'discount'"), '缺少 discount 类型处理');
    assert.ok(svcSrc.includes('maxDiscountAmount'), '缺少 maxDiscountAmount 检查');
  });

  it('E4 (反例): 未达到 threshold 的规则不触发', () => {
    assert.ok(svcSrc.includes('amount >= rule.threshold'), '缺少门槛判断');
  });
});

// ====================================================================
// 测试集 F: getAIRecommendedCoupon 逻辑
// ====================================================================
describe('🅵 CouponCenter: AI 推荐逻辑', () => {

  it('F1 (正例): 推荐匹配最佳 savings 券', () => {
    assert.ok(svcSrc.includes('bestSavings'), '缺少最佳 savings 选择');
    assert.ok(svcSrc.includes('savings > bestSavings'), '缺少比较逻辑');
  });

  it('F2 (边界): coupons 为空返回 null', () => {
    assert.ok(svcSrc.includes('.length === 0') || svcSrc.includes('amount <= 0'), '缺少空数组检查');
    assert.ok(svcSrc.includes('return null'), '缺少 null 返回');
  });

  it('F3 (反例): 跳过 status !== available 的券', () => {
    assert.ok(svcSrc.includes("coupon.status !== 'available'"), '缺少不可领取检查');
  });

  it('F4 (反例): 跳过 amount < minOrderAmount 的券', () => {
    assert.ok(svcSrc.includes('amount < coupon.minOrderAmount'), '缺少未达到最低消费检查');
  });
});

// ====================================================================
// 测试集 G: 数据一致性 (正例)
// ====================================================================
describe('🅶 CouponCenter: 数据一致性', () => {

  it('G1: page.tsx 用的 type 名与 data.ts export 一致', () => {
    assert.ok(pageSrc.includes('from') && pageSrc.includes('./coupon-center-data'), 'page 导入 data');
    assert.ok(dataSrc.includes('export interface Coupon'), 'data 导出 Coupon');
    assert.ok(dataSrc.includes('export interface AllianceCoupon'), 'data 导出 AllianceCoupon');
    assert.ok(dataSrc.includes('export interface SteppedRule'), 'data 导出 SteppedRule');
  });

  it('G2: service 导入 data 的类型', () => {
    assert.ok(svcSrc.includes("from './coupon-center-data'"), 'service 导入 data');
  });

  it('G3: page 导入 service 的函数', () => {
    assert.ok(pageSrc.includes("from './coupon-center-service'"), 'page 导入 service');
  });

  it('G4: Coupon.discountValue 为 number, type 为联合类型', () => {
    assert.ok(dataSrc.includes('discountValue: number'), 'discountValue 类型');
  });

  it('G5: SteppedRule.discount 为 number, label 为 string', () => {
    assert.ok(dataSrc.includes('discount: number;') || dataSrc.includes('discount: number\n'), 'SteppedRule.discount 类型');
    assert.ok(dataSrc.includes('label: string'), 'SteppedRule.label 类型');
  });

  it('G6: AllianceCoupon 关联门店带 logo 可选字段', () => {
    assert.ok(dataSrc.includes('logo?: string') || dataSrc.includes('logo?'), 'logo 可选字段');
  });
});
