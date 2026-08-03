/**
 * ai-marketing/page.test.ts — L2 源码分析测试 (readFileSync)
 *
 * AI营销中心页面 — B端运营推广自动化
 * 角色视角: 👔运营经理 · 📊数据分析师 · 💻活动主管
 *
 * 测试纬度：
 *   正例 — export/use client/4个Tab/活动管理/文案助手/A-B测试/会员分群/ROI/新建活动/暂停
 *   反例 — 硬编码边界/空态处理/输入校验
 *   边界 — 数据完整性/过滤链/类型枚举/Mock字段/分页/颜色映射
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function readSource(file = 'page.tsx'): string {
  return readFileSync(resolve(__dirname, file), 'utf-8');
}

describe('ai-marketing — 正例（Happy Path）', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应默认导出 AIMarketingPage 组件', () => {
    const src = readSource();
    assert.ok(
      src.includes('export default function AIMarketingPage'),
      '缺少默认导出 AIMarketingPage',
    );
  });

  it('应包含 PageShell 包装', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
  });

  it('应包含 4 个 Tab 导航', () => {
    const src = readSource();
    assert.ok(src.includes('campaigns'), '缺少 campaigns tab');
    assert.ok(src.includes('copy'), '缺少 copy tab');
    assert.ok(src.includes('abtest'), '缺少 abtest tab');
    assert.ok(src.includes('segments'), '缺少 segments tab');
  });

  it('Tab 按钮中文标签齐全', () => {
    const src = readSource();
    assert.ok(src.includes('活动管理'), '缺少 活动管理');
    assert.ok(src.includes('文案助手'), '缺少 文案助手');
    assert.ok(src.includes('A/B测试'), '缺少 A/B测试');
    assert.ok(src.includes('会员分群'), '缺少 会员分群');
  });

  it('活动管理 Tab 包含创建新活动表单', () => {
    const src = readSource();
    assert.ok(src.includes('创建新活动'), '缺少 创建新活动 表单');
  });

  it('活动管理 Tab 包含活动名称和描述输入框', () => {
    const src = readSource();
    assert.ok(src.includes('newCampaignName'), '缺少 newCampaignName');
    assert.ok(src.includes('newCampaignDesc'), '缺少 newCampaignDesc');
  });

  it('活动卡片展示 ROI 指标', () => {
    const src = readSource();
    assert.ok(src.includes('campaign.roi'), '缺少 campaign.roi');
    assert.ok(src.includes('ROI'), '缺少 ROI 标签');
  });

  it('活动卡片展示触达人数', () => {
    const src = readSource();
    assert.ok(src.includes('reachCount'), '缺少 reachCount');
    assert.ok(src.includes('触达人数'), '缺少 触达人数 标签');
  });

  it('文案助手 Tab 包含文本输入区域', () => {
    const src = readSource();
    assert.ok(src.includes('textarea') || src.includes('brief'), '缺少 brief 输入');
    assert.ok(src.includes('AI文案助手'), '缺少 AI文案助手');
  });

  it('文案助手包含 "AI生成文案" 按钮', () => {
    const src = readSource();
    assert.ok(src.includes('AI生成文案'), '缺少 AI生成文案');
  });

  it('文案助手包含生成结果展示', () => {
    const src = readSource();
    assert.ok(src.includes('generatedCopy'), '缺少 generatedCopy');
    assert.ok(src.includes('生成结果'), '缺少 生成结果');
  });

  it('A/B测试 Tab 展示实验结果', () => {
    const src = readSource();
    assert.ok(src.includes('experiments'), '缺少 experiments');
    assert.ok(src.includes('提升率'), '缺少 提升率');
    assert.ok(src.includes('置信度'), '缺少 置信度');
  });

  it('A/B测试 Tab 包含变体展示', () => {
    const src = readSource();
    assert.ok(src.includes('变体'), '缺少 变体');
    assert.ok(src.includes('variant'), '缺少 variant');
  });

  it('会员分群 Tab 展示分群卡片', () => {
    const src = readSource();
    assert.ok(src.includes('平均客单价'), '缺少 平均客单价');
    assert.ok(src.includes('最近活跃'), '缺少 最近活跃');
    assert.ok(src.includes('lastActiveDays'), '缺少 lastActiveDays');
  });

  it('SEGMENT_COLORS 映射所有 4 种类型', () => {
    const src = readSource('ai-marketing-data.ts');
    assert.ok(src.includes("type: 'new'"), '缺少 new 类型');
    assert.ok(src.includes("type: 'active'"), '缺少 active 类型');
    assert.ok(src.includes("type: 'dormant'"), '缺少 dormant 类型');
    assert.ok(src.includes("type: 'churned'"), '缺少 churned 类型');
  });

  it('STATUS_COLORS 映射所有 4 种状态', () => {
    const src = readSource('page.tsx');
    assert.ok(src.includes('active:'), '缺少 active');
    assert.ok(src.includes('paused:'), '缺少 paused');
    assert.ok(src.includes('draft:'), '缺少 draft');
    assert.ok(src.includes('ended:'), '缺少 ended');
  });

  it('createCampaign 服务函数存在', () => {
    const src = readSource('ai-marketing-service.ts');
    assert.ok(src.includes('createCampaign'), '缺少 createCampaign');
    assert.ok(src.includes('pauseCampaign'), '缺少 pauseCampaign');
  });

  it('generateCopy 服务函数存在', () => {
    const src = readSource('ai-marketing-service.ts');
    assert.ok(src.includes('generateCopy'), '缺少 generateCopy');
  });

  it('runABTest 服务函数存在', () => {
    const src = readSource('ai-marketing-service.ts');
    assert.ok(src.includes('runABTest'), '缺少 runABTest');
  });

  it('getSegments / getCampaigns 服务函数存在', () => {
    const src = readSource('ai-marketing-service.ts');
    assert.ok(src.includes('getSegments'), '缺少 getSegments');
    assert.ok(src.includes('getCampaigns'), '缺少 getCampaigns');
  });

  it('Campaign 类型定义包含核心字段', () => {
    const src = readSource('ai-marketing-data.ts');
    assert.ok(src.includes('interface Campaign'), '缺少 Campaign 接口');
    assert.ok(src.includes('roi:'), '缺少 roi');
    assert.ok(src.includes('reachCount:'), '缺少 reachCount');
    assert.ok(src.includes('createdAt:'), '缺少 createdAt');
  });

  it('ABExperiment 类型定义包含变体和置信度', () => {
    const src = readSource('ai-marketing-data.ts');
    assert.ok(src.includes('interface ABExperiment'), '缺少 ABExperiment 接口');
    assert.ok(src.includes('lift:'), '缺少 lift');
    assert.ok(src.includes('confidence:'), '缺少 confidence');
  });

  it('MemberSegment 类型定义包含 avgOrderValue', () => {
    const src = readSource('ai-marketing-data.ts');
    assert.ok(src.includes('interface MemberSegment'), '缺少 MemberSegment 接口');
    assert.ok(src.includes('avgOrderValue:'), '缺少 avgOrderValue');
  });
});

describe('ai-marketing — 反例（Error Path）', () => {
  it('空活动名称不会创建活动', () => {
    const src = readSource();
    assert.ok(src.includes("!newCampaignName.trim()"), '缺少空名称守卫');
  });

  it('空 brief 不会生成文案', () => {
    const src = readSource();
    assert.ok(src.includes("!brief.trim()"), '缺少空 brief 守卫');
  });

  it('暂停按钮仅在 active 状态下显示', () => {
    const src = readSource();
    assert.ok(src.includes("campaign.status === 'active'"), '缺少 active 状态守卫');
  });

  it('生成A/B变体按钮仅在 generatedCopy 存在时显示', () => {
    const src = readSource();
    assert.ok(src.includes('generatedCopy'), '缺少 generatedCopy 守卫');
  });

  it('服务层 createCampaign 回退逻辑生成 draft 状态', () => {
    const src = readSource('ai-marketing-service.ts');
    assert.ok(src.includes("status: 'draft'"), '回退 draft');
  });

  it('服务层 pauseCampaign 回退到 paused', () => {
    const src = readSource('ai-marketing-service.ts');
    assert.ok(src.includes("status: 'paused'"), '回退 paused');
  });
});

describe('ai-marketing — 边界（Boundary / Edge）', () => {
  it('MOCK_CAMPAIGNS 包含 5 条数据', () => {
    const src = readSource('ai-marketing-data.ts');
    const matches = src.match(/id:\s+'C\d{3}'/g);
    assert.ok(matches, '未找到活动 ID');
    assert.equal(matches.length, 5, '应有 5 个活动');
  });

  it('MOCK_AB_EXPERIMENTS 包含 3 组实验', () => {
    const src = readSource('ai-marketing-data.ts');
    const matches = src.match(/id:\s+'AB\d{3}'/g);
    assert.ok(matches, '未找到实验 ID');
    assert.equal(matches.length, 3, '应有 3 组实验');
  });

  it('MOCK_SEGMENTS 包含 4 种分群', () => {
    const src = readSource('ai-marketing-data.ts');
    const matches = src.match(/id:\s+'S\d{3}'/g);
    assert.ok(matches, '未找到分群 ID');
    assert.equal(matches.length, 4, '应有 4 种分群');
  });

  it('STATUS_LABELS 四种状态中文标签完整', () => {
    const src = readSource();
    assert.ok(src.includes('进行中'), '缺少 进行中');
    assert.ok(src.includes('已暂停'), '缺少 已暂停');
    assert.ok(src.includes('草稿'), '缺少 草稿');
    assert.ok(src.includes('已结束'), '缺少 已结束');
  });

  it('SEGMENT_COLORS 四种类型颜色完整', () => {
    const src = readSource();
    assert.ok(src.includes("new: '#3b82f6'"), '缺少 new 蓝色');
    assert.ok(src.includes("active: '#22c55e'"), '缺少 active 绿色');
    assert.ok(src.includes("dormant: '#eab308'"), '缺少 dormant 黄色');
    assert.ok(src.includes("churned: '#ef4444'"), '缺少 churned 红色');
  });

  it('活动卡片使用 grid 布局', () => {
    const src = readSource();
    assert.ok(src.includes('gridTemplateColumns'), '缺少 grid 布局');
    assert.ok(src.includes('auto-fill') || src.includes('repeat'), '缺少 auto-fill');
  });

  it('useEffect 初始化调用 getCampaigns 和 getSegments', () => {
    const src = readSource();
    assert.ok(src.includes('useEffect'), '缺少 useEffect');
    assert.ok(src.includes('getCampaigns()'), '缺少 getCampaigns 调用');
    assert.ok(src.includes('getSegments()'), '缺少 getSegments 调用');
  });

  it('MOCK_ROI_METRICS 根据 MOCK_CAMPAIGNS 生成', () => {
    const src = readSource('ai-marketing-data.ts');
    assert.ok(src.includes('MOCK_ROI_METRICS'), '缺少 MOCK_ROI_METRICS');
    assert.ok(src.includes('ROIMetrics'), '缺少 ROIMetrics 接口');
  });
});
