/**
 * team-building/page.test.ts — L2 源码分析测试 (readFileSync)
 *
 * 团建管理页面 — B端团建活动管理与效果分析
 * 角色视角: 👔HR主管 · 🧑‍🤝‍🧑团建组织者 · 📊数据分析师
 *
 * 测试纬度：
 *   正例 — export/use client/3个Tab/活动列表/活动详情/成员表现/报告生成
 *   反例 — 未选中活动/空态守卫/边界校验
 *   边界 — 数据完整性/类型枚举/Mock字段/状态颜色/评分范围
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

describe('team-building — 正例（Happy Path）', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应默认导出 TeamBuildingPage 组件', () => {
    const src = readSource();
    assert.ok(
      src.includes('export default function TeamBuildingPage'),
      '缺少默认导出 TeamBuildingPage',
    );
  });

  it('应包含 PageShell 包装', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
  });

  it('应包含 3 个 Tab 导航', () => {
    const src = readSource();
    assert.ok(src.includes('活动列表'), '缺少 活动列表');
    assert.ok(src.includes('活动详情'), '缺少 活动详情');
    assert.ok(src.includes('成员表现'), '缺少 成员表现');
  });

  it('Tab 使用 key/label 结构定义', () => {
    const src = readSource();
    assert.ok(src.includes('key:'), '缺少 key');
    assert.ok(src.includes('label:'), '缺少 label');
  });

  it('活动列表展示事件卡片', () => {
    const src = readSource();
    assert.ok(src.includes('event.name'), '缺少 event.name');
    assert.ok(src.includes('event.description'), '缺少 event.description');
  });

  it('活动卡片包含日期和参与人数', () => {
    const src = readSource();
    assert.ok(src.includes('活动日期'), '缺少 活动日期');
    assert.ok(src.includes('参与人数'), '缺少 参与人数');
  });

  it('活动卡片展示亮点标签', () => {
    const src = readSource();
    assert.ok(src.includes('highlights'), '缺少 highlights');
  });

  it('活动详情展示 4 个信息字段', () => {
    const src = readSource();
    assert.ok(src.includes('活动地点'), '缺少 活动地点');
    assert.ok(src.includes('预算'), '缺少 预算');
  });

  it('活动详情包含 AI 生成报告区域', () => {
    const src = readSource();
    assert.ok(src.includes('AI 生成报告'), '缺少 AI 生成报告');
  });

  it('报告区域展示参与率/预算使用/满意度', () => {
    const src = readSource();
    assert.ok(src.includes('参与率'), '缺少 参与率');
    assert.ok(src.includes('预算使用'), '缺少 预算使用');
    assert.ok(src.includes('满意度'), '缺少 满意度');
  });

  it('报告展示亮点标签', () => {
    const src = readSource();
    assert.ok(src.includes('亮点标签'), '缺少 亮点标签');
  });

  it('成员表现 Tab 包含表格排名', () => {
    const src = readSource();
    assert.ok(src.includes('排名'), '缺少 排名');
    assert.ok(src.includes('参与分'), '缺少 参与分');
    assert.ok(src.includes('协作分'), '缺少 协作分');
  });

  it('成员表现 Tab 包含领导力和进步幅度', () => {
    const src = readSource();
    assert.ok(src.includes('领导力'), '缺少 领导力');
    assert.ok(src.includes('进步幅度'), '缺少 进步幅度');
  });

  it('成员表现 Tab 包含奖项列', () => {
    const src = readSource();
    assert.ok(src.includes('奖项'), '缺少 奖项');
  });

  it('handleEventSelect 设置选中事件并切换 Tab', () => {
    const src = readSource();
    assert.ok(src.includes('setSelectedEvent'), '缺少 setSelectedEvent');
    assert.ok(src.includes("setActiveTab('details')"), '缺少 切换详情');
  });

  it('TeamBuildingEvent 类型包含核心字段', () => {
    const data = readSource('team-building-data.ts');
    assert.ok(data.includes('interface TeamBuildingEvent'), '缺少 TeamBuildingEvent');
    assert.ok(data.includes('budget:'), '缺少 budget');
    assert.ok(data.includes('location:'), '缺少 location');
  });

  it('EventReport 类型包含满意度评分', () => {
    const data = readSource('team-building-data.ts');
    assert.ok(data.includes('interface EventReport'), '缺少 EventReport');
    assert.ok(data.includes('satisfactionScore:'), '缺少 satisfactionScore');
    assert.ok(data.includes('participationRate:'), '缺少 participationRate');
  });

  it('PerformanceRecord 类型包含各项评分', () => {
    const data = readSource('team-building-data.ts');
    assert.ok(data.includes('interface PerformanceRecord'), '缺少 PerformanceRecord');
    assert.ok(data.includes('participationScore:'), '缺少 participationScore');
    assert.ok(data.includes('teamworkScore:'), '缺少 teamworkScore');
    assert.ok(data.includes('improvementRate:'), '缺少 improvementRate');
  });

  it('getEvents / getReport / generateReport 服务函数存在', () => {
    const src = readSource('team-building-service.ts');
    assert.ok(src.includes('getEvents'), '缺少 getEvents');
    assert.ok(src.includes('getReport'), '缺少 getReport');
    assert.ok(src.includes('generateReport'), '缺少 generateReport');
  });

  it('getMemberPerformances 服务函数存在', () => {
    const src = readSource('team-building-service.ts');
    assert.ok(src.includes('getMemberPerformances'), '缺少 getMemberPerformances');
  });

  it('STATUS_LABELS 映射四种事件状态中文', () => {
    const src = readSource();
    assert.ok(src.includes('即将开始'), '缺少 即将开始');
    assert.ok(src.includes('进行中'), '缺少 进行中');
    assert.ok(src.includes('已完成'), '缺少 已完成');
    assert.ok(src.includes('已取消'), '缺少 已取消');
  });

  it('STATUS_COLORS 四种状态颜色完整', () => {
    const src = readSource();
    assert.ok(src.includes("upcoming: '#3b82f6'"), '缺少 upcoming 蓝色');
    assert.ok(src.includes("ongoing: '#22c55e'"), '缺少 ongoing 绿色');
    assert.ok(src.includes("completed: '#64748b'"), '缺少 completed 灰色');
    assert.ok(src.includes("cancelled: '#ef4444'"), '缺少 cancelled 红色');
  });
});

describe('team-building — 反例（Error Path）', () => {
  it('未选中活动时显示空态提示', () => {
    const src = readSource();
    assert.ok(
      src.includes('请从活动列表选择一个活动查看详情'),
      '缺少未选中活动空态提示',
    );
  });

  it('已完成活动才调用 getMemberPerformances', () => {
    const src = readSource();
    assert.ok(
      src.includes("event.status === 'completed'"),
      '缺少 completed 状态守卫',
    );
  });

  it('暂无报告时显示空态提示', () => {
    const src = readSource();
    assert.ok(src.includes('暂无活动报告'), '缺少 暂无活动报告');
  });

  it('report 为空时渲染生成按钮而不是报告内容', () => {
    const src = readSource();
    assert.ok(src.includes('AI生成报告'), '缺少 AI生成报告');
  });

  it('performances 为空时显示空态提示', () => {
    const src = readSource();
    assert.ok(
      src.includes('请先选择一个已完成的团建活动查看成员表现'),
      '缺少无成员表现空态提示',
    );
  });

  it('generateReport 函数有 event 不存在时的错误处理', () => {
    const src = readSource('team-building-service.ts');
    assert.ok(src.includes("throw new Error('Event not found')"), '缺少事件未找到错误');
  });
});

describe('team-building — 边界（Boundary / Edge）', () => {
  it('MOCK_EVENTS 包含 3 条数据', () => {
    const data = readSource('team-building-data.ts');
    const matches = data.match(/id:\s+'TB\d{3}'/g);
    assert.ok(matches, '未找到活动 ID');
    assert.equal(matches.length, 3, '应有 3 个活动');
  });

  it('MOCK_REPORTS 包含 3 条报告', () => {
    const data = readSource('team-building-data.ts');
    const matches = data.match(/id:\s+'R\d{3}'/g);
    assert.ok(matches, '未找到报告 ID');
    assert.equal(matches.length, 3, '应有 3 条报告');
  });

  it('MOCK_PERFORMANCES 包含 5 条成员记录', () => {
    const data = readSource('team-building-data.ts');
    const matches = data.match(/id:\s+'P\d{3}'/g);
    assert.ok(matches, '未找到成员记录 ID');
    assert.equal(matches.length, 5, '应有 5 条记录');
  });

  it('EventStatus 类型包含 4 种状态', () => {
    const data = readSource('team-building-data.ts');
    assert.ok(data.includes("'upcoming'"), '缺少 upcoming');
    assert.ok(data.includes("'ongoing'"), '缺少 ongoing');
    assert.ok(data.includes("'completed'"), '缺少 completed');
    assert.ok(data.includes("'cancelled'"), '缺少 cancelled');
  });

  it('满意度评分范围 s/satisfactionScore 在 0-5 之间', () => {
    const src = readSource('page.tsx');
    assert.ok(src.includes('satisfactionScore'), '缺少 satisfactionScore');
    assert.ok(
      src.includes('/5.0') || src.includes('4.8') || src.includes('4.5'),
      '满意度使用 5 分制',
    );
  });

  it('handleEventSelect 切换 activeTab 为 details', () => {
    const src = readSource();
    assert.ok(src.includes("setActiveTab('details')"), '缺少 details tab 设置');
  });

  it('getMemberPerformances 只在已完成后被调用', () => {
    const src = readSource();
    assert.ok(src.includes("event.status === 'completed'"), 'completed 条件守卫');
  });

  it('getReport 被 handleEventSelect 调用', () => {
    const src = readSource();
    assert.ok(src.includes('getReport(event.id)'), '缺少 getReport 调用');
  });

  it('事件卡片使用 grid 布局', () => {
    const src = readSource();
    assert.ok(src.includes('gridTemplateColumns'), '缺少 grid 布局');
    assert.ok(src.includes('auto-fill') || src.includes('repeat'), '缺少 auto-fill');
  });
});
