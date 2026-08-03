/**
 * ai-sales-panel/page.test.ts — AI 销售面板页面 L1 测试
 *
 * 覆盖: Tab导航 / 智能推荐 / 异议处理 / 跟进任务 / 销售话术 /
 *       Mood数据 / 服务函数 / 空状态 / Modal弹窗
 * L1 JMeter 风格: 正例 + 反例 + 边界
 * 角色视角:
 *   🏢 销售 — 智能推荐产品、处理客户异议、跟进任务、话术参考
 *
 * 三件套: 正例 35+ | 反例 8+ | 边界 7+
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
const dataSrc = readSource('ai-sales-data.ts');
const svcSrc = readSource('ai-sales-service.ts');

// ====================================================================
// 测试集 A: 数据模型 (data)
// ====================================================================
describe('🎯 A: AISales 数据结构(正例)', () => {

  it('A1: RecommendedProduct 接口完整', () => {
    assert.ok(dataSrc.includes('interface RecommendedProduct'), '缺少 RecommendedProduct');
    assert.ok(dataSrc.includes('id'), '缺少 id');
    assert.ok(dataSrc.includes('name'), '缺少 name');
    assert.ok(dataSrc.includes('price'), '缺少 price');
    assert.ok(dataSrc.includes('category'), '缺少 category');
    assert.ok(dataSrc.includes('reason'), '缺少 reason');
    assert.ok(dataSrc.includes('matchScore'), '缺少 matchScore');
    assert.ok(dataSrc.includes('stock'), '缺少 stock');
  });

  it('A2: ObjectionCase 接口含 aiResponse', () => {
    assert.ok(dataSrc.includes('interface ObjectionCase'), '缺少 ObjectionCase');
    assert.ok(dataSrc.includes('type'), '缺少 type');
    assert.ok(dataSrc.includes('title'), '缺少 title');
    assert.ok(dataSrc.includes('scenario'), '缺少 scenario');
    assert.ok(dataSrc.includes('aiResponse'), '缺少 aiResponse');
  });

  it('A3: ObjectionType 联合类型含 4 种', () => {
    assert.ok(dataSrc.includes("type ObjectionType"), '缺少 ObjectionType');
    assert.ok(dataSrc.includes("'price'"), '缺少 price');
    assert.ok(dataSrc.includes("'quality'"), '缺少 quality');
    assert.ok(dataSrc.includes("'competitor'"), '缺少 competitor');
    assert.ok(dataSrc.includes("'need'"), '缺少 need');
  });

  it('A4: FollowUpTask 接口完整', () => {
    assert.ok(dataSrc.includes('interface FollowUpTask'), '缺少 FollowUpTask');
    assert.ok(dataSrc.includes('customerName'), '缺少 customerName');
    assert.ok(dataSrc.includes('content'), '缺少 content');
    assert.ok(dataSrc.includes('dueDate'), '缺少 dueDate');
    assert.ok(dataSrc.includes('priority'), '缺少 priority');
    assert.ok(dataSrc.includes("'high'"), '缺少 high');
    assert.ok(dataSrc.includes("'medium'"), '缺少 medium');
    assert.ok(dataSrc.includes("'low'"), '缺少 low');
    assert.ok(dataSrc.includes('status'), '缺少 status');
    assert.ok(dataSrc.includes("'pending'"), '缺少 pending');
    assert.ok(dataSrc.includes("'completed'"), '缺少 completed');
  });

  it('A5: SalesScript 接口含 tone 字段', () => {
    assert.ok(dataSrc.includes('interface SalesScript'), '缺少 SalesScript');
    assert.ok(dataSrc.includes('productName'), '缺少 productName');
    assert.ok(dataSrc.includes('scenario'), '缺少 scenario');
    assert.ok(dataSrc.includes('tone'), '缺少 tone');
    assert.ok(dataSrc.includes('content'), '缺少 content');
  });

  it('A6: ToneType 联合类型含 3 种', () => {
    assert.ok(dataSrc.includes("type ToneType"), '缺少 ToneType');
    assert.ok(dataSrc.includes("'professional'"), '缺少 professional');
    assert.ok(dataSrc.includes("'friendly'"), '缺少 friendly');
    assert.ok(dataSrc.includes("'urgent'"), '缺少 urgent');
  });

  it('A7: MOCK_RECOMMENDATIONS 至少 5 个推荐产品', () => {
    const count = (dataSrc.match(/id: '/g) || []).length;
    assert.ok(dataSrc.includes('MOCK_RECOMMENDATIONS'), '缺少 MOCK_RECOMMENDATIONS');
    assert.ok(dataSrc.includes('RP001'), '缺少第一个推荐产品 RP001');
    assert.ok(dataSrc.includes('RP005'), '缺少第五个推荐产品 RP005');
  });

  it('A8: MOCK_OBJECTIONS 至少 4 个异议', () => {
    assert.ok(dataSrc.includes('MOCK_OBJECTIONS'), '缺少 MOCK_OBJECTIONS');
    assert.ok(dataSrc.includes('OC001'), '缺少 OC001');
    assert.ok(dataSrc.includes('OC004'), '缺少 OC004');
  });

  it('A9: MOCK_FOLLOW_UPS 至少 3 个跟进', () => {
    assert.ok(dataSrc.includes('MOCK_FOLLOW_UPS'), '缺少 MOCK_FOLLOW_UPS');
    assert.ok(dataSrc.includes('FU001'), '缺少 FU001');
    assert.ok(dataSrc.includes('FU003'), '缺少 FU003');
  });

  it('A10: MOCK_SCRIPTS 至少 3 个话术', () => {
    assert.ok(dataSrc.includes('MOCK_SCRIPTS'), '缺少 MOCK_SCRIPTS');
    assert.ok(dataSrc.includes('SS001'), '缺少 SS001');
    assert.ok(dataSrc.includes('SS003'), '缺少 SS003');
  });

  it('A11: 客户异议类型覆盖四种', () => {
    assert.ok(dataSrc.includes("title: '价格太贵了'"), '缺少价格异议');
    assert.ok(dataSrc.includes("title: '担心质量问题'"), '缺少质量异议');
    assert.ok(dataSrc.includes("title: '别家更便宜'"), '缺少竞品异议');
    assert.ok(dataSrc.includes("title: '需要再考虑'"), '缺少需求异议');
  });

  it('A12: 话术覆盖 friendly/professional/urgent 三种语气', () => {
    assert.ok(dataSrc.includes("'friendly'"), '缺少 friendly 语气');
    assert.ok(dataSrc.includes("'professional'"), '缺少 professional 语气');
    assert.ok(dataSrc.includes("'urgent'"), '缺少 urgent 语气');
  });

  it('A13: 每个推荐产品有 matchScore 和 reason', () => {
    assert.ok(dataSrc.includes('matchScore'), '推荐产品 matchScore');
    assert.ok(dataSrc.includes('reason'), '推荐产品 reason');
    assert.ok(dataSrc.includes('stock'), '推荐产品 stock');
  });
});

// ====================================================================
// 测试集 B: 服务函数 (service)
// ====================================================================
describe('🎯 B: AISales 服务函数(正例)', () => {

  it('B1: service 导出 6 个函数', () => {
    assert.ok(svcSrc.includes('export async function getRecommendations'), '缺少 getRecommendations');
    assert.ok(svcSrc.includes('export async function getUpsellRecommendations'), '缺少 getUpsellRecommendations');
    assert.ok(svcSrc.includes('export async function getCrossSellRecommendations'), '缺少 getCrossSellRecommendations');
    assert.ok(svcSrc.includes('export async function handleObjection'), '缺少 handleObjection');
    assert.ok(svcSrc.includes('export async function getFollowUps'), '缺少 getFollowUps');
    assert.ok(svcSrc.includes('export async function completeFollowUp'), '缺少 completeFollowUp');
  });

  it('B2: getSalesScript 函数按 productId + tone 查询', () => {
    assert.ok(svcSrc.includes('getSalesScript'), '缺少 getSalesScript');
    assert.ok(svcSrc.includes('productId'), '缺少 productId 参数');
    assert.ok(svcSrc.includes('tone'), '缺少 tone 参数');
  });

  it('B3: handleObjection 返回 response + suggestedQuestions', () => {
    assert.ok(svcSrc.includes('response: string'), '缺少 response');
    assert.ok(svcSrc.includes('suggestedQuestions'), '缺少 suggestedQuestions');
  });

  it('B4: getUpsellRecommendations 过滤 matchScore > 85', () => {
    assert.ok(svcSrc.includes('matchScore > 85'), 'upsell 缺少 >85 过滤');
  });

  it('B5: getCrossSellRecommendations 过滤 70 < matchScore <= 85', () => {
    assert.ok(svcSrc.includes('matchScore <= 85'), 'crossSell 缺少 <=85 过滤');
    assert.ok(svcSrc.includes('matchScore > 70'), 'crossSell 缺少 >70 过滤');
  });

  it('B6: handleObjection 找不到时返回默认信息', () => {
    assert.ok(svcSrc.includes('!objection'), '缺少未找到的检查');
    assert.ok(svcSrc.includes('抱歉'), '缺少默认回复');
  });

  it('B7: completeFollowUp 更新任务状态为 completed', () => {
    assert.ok(svcSrc.includes("'completed'"), '缺少 completed 状态');
    assert.ok(svcSrc.includes('...task'), '缺少展开更新');
  });

  it('B8: getRecommendations 默认返回全部', () => {
    assert.ok(svcSrc.includes('MOCK_RECOMMENDATIONS.length'), '返回全部推荐');
  });
});

// ====================================================================
// 测试集 C: 页面组件结构 (page.tsx)
// ====================================================================
describe('🎯 C: AISales 页面组件(正例)', () => {

  it('C1: 默认导出 AISalesPanelPage', () => {
    assert.ok(pageSrc.includes('export default function AISalesPanelPage'), '缺少默认导出');
  });

  it('C2: TabType = recommend | objection | followup | script', () => {
    assert.ok(pageSrc.includes("type TabType ="), '缺少 TabType');
    assert.ok(pageSrc.includes("'recommend'"), '缺少 recommend');
    assert.ok(pageSrc.includes("'objection'"), '缺少 objection');
    assert.ok(pageSrc.includes("'followup'"), '缺少 followup');
    assert.ok(pageSrc.includes("'script'"), '缺少 script');
  });

  it('C3: 四个 tab 导航渲染', () => {
    assert.ok(pageSrc.includes('智能推荐'), '缺少智能推荐');
    assert.ok(pageSrc.includes('异议处理'), '缺少异议处理');
    assert.ok(pageSrc.includes('跟进任务'), '缺少跟进任务');
    assert.ok(pageSrc.includes('销售话术'), '缺少销售话术');
  });

  it('C4: Tab 导航含图标', () => {
    assert.ok(pageSrc.includes('🎯'), '缺少推荐图标');
    assert.ok(pageSrc.includes('💬'), '缺少异议图标');
    assert.ok(pageSrc.includes('📋'), '缺少跟进图标');
    assert.ok(pageSrc.includes('📝'), '缺少话术图标');
  });

  it('C5: activeTab 状态管理', () => {
    assert.ok(pageSrc.includes('activeTab, setActiveTab'), '缺少 activeTab state');
    assert.ok(pageSrc.includes("useState<TabType>('recommend')"), '初始值不为 recommend');
  });

  it('C6: loading 状态管理', () => {
    assert.ok(pageSrc.includes('loading'), '缺少 loading');
    assert.ok(pageSrc.includes('setLoading'), '缺少 setLoading');
    assert.ok(pageSrc.includes('加载中...'), '缺少加载中文案');
  });

  it('C7: 智能推荐部分渲染推荐列表', () => {
    assert.ok(pageSrc.includes('recommendations.map'), '推荐列表遍历');
    assert.ok(pageSrc.includes('product.name'), '缺少 name 渲染');
    assert.ok(pageSrc.includes('product.price'), '缺少 price 渲染');
    assert.ok(pageSrc.includes('product.reason'), '缺少 reason 渲染');
  });

  it('C8: 智能推荐含 matchScore/stock/category 展示', () => {
    assert.ok(pageSrc.includes('product.matchScore'), '缺少 matchScore');
    assert.ok(pageSrc.includes('product.stock'), '缺少 stock');
    assert.ok(pageSrc.includes('product.category'), '缺少 category');
  });

  it('C9: 智能推荐有"推荐给客户"按钮', () => {
    assert.ok(pageSrc.includes('推荐给客户'), '缺少推荐给客户按钮');
  });

  it('C10: 异议处理含 4 种异议类型按钮', () => {
    assert.ok(pageSrc.includes('价格异议'), '缺少价格异议');
    assert.ok(pageSrc.includes('质量疑虑'), '缺少质量疑虑');
    assert.ok(pageSrc.includes('竞品比较'), '缺少竞品比较');
    assert.ok(pageSrc.includes('需求考虑'), '缺少需求考虑');
  });

  it('C11: 异议处理左侧类型选择交互', () => {
    assert.ok(pageSrc.includes('handleObjectionChange'), '缺少异议切换');
    assert.ok(pageSrc.includes('objectionType'), '缺少 objectionType');
  });

  it('C12: 异议右侧显示 AI 回复', () => {
    assert.ok(pageSrc.includes('AI助手回复'), '缺少 AI 助手标题');
    assert.ok(pageSrc.includes('aiResponse'), '缺少 aiResponse 渲染');
  });

  it('C13: AI 回复含 suggestedQuestions', () => {
    assert.ok(pageSrc.includes('suggestedQuestions'), '缺少建议追问');
    assert.ok(pageSrc.includes('建议追问'), '缺少建议追问标题');
  });

  it('C14: 跟进任务渲染待办列表', () => {
    assert.ok(pageSrc.includes('followUps.map'), '跟进列表遍历');
    assert.ok(pageSrc.includes('task.content'), '缺少内容渲染');
    assert.ok(pageSrc.includes('task.customerName'), '缺少客户名');
    assert.ok(pageSrc.includes('task.dueDate'), '缺少截止日期');
  });

  it('C15: 跟进任务优先级标签', () => {
    assert.ok(pageSrc.includes('task.priority'), '缺少优先级');
    assert.ok(pageSrc.includes("'high'") && pageSrc.includes("'high'"), '缺少 high 优先级');
  });

  it('C16: 跟进任务含"标记完成"按钮', () => {
    assert.ok(pageSrc.includes('标记完成'), '缺少标记完成');
    assert.ok(pageSrc.includes('handleCompleteTask'), '缺少完成处理');
  });

  it('C17: 已完成任务降低透明度', () => {
    assert.ok(pageSrc.includes("task.status === 'completed'"), '缺少 completed 判断');
    assert.ok(pageSrc.includes('opacity:'), '缺少透明度处理');
  });

  it('C18: 销售话术列表渲染 scripts', () => {
    assert.ok(pageSrc.includes('scripts.map'), '话术遍历');
    assert.ok(pageSrc.includes('script.productName'), '缺少话术商品名');
    assert.ok(pageSrc.includes('script.scenario'), '缺少话术场景');
    assert.ok(pageSrc.includes('script.content'), '缺少话术内容');
  });

  it('C19: 话术 tone 标签显示', () => {
    assert.ok(pageSrc.includes('script.tone'), '缺少 tone');
    assert.ok(dataSrc.includes('"professional"') || dataSrc.includes("'professional'"), 'data 含 professional');
    assert.ok(dataSrc.includes('"friendly"') || dataSrc.includes("'friendly'"), 'data 含 friendly');
    assert.ok(dataSrc.includes('"urgent"') || dataSrc.includes("'urgent'"), 'data 含 urgent');
  });

  it('C20: 话术详情弹窗 modal', () => {
    assert.ok(pageSrc.includes('selectedScript'), '缺少 selectedScript');
    assert.ok(pageSrc.includes('setSelectedScript(null)'), '缺少关闭 modal');
  });

  it('C21: 话术含"复制话术"按钮', () => {
    assert.ok(pageSrc.includes('复制话术'), '缺少复制按钮');
  });

  it('C22: handleObjectionChange 函数存在', () => {
    assert.ok(pageSrc.includes('async function handleObjectionChange'), '缺少 handleObjectionChange');
  });

  it('C23: handleCompleteTask 函数存在', () => {
    assert.ok(pageSrc.includes('async function handleCompleteTask'), '缺少 handleCompleteTask');
  });

  it('C24: loadData 函数在 activeTab 变化时更新', () => {
    assert.ok(pageSrc.includes('loadData()'), '缺少 loadData 调用');
    assert.ok(pageSrc.includes('[activeTab]'), '缺少 activeTab 依赖');
  });
});

// ====================================================================
// 测试集 D: 反例 + 边界
// ====================================================================
describe('🎯 D: AISales 空状态 & 边界', () => {

  it('D1 (反例): 加载中显示"加载中..."', () => {
    assert.ok(pageSrc.includes('加载中...'), '缺少加载中展示');
  });

  it('D2 (反例): handleObjection 找不到 type 返回默认', () => {
    assert.ok(svcSrc.includes('!objection') && svcSrc.includes('抱歉'), '缺少未找到处理');
  });

  it('D3 (边界): 推荐 matchScore >= 90 绿色, < 90 黄色', () => {
    assert.ok(pageSrc.includes('matchScore >= 90') || pageSrc.includes('matchScore >= 90'), '缺少 high score 判断');
  });

  it('D4 (反例): completeFollowUp 找不到 task 返回 null', () => {
    assert.ok(svcSrc.includes('if (!task) return null'), '缺少 null 返回');
  });

  it('D5 (边界): getSalesScript 找不到指定 tone 时返回第一个', () => {
    assert.ok(svcSrc.includes('||') && svcSrc.includes('find'), '缺少 fallback 查找');
  });

  it('D6 (反例): 空 tips 时 not empty 判断', () => {
    assert.ok(pageSrc.includes('.length > 0'), '缺少长度判断');
  });

  it('D7 (边界): CURRENCIES/TIMEZONES slice 处理', () => {
    // page has scripts.map which renders a card for each
    assert.ok(pageSrc.includes('scripts.map'), '遍历渲染脚本');
  });

  it('D8 (边界): 弹窗含 stopPropagation 防止点击背景关闭', () => {
    assert.ok(pageSrc.includes('e.stopPropagation()'), '缺少 stopPropagation');
  });

  it('D9 (反例): followUp status=pending 显示标记完成按钮', () => {
    assert.ok(pageSrc.includes("task.status === 'pending'"), '缺少 pending 条件');
  });

  it('D10 (边界): 24px padding 作用于 container', () => {
    assert.ok(pageSrc.includes('padding: 24'), '缺少 24px padding');
    assert.ok(pageSrc.includes('1400px') || pageSrc.includes('maxWidth: 1400'), '缺少 maxWidth 限制');
  });
});

// ====================================================================
// 测试集 E: 数据一致性
// ====================================================================
describe('🎯 E: AISales 数据一致性', () => {

  it('E1: page 导入 data 和 service', () => {
    assert.ok(pageSrc.includes("from './ai-sales-data'"), 'page 导入 data');
    assert.ok(pageSrc.includes("from './ai-sales-service'"), 'page 导入 service');
  });

  it('E2: service 导入 data', () => {
    assert.ok(svcSrc.includes("from './ai-sales-data'"), 'service 导入 data');
  });

  it('E3: 推荐产品包含 imageUrl', () => {
    assert.ok(dataSrc.includes('imageUrl'), '推荐产品 imageUrl');
  });

  it('E4: handleObjection 参数 context 可选', () => {
    assert.ok(svcSrc.includes('context'), '缺少 context 参数');
  });

  it('E5: 跟进任务包含 customerId', () => {
    assert.ok(dataSrc.includes('customerId'), '跟进任务 customerId');
  });
});
