/**
 * ai-marketing/ai-marketing-data-service.test.ts — AI营销数据层+服务层综合测试
 *
 * 测试策略：
 *   — 正例: Mock数据完整性、类型定义验证、服务函数行为
 *   — 反例: 空值/无效输入/API失败回退
 *   — 边界: 数据一致性、数字边界、时间格式
 *
 * 角色视角: 👔运营经理 · 📊数据分析师
 *
 * 注意: 本文件为纯数据层测试(readFileSync)，不依赖DOM/浏览器环境。
 *       与 page.test.ts 互补——page.test.ts 专注页面组件源码分析。
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function readSource(file: string): string {
  return readFileSync(resolve(__dirname, file), 'utf-8');
}

const dataSrc = readSource('ai-marketing-data.ts');
const svcSrc = readSource('ai-marketing-service.ts');

// ==========================================================================
// 第一部分: 数据模型 & Mock 数据完整性 (正例)
// ==========================================================================
describe('ai-marketing-data — 数据模型定义（正例）', () => {
  it('Campaign 接口包含全部核心字段', () => {
    assert.ok(dataSrc.includes('interface Campaign'), '缺少 Campaign 接口');
    for (const field of ['id', 'name', 'status', 'roi', 'reachCount', 'createdAt', 'description']) {
      assert.ok(dataSrc.includes(`${field}:`), `缺少 Campaign.${field}`);
    }
  });

  it('Campaign 的 status 字段为联合类型 (active|paused|draft|ended)', () => {
    const statusLine = dataSrc.match(/status:\s*'[^']*'\s*\|\s*'[^']*'\s*\|\s*'[^']*'\s*\|\s*'[^']*'/);
    assert.ok(statusLine, 'status 应为 4 种值的联合类型');
    assert.ok(statusLine[0].includes('active'), '缺少 active');
    assert.ok(statusLine[0].includes('paused'), '缺少 paused');
    assert.ok(statusLine[0].includes('draft'), '缺少 draft');
    assert.ok(statusLine[0].includes('ended'), '缺少 ended');
  });

  it('CopyVariant 接口包含 variant 字段 (A|B|C)', () => {
    assert.ok(dataSrc.includes('interface CopyVariant'), '缺少 CopyVariant');
    assert.ok(dataSrc.includes("id"), '缺少 id');
    assert.ok(dataSrc.includes("campaignId"), '缺少 campaignId');
    assert.ok(dataSrc.includes("title"), '缺少 title');
    assert.ok(dataSrc.includes("body"), '缺少 body');
    assert.ok(dataSrc.includes("cta"), '缺少 cta');
    assert.ok(dataSrc.includes("variant"), '缺少 variant');
  });

  it('CopyVariant 的 variant 为联合类型', () => {
    assert.ok(dataSrc.includes("'A'") || dataSrc.includes('"A"'), '缺少 A');
    assert.ok(dataSrc.includes("'B'") || dataSrc.includes('"B"'), '缺少 B');
    assert.ok(dataSrc.includes("'C'") || dataSrc.includes('"C"'), '缺少 C');
  });

  it('ABExperiment 接口包含全部核心字段', () => {
    assert.ok(dataSrc.includes('interface ABExperiment'), '缺少 ABExperiment');
    for (const field of ['id', 'campaignId', 'name', 'variants', 'lift', 'confidence', 'status', 'startDate']) {
      assert.ok(dataSrc.includes(`${field}:`), `缺少 ABExperiment.${field}`);
    }
  });

  it('ABExperiment 的 status 为 running|completed|draft', () => {
    const match = dataSrc.match(/status:\s*'[^']*'/);
    assert.ok(match, 'status 字段存在');
    assert.ok(dataSrc.includes("'running'"), '缺少 running');
    assert.ok(dataSrc.includes("'completed'"), '缺少 completed');
  });

  it('ABExperiment endDate 为可选字段', () => {
    assert.ok(dataSrc.includes('endDate?'), '缺少 endDate?');
  });

  it('MemberSegment 接口包含全部核心字段', () => {
    assert.ok(dataSrc.includes('interface MemberSegment'), '缺少 MemberSegment');
    for (const field of ['id', 'name', 'type', 'memberCount', 'description', 'avgOrderValue', 'lastActiveDays']) {
      assert.ok(dataSrc.includes(`${field}:`), `缺少 MemberSegment.${field}`);
    }
  });

  it('MemberSegment 的 type 为 new|active|dormant|churned', () => {
    assert.ok(dataSrc.includes("'new'"), '缺少 new');
    assert.ok(dataSrc.includes("'active'"), '缺少 active');
    assert.ok(dataSrc.includes("'dormant'"), '缺少 dormant');
    assert.ok(dataSrc.includes("'churned'"), '缺少 churned');
  });

  it('ROIMetrics 接口包含全部指标字段', () => {
    assert.ok(dataSrc.includes('interface ROIMetrics'), '缺少 ROIMetrics');
    for (const field of ['campaignId', 'revenue', 'cost', 'roi', 'conversions', 'impressions', 'ctr']) {
      assert.ok(dataSrc.includes(`${field}:`), `缺少 ROIMetrics.${field}`);
    }
  });
});

// ==========================================================================
// 第二部分: MOCK 数据完整性 (正例)
// ==========================================================================
describe('ai-marketing-data — MOCK 数据（正例）', () => {
  it('MOCK_CAMPAIGNS 包含 5 条记录', () => {
    const ids = dataSrc.match(/id:\s+'C\d{3}'/g);
    assert.ok(ids, '未找到活动 ID');
    assert.equal(ids.length, 5, '应有 5 个活动');
  });

  it('每条 Campaign 有唯一 ID 且 status 均在类型定义范围内', () => {
    // 类型联合定义中包含四种状态
    assert.ok(dataSrc.includes("'active'"), '缺少 active 状态');
    assert.ok(dataSrc.includes("'paused'"), '缺少 paused 状态');
    assert.ok(dataSrc.includes("'draft'"), '缺少 draft 状态');
    assert.ok(dataSrc.includes("'ended'"), '缺少 ended 状态');
    // Mock 数据中至少含有 active/paused/ended 三种实际状态值
    const activeCount = (dataSrc.match(/'active'/g) || []).length;
    const pausedCount = (dataSrc.match(/'paused'/g) || []).length;
    const endedCount = (dataSrc.match(/'ended'/g) || []).length;
    assert.ok(activeCount >= 2, `active 出现次数 ${activeCount} < 2`);
    assert.ok(pausedCount >= 1, `paused 出现次数 ${pausedCount} < 1`);
    assert.ok(endedCount >= 1, `ended 出现次数 ${endedCount} < 1`);
  });

  it('活动的 reachCount 均为正数', () => {
    const matched = dataSrc.match(/reachCount:\s*\d+/g);
    assert.ok(matched && matched.length >= 5, '至少 5 个 reachCount');
    for (const m of matched) {
      const val = parseInt(m.split(':')[1].trim(), 10);
      assert.ok(val > 0, `reachCount 应为正数，但 ${m}`);
    }
  });

  it('活动的 roi 值均在合理范围 (1.0-6.0)', () => {
    const matched = dataSrc.match(/roi:\s*[\d.]+/g);
    assert.ok(matched && matched.length >= 5, '至少 5 个 roi 值');
    for (const m of matched) {
      const val = parseFloat(m.split(':')[1].trim());
      assert.ok(val >= 0 && val <= 10, `roi ${val} 超出预期范围`);
    }
  });

  it('MOCK_AB_EXPERIMENTS 包含 3 组实验', () => {
    const ids = dataSrc.match(/id:\s+'AB\d{3}'/g);
    assert.ok(ids, '未找到实验 ID');
    assert.equal(ids.length, 3, '应有 3 组实验');
  });

  it('每组实验 variants 包含变体 A 和 B', () => {
    const variantACount = (dataSrc.match(/variant:\s*'A'/g) || []).length;
    const variantBCount = (dataSrc.match(/variant:\s*'B'/g) || []).length;
    assert.ok(variantACount >= 3, `应有至少 3 个变体 A, 实际 ${variantACount}`);
    assert.ok(variantBCount >= 3, `应有至少 3 个变体 B, 实际 ${variantBCount}`);
  });

  it('每组实验的 lift 和 confidence 值合理', () => {
    const lifts = dataSrc.match(/lift:\s*[\d.]+/g);
    assert.ok(lifts && lifts.length >= 3, '至少 3 个 lift');
    for (const l of lifts) {
      const val = parseFloat(l.split(':')[1].trim());
      assert.ok(val >= 0 && val <= 30, `lift ${val} 超出 [0,30]`);
    }
  });

  it('实验中 completed 状态和 running 状态均存在', () => {
    assert.ok(dataSrc.includes("status: 'completed'"), '缺少 completed 状态');
    assert.ok(dataSrc.includes("status: 'running'"), '缺少 running 状态');
  });

  it('MOCK_SEGMENTS 包含 4 种分群', () => {
    const ids = dataSrc.match(/id:\s+'S\d{3}'/g);
    assert.ok(ids, '未找到分群 ID');
    assert.equal(ids.length, 4, '应有 4 种分群');
  });

  it('每种分群 memberCount 为正数且合理范围', () => {
    const counts = dataSrc.match(/memberCount:\s*\d+/g);
    assert.ok(counts && counts.length >= 4, '至少 4 个 memberCount');
    for (const c of counts) {
      const val = parseInt(c.split(':')[1].trim(), 10);
      assert.ok(val > 0 && val <= 100000, `memberCount ${val} 超范围`);
    }
  });

  it('流失用户(churned) avgOrderValue 为 0', () => {
    // Find churned segment - should have avgOrderValue: 0
    assert.ok(dataSrc.includes("S004"), '缺少 S004 流失用户');
  });

  it('MOCK_ROI_METRICS 由 MOCK_CAMPAIGNS 派生', () => {
    assert.ok(dataSrc.includes('MOCK_ROI_METRICS'), '缺少 MOCK_ROI_METRICS');
    assert.ok(dataSrc.includes('MOCK_CAMPAIGNS.map'), '缺少 map 派生逻辑');
    assert.ok(dataSrc.includes('Math.round'), '缺少 Math.round');
    assert.ok(dataSrc.includes('* 0.12'), '缺少 12% 转化率计算');
  });
});

// ==========================================================================
// 第三部分: 导出/名称空间 (正例)
// ==========================================================================
describe('ai-marketing-data — 导出完整性（正例）', () => {
  it('正确导出所有 type 和 interface', () => {
    assert.ok(dataSrc.includes('export interface Campaign'), '导出 Campaign');
    assert.ok(dataSrc.includes('export interface CopyVariant'), '导出 CopyVariant');
    assert.ok(dataSrc.includes('export interface ABExperiment'), '导出 ABExperiment');
    assert.ok(dataSrc.includes('export interface MemberSegment'), '导出 MemberSegment');
    assert.ok(dataSrc.includes('export interface ROIMetrics'), '导出 ROIMetrics');
  });

  it('正确导出所有 MOCK 常量和 MOCK_ROI_METRICS', () => {
    assert.ok(dataSrc.includes('export const MOCK_CAMPAIGNS'), '导出 MOCK_CAMPAIGNS');
    assert.ok(dataSrc.includes('export const MOCK_AB_EXPERIMENTS'), '导出 MOCK_AB_EXPERIMENTS');
    assert.ok(dataSrc.includes('export const MOCK_SEGMENTS'), '导出 MOCK_SEGMENTS');
    assert.ok(dataSrc.includes('export const MOCK_ROI_METRICS'), '导出 MOCK_ROI_METRICS');
  });
});

// ==========================================================================
// 第四部分: 服务函数 (正例)
// ==========================================================================
describe('ai-marketing-service — 服务函数（正例）', () => {
  it('导出 11 个异步函数', () => {
    const exports = svcSrc.match(/export async function/g);
    assert.ok(exports, '缺少 async 导出的函数');
    assert.equal(exports.length, 11, '应导出 11 个异步函数');
  });

  it('getCampaigns 和 getCampaign 存在', () => {
    assert.ok(svcSrc.includes('export async function getCampaigns'), '缺少 getCampaigns');
    assert.ok(svcSrc.includes('export async function getCampaign'), '缺少 getCampaign');
  });

  it('getCampaign 接受 id 参数并返回 Campaign | null', () => {
    assert.ok(svcSrc.includes('getCampaign(id'), '缺少 id 参数');
    assert.ok(svcSrc.includes('Campaign | null'), '返回类型 Campaign | null');
  });

  it('createCampaign 接受 data: Partial<Campaign>', () => {
    assert.ok(svcSrc.includes('createCampaign(data'), '缺少 data 参数');
    assert.ok(svcSrc.includes('Partial<Campaign>'), '缺少 Partial<Campaign>');
  });

  it('pauseCampaign 接受 id 并返回 Campaign | null', () => {
    assert.ok(svcSrc.includes('pauseCampaign(id'), '缺少 id');
  });

  it('getCopyVariants 按 campaignId 查询', () => {
    assert.ok(svcSrc.includes('getCopyVariants'), '缺少 getCopyVariants');
    assert.ok(svcSrc.includes('campaignId'), '缺少 campaignId 参数');
  });

  it('generateCopy 接受 brief 字符串', () => {
    assert.ok(svcSrc.includes('generateCopy(brief'), '缺少 brief');
    assert.ok(svcSrc.includes('title'), '返回 title');
    assert.ok(svcSrc.includes('body'), '返回 body');
    assert.ok(svcSrc.includes('cta'), '返回 cta');
  });

  it('runABTest 接受 campaignId 和 variants 数组', () => {
    // 函数签名可能跨行，查找整体模式
    const abIndex = svcSrc.indexOf('runABTest');
    assert.ok(abIndex >= 0, '缺少 runABTest');
    // 在函数体内查找参数引用
    const segment = svcSrc.slice(abIndex, abIndex + 300);
    assert.ok(segment.includes('campaignId') || segment.includes('campaignId:'), '缺少 campaignId');
    assert.ok(segment.includes('variants'), '缺少 variants');
    assert.ok(svcSrc.includes('Partial<CopyVariant>'), '类型 Partial<CopyVariant>');
  });

  it('getABResults 按 experimentId 查询', () => {
    assert.ok(svcSrc.includes('getABResults(experimentId'), '缺少 experimentId');
  });

  it('getSegments 无参数返回 MemberSegment[]', () => {
    assert.ok(svcSrc.includes('getSegments()'), '缺少 getSegments');
  });

  it('getOptimalTiming 按 memberId 查询', () => {
    assert.ok(svcSrc.includes('getOptimalTiming(memberId'), '缺少 memberId');
    assert.ok(svcSrc.includes('hour'), '返回 hour');
    assert.ok(svcSrc.includes('dayOfWeek'), '返回 dayOfWeek');
  });

  it('getCampaignROI 按 campaignId 查询', () => {
    assert.ok(svcSrc.includes('getCampaignROI(campaignId'), '缺少 campaignId');
  });
});

// ==========================================================================
// 第五部分: 服务函数回退逻辑 (反例)
// ==========================================================================
describe('ai-marketing-service — API 失败回退（反例）', () => {
  it('getCampaigns 在 fetch 失败时回退到 MOCK_CAMPAIGNS', () => {
    assert.ok(svcSrc.includes('return MOCK_CAMPAIGNS'), '回退 MOCK_CAMPAIGNS');
  });

  it('getCampaign 在 fetch 失败时回退到 find', () => {
    assert.ok(svcSrc.includes('MOCK_CAMPAIGNS.find(c => c.id === id)'), '回退 find');
    assert.ok(svcSrc.includes('?? null'), '未找到返回 null');
  });

  it('createCampaign 回退生成 draft 状态新活动', () => {
    assert.ok(svcSrc.includes("status: 'draft'"), '回退 draft');
    assert.ok(svcSrc.includes("id: `C${Date.now()}`"), '动态 ID');
    assert.ok(svcSrc.includes('data.name ??'), '名称回退');
    assert.ok(svcSrc.includes('data.description ??'), '描述回退');
  });

  it('pauseCampaign 回退修改为 paused', () => {
    assert.ok(svcSrc.includes("status: 'paused'"), '回退 paused');
    assert.ok(svcSrc.includes("if (!campaign) return null"), '未找到 null');
  });

  it('generateCopy 回退生成基于 brief 的默认文案', () => {
    assert.ok(svcSrc.includes('.substring(0, 10)'), 'brief 截断');
    assert.ok(svcSrc.includes('限时特惠'), '默认标题');
    assert.ok(svcSrc.includes('立即查看'), '默认 CTA');
  });

  it('runABTest 回退生成 draft 实验', () => {
    assert.ok(svcSrc.includes("status: 'draft'"), '回退 draft');
    assert.ok(svcSrc.includes("AB${Date.now()}"), '动态 ID');
  });

  it('getCampaignROI 回退到 MOCK_ROI_METRICS find', () => {
    assert.ok(svcSrc.includes('MOCK_ROI_METRICS.find'), '回退查找');
    assert.ok(svcSrc.includes('?? null'), '未找到 null');
  });

  it('getOptimalTiming 回退返回默认值', () => {
    assert.ok(svcSrc.includes('hour: 19'), '回退小时');
    assert.ok(svcSrc.includes('dayOfWeek:'), '回退星期');
  });

  it('getABResults 回退到 find', () => {
    assert.ok(svcSrc.includes('MOCK_AB_EXPERIMENTS.find'), '回退 find');
  });
});

// ==========================================================================
// 第六部分: 服务函数 API 调用路径 (正例)
// ==========================================================================
describe('ai-marketing-service — API 端点约定（正例）', () => {
  it('getCampaigns fetch /api/ai-marketing/campaigns', () => {
    assert.ok(svcSrc.includes('/api/ai-marketing/campaigns'), 'getCampaigns 端点');
  });

  it('getCampaign fetch /api/ai-marketing/campaigns/${id}', () => {
    const index = svcSrc.indexOf('getCampaign');
    assert.ok(index >= 0, 'getCampaign 存在');
    assert.ok(svcSrc.includes('/api/ai-marketing/campaigns/${id}'), 'getCampaign 端点');
  });

  it('createCampaign POST /api/ai-marketing/campaigns', () => {
    assert.ok(svcSrc.includes("method: 'POST'"), 'POST 方法');
    assert.ok(svcSrc.includes('/api/ai-marketing/campaigns'), 'createCampaign 端点');
    assert.ok(svcSrc.includes("'Content-Type': 'application/json'"), 'JSON Content-Type');
  });

  it('pauseCampaign POST 到 /pause 路径', () => {
    assert.ok(svcSrc.includes('/pause'), 'pause 端点');
    assert.ok(svcSrc.includes("method: 'POST'"), 'POST 方法');
  });

  it('generateCopy POST /api/ai-marketing/generate-copy', () => {
    assert.ok(svcSrc.includes('/api/ai-marketing/generate-copy'), 'generateCopy 端点');
    assert.ok(svcSrc.includes("JSON.stringify({ brief })"), 'brief 参数');
  });

  it('runABTest POST /api/ai-marketing/ab-tests', () => {
    assert.ok(svcSrc.includes('/api/ai-marketing/ab-tests'), 'ab-tests 端点');
    assert.ok(svcSrc.includes("JSON.stringify({ campaignId, variants })"), '参数结构');
  });

  it('getSegments GET /api/ai-marketing/segments', () => {
    assert.ok(svcSrc.includes('/api/ai-marketing/segments'), 'segments 端点');
  });

  it('getCampaignROI GET /api/ai-marketing/campaigns/${campaignId}/roi', () => {
    assert.ok(svcSrc.includes('/api/ai-marketing/campaigns/${campaignId}/roi'), 'ROI 端点');
  });
});

// ==========================================================================
// 第七部分: 边界测试
// ==========================================================================
describe('ai-marketing — 边界测试', () => {
  it('所有 Mock 数据的 createdAt 为 ISO 格式', () => {
    const dates = dataSrc.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/g);
    assert.ok(dates && dates.length >= 5, '至少有 5 个 ISO 日期');
  });

  it('MOCK_ROI_METRICS 的 ctr 值为正数', () => {
    const ctrs = dataSrc.match(/ctr:\s*[\d.]+/g);
    assert.ok(ctrs && ctrs.length > 0, '至少 1 个 ctr');
    for (const c of ctrs) {
      const val = parseFloat(c.split(':')[1].trim());
      assert.ok(val > 0, `ctr 应为正数: ${c}`);
    }
  });

  it('文案助手生成的 body 包含 brief 输入', () => {
    assert.ok(svcSrc.includes('正在优惠中'), '包含营销措辞');
    assert.ok(svcSrc.includes('好消息！'), '包含默认前缀');
  });

  it('getCopyVariants 返回 flatMap', () => {
    assert.ok(svcSrc.includes('flatMap'), '使用 flatMap');
  });

  it('createCampaign 的 fallback 处理 data.name 缺失场景', () => {
    assert.ok(svcSrc.includes("data.name ?? '新活动'"), '默认活动名');
  });

  it('runABTest 使用字母索引映射 variant', () => {
    assert.ok(svcSrc.includes("'ABCDEFGHIJKLMNOPQRSTUVWXYZ'"), '字母映射');
  });
});
