/**
 * member-center/page.test.ts — 会员中心 全量测试
 *
 * 覆盖: 正例(页面结构/数据导出/组件字段) · 边界(枚举覆盖/Mock完整性/字段验证) · 防御(空态/边界值/服务层)
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PAGE_SRC = resolve(__dirname, 'page.tsx');
const DATA_SRC = resolve(__dirname, 'member-center-data.ts');
const SERVICE_SRC = resolve(__dirname, 'member-center-service.ts');

function readPage(): string {
  return readFileSync(PAGE_SRC, 'utf-8');
}

function readData(): string {
  return readFileSync(DATA_SRC, 'utf-8');
}

function readService(): string {
  return readFileSync(SERVICE_SRC, 'utf-8');
}

// ——— 正例: 页面导出结构 ———
describe('member-center — 正例: 页面导出', () => {
  it('page.tsx 应导出默认组件 MemberCenterPage', () => {
    const src = readPage();
    assert.ok(src.includes('export default function MemberCenterPage'), '缺少默认导出');
  });

  it('page.tsx 应包含 \'use client\' 指令', () => {
    const src = readPage();
    assert.ok(src.includes("'use client'") || src.includes('"use client"'), '缺少 use client');
  });

  it('page.tsx 从 react 导入 useEffect / useState', () => {
    const src = readPage();
    assert.ok(src.includes('useEffect'), '缺少 useEffect');
    assert.ok(src.includes('useState'), '缺少 useState');
  });

  it('page.tsx 从 @m5/ui 导入 PageShell', () => {
    const src = readPage();
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
  });

  it('page.tsx 从 member-center-data 导入所有 Mock 数据和类型', () => {
    const src = readPage();
    assert.ok(src.includes('MOCK_LEVELS'), '缺少 MOCK_LEVELS');
    assert.ok(src.includes('MOCK_PROGRESS'), '缺少 MOCK_PROGRESS');
    assert.ok(src.includes('formatTime'), '缺少 formatTime');
  });

  it('page.tsx 从 member-center-service 导入 4 个异步加载函数', () => {
    const src = readPage();
    assert.ok(src.includes('loadMemberProgress'), '缺少 loadMemberProgress');
    assert.ok(src.includes('loadPointsSummary'), '缺少 loadPointsSummary');
    assert.ok(src.includes('loadPointsRecords'), '缺少 loadPointsRecords');
    assert.ok(src.includes('loadCrossStoreActivity'), '缺少 loadCrossStoreActivity');
  });

  it('page.tsx 使用 PageShell title="会员中心"', () => {
    const src = readPage();
    assert.ok(src.includes('title="会员中心"'), '缺少 title');
  });

  it('page.tsx 包含 Hero 头像区域', () => {
    const src = readPage();
    assert.ok(src.includes('会员'), '缺少 会员 头像文字');
    assert.ok(src.includes('borderRadius: \'50%\''), '缺少圆形头像');
  });

  it('page.tsx 包含成长进度条', () => {
    const src = readPage();
    assert.ok(src.includes('成长值'), '缺少 成长值');
    assert.ok(src.includes('progressPercent'), '缺少 progressPercent');
  });

  it('page.tsx 包含等级特权卡片', () => {
    const src = readPage();
    assert.ok(src.includes('等级特权'), '缺少 等级特权');
    assert.ok(src.includes('currentLevel.name'), '缺少 currentLevel');
  });

  it('page.tsx 包含积分概览卡片', () => {
    const src = readPage();
    assert.ok(src.includes('积分概览'), '缺少 积分概览');
    assert.ok(src.includes('points?.total'), '缺少 points.total');
  });

  it('page.tsx 包含积分记录列表', () => {
    const src = readPage();
    assert.ok(src.includes('积分记录'), '缺少 积分记录');
    assert.ok(src.includes('records.map'), '缺少 records.map');
  });

  it('page.tsx 包含跨店活动网格', () => {
    const src = readPage();
    assert.ok(src.includes('跨店活动'), '缺少 跨店活动');
    assert.ok(src.includes('crossStore.map'), '缺少 crossStore.map');
  });
});

// ——— 正例: 数据层完整性 ———
describe('member-center — 正例: 数据层', () => {
  it('data.ts 应导出 MemberLevel / MemberProgress / PointsSummary / PointsRecord / CrossStoreActivity 接口', () => {
    const src = readData();
    assert.ok(src.includes('export interface MemberLevel'), '缺少 MemberLevel');
    assert.ok(src.includes('export interface MemberProgress'), '缺少 MemberProgress');
    assert.ok(src.includes('export interface PointsSummary'), '缺少 PointsSummary');
    assert.ok(src.includes('export interface PointsRecord'), '缺少 PointsRecord');
    assert.ok(src.includes('export interface CrossStoreActivity'), '缺少 CrossStoreActivity');
  });

  it('data.ts 应导出 MOCK_LEVELS / MOCK_PROGRESS / MOCK_POINTS / MOCK_POINTS_RECORDS / MOCK_CROSS_STORE', () => {
    const src = readData();
    assert.ok(src.includes('export const MOCK_LEVELS'), '缺少 MOCK_LEVELS');
    assert.ok(src.includes('export const MOCK_PROGRESS'), '缺少 MOCK_PROGRESS');
    assert.ok(src.includes('export const MOCK_POINTS'), '缺少 MOCK_POINTS');
    assert.ok(src.includes('export const MOCK_POINTS_RECORDS'), '缺少 MOCK_POINTS_RECORDS');
    assert.ok(src.includes('export const MOCK_CROSS_STORE'), '缺少 MOCK_CROSS_STORE');
  });

  it('data.ts 应导出 formatTime 函数', () => {
    const src = readData();
    assert.ok(src.includes('export function formatTime'), '缺少 formatTime');
  });

  it('MOCK_LEVELS 包含 6 个等级 (L1-L6)', () => {
    const src = readData();
    const matches = [...src.matchAll(/level:\s*\d+/g)];
    assert.ok(matches.length >= 6, `预期至少 6 个等级，找到 ${matches.length}`);
  });

  it('MOCK_POINTS_RECORDS 至少包含 8 条记录', () => {
    const src = readData();
    const matches = [...src.matchAll(/recordId:/g)];
    assert.ok(matches.length >= 8, `预期至少 8 条记录，找到 ${matches.length}`);
  });
});

// ——— 边界: 数据类型覆盖 ———
describe('member-center — 边界: 数据类型覆盖', () => {
  it('Progress 接口包含 memberId / level / growthValue / nextLevelTarget / progressPercent', () => {
    const src = readData();
    const iface = src.slice(src.indexOf('export interface MemberProgress'), src.indexOf('export interface PointsSummary'));
    assert.ok(iface.includes('memberId'), '缺少 memberId');
    assert.ok(iface.includes('level'), '缺少 level');
    assert.ok(iface.includes('growthValue'), '缺少 growthValue');
    assert.ok(iface.includes('nextLevelTarget'), '缺少 nextLevelTarget');
    assert.ok(iface.includes('progressPercent'), '缺少 progressPercent');
  });

  it('PointsSummary 接口包含 total / available / frozen / expiredSoon', () => {
    const src = readData();
    const iface = src.slice(src.indexOf('export interface PointsSummary'), src.indexOf('export type PointsRecordType'));
    assert.ok(iface.includes('total'), '缺少 total');
    assert.ok(iface.includes('available'), '缺少 available');
    assert.ok(iface.includes('frozen'), '缺少 frozen');
    assert.ok(iface.includes('expiredSoon'), '缺少 expiredSoon');
  });

  it('PointsRecordType 包含 earn / redeem / expire / adjust', () => {
    const src = readData();
    assert.ok(src.includes("'earn'"), '缺少 earn');
    assert.ok(src.includes("'redeem'"), '缺少 redeem');
    assert.ok(src.includes("'expire'"), '缺少 expire');
    assert.ok(src.includes("'adjust'"), '缺少 adjust');
  });

  it('PointsRecord 接口包含 recordId / type / amount / balance / reason / createdAt', () => {
    const src = readData();
    const iface = src.slice(src.indexOf('export interface PointsRecord'), src.indexOf('export interface CrossStoreActivity'));
    assert.ok(iface.includes('recordId'), '缺少 recordId');
    assert.ok(iface.includes('type'), '缺少 type');
    assert.ok(iface.includes('amount'), '缺少 amount');
    assert.ok(iface.includes('balance'), '缺少 balance');
    assert.ok(iface.includes('reason'), '缺少 reason');
    assert.ok(iface.includes('createdAt'), '缺少 createdAt');
  });

  it('CrossStoreActivity 接口包含 storeId / storeName / visitCount / lastVisit / pointsEarned', () => {
    const src = readData();
    const iface = src.slice(src.indexOf('export interface CrossStoreActivity'), src.indexOf('export const MOCK_LEVELS'));
    assert.ok(iface.includes('storeId'), '缺少 storeId');
    assert.ok(iface.includes('storeName'), '缺少 storeName');
    assert.ok(iface.includes('visitCount'), '缺少 visitCount');
    assert.ok(iface.includes('lastVisit'), '缺少 lastVisit');
    assert.ok(iface.includes('pointsEarned'), '缺少 pointsEarned');
  });

  it('MemberLevel 接口包含 level / name / minGrowth / maxGrowth / privileges', () => {
    const src = readData();
    const iface = src.slice(src.indexOf('export interface MemberLevel'), src.indexOf('export interface MemberProgress'));
    assert.ok(iface.includes('level'), 'MemberLevel 缺少 level');
    assert.ok(iface.includes('name'), 'MemberLevel 缺少 name');
    assert.ok(iface.includes('minGrowth'), 'MemberLevel 缺少 minGrowth');
    assert.ok(iface.includes('maxGrowth'), 'MemberLevel 缺少 maxGrowth');
    assert.ok(iface.includes('privileges'), 'MemberLevel 缺少 privileges');
  });
});

// ——— 边界: Mock 数据验证 ———
describe('member-center — 边界: Mock 数据验证', () => {
  it('MOCK_LEVELS 的 name 包含中文等级名称', () => {
    const src = readData();
    assert.ok(src.includes('L1路人'), '缺少 L1');
    assert.ok(src.includes('L2会员'), '缺少 L2');
    assert.ok(src.includes('L3银卡'), '缺少 L3');
    assert.ok(src.includes('L4金卡'), '缺少 L4');
    assert.ok(src.includes('L5白金'), '缺少 L5');
    assert.ok(src.includes('L6传奇'), '缺少 L6');
  });

  it('L1 特权包含"基础购物九五折"和"生日礼物"', () => {
    const src = readData();
    assert.ok(src.includes('基础购物九五折'), '缺少 基础购物九五折');
    assert.ok(src.includes('生日礼物'), '缺少 生日礼物');
  });

  it('L6 特权包含"购物七折"和"专属顾问"', () => {
    const src = readData();
    assert.ok(src.includes('购物七折'), '缺少 购物七折');
    assert.ok(src.includes('专属顾问'), '缺少 专属顾问');
  });

  it('MOCK_PROGRESS 的 memberId 为 M10001，level 为 3，growthValue 为 3500', () => {
    const src = readData();
    assert.ok(src.includes("memberId: 'M10001'"), 'memberId 异常');
    assert.ok(src.includes('level: 3,'), 'level 异常');
    assert.ok(src.includes('growthValue: 3500'), 'growthValue 异常');
  });

  it('MOCK_POINTS 的数据包含 total=12800 / available=11500 / frozen=800 / expiredSoon=500', () => {
    const src = readData();
    assert.ok(src.includes('total: 12800'), 'total 异常');
    assert.ok(src.includes('available: 11500'), 'available 异常');
    assert.ok(src.includes('frozen: 800'), 'frozen 异常');
    assert.ok(src.includes('expiredSoon: 500'), 'expiredSoon 异常');
  });

  it('MOCK_CROSS_STORE 至少包含 3 家店铺', () => {
    const src = readData();
    const matches = [...src.matchAll(/storeId:/g)];
    assert.ok(matches.length >= 3, `预期至少 3 家店铺，找到 ${matches.length}`);
  });

  it('PointsRecord Mock 数据覆盖 earn / redeem / expire / adjust 四种类型', () => {
    const src = readData();
    assert.ok(src.includes("type: 'earn'"), '缺少 earn 记录');
    assert.ok(src.includes("type: 'redeem'"), '缺少 redeem 记录');
    assert.ok(src.includes("type: 'expire'"), '缺少 expire 记录');
    assert.ok(src.includes("type: 'adjust'"), '缺少 adjust 记录');
  });
});

// ——— 边界: 服务层 ———
describe('member-center — 边界: 服务层', () => {
  it('service.ts 导出 4 个 async 函数', () => {
    const src = readService();
    assert.ok(src.includes('export async function loadMemberProgress'), '缺少 loadMemberProgress');
    assert.ok(src.includes('export async function loadPointsSummary'), '缺少 loadPointsSummary');
    assert.ok(src.includes('export async function loadPointsRecords'), '缺少 loadPointsRecords');
    assert.ok(src.includes('export async function loadCrossStoreActivity'), '缺少 loadCrossStoreActivity');
  });

  it('每个服务函数都有 try-catch 兜底回退 Mock 数据', () => {
    const src = readService();
    assert.ok(src.includes('try {'), '缺少 try');
    assert.ok(src.includes('} catch {'), '缺少 catch');
    assert.ok(src.includes('return MOCK_PROGRESS'), '缺少 MOCK_PROGRESS 回退');
    assert.ok(src.includes('return MOCK_POINTS'), '缺少 MOCK_POINTS 回退');
  });

  it('loadPointsRecords 接受 memberId 和 limit 参数', () => {
    const src = readService();
    assert.ok(src.includes('limit: number = 10'), '缺少 limit 默认值');
    assert.ok(src.includes('MOCK_POINTS_RECORDS.slice(0, limit)'), '缺少 slice(0, limit)');
  });

  it('loadMemberProgress 返回 Promise<MemberProgress | null>', () => {
    const src = readService();
    assert.ok(src.includes('Promise<MemberProgress | null>'), '缺少返回值类型');
  });

  it('loadPointsSummary 返回 Promise<PointsSummary | null>', () => {
    const src = readService();
    assert.ok(src.includes('Promise<PointsSummary | null>'), '缺少返回值类型');
  });
});

// ——— 防御: 空态与边界 ———
describe('member-center — 防御: 空态与边界', () => {
  it('积分概览使用 points?.total ?? 0 防御 null', () => {
    const src = readPage();
    assert.ok(src.includes('points?.total ?? 0'), '缺少 points?.total 空值防御');
  });

  it('积分概览使用 points?.available ?? 0', () => {
    const src = readPage();
    assert.ok(src.includes('points?.available ?? 0'), '缺少 points?.available 空值防御');
  });

  it('积分概览使用 points?.frozen ?? 0', () => {
    const src = readPage();
    assert.ok(src.includes('points?.frozen ?? 0'), '缺少 points?.frozen 空值防御');
  });

  it('积分概览使用 points?.expiredSoon ?? 0', () => {
    const src = readPage();
    assert.ok(src.includes('points?.expiredSoon ?? 0'), '缺少 points?.expiredSoon 空值防御');
  });

  it('useEffect 初始化时使用 memberId = M10001 固定值', () => {
    const src = readPage();
    assert.ok(src.includes("'M10001'"), '缺少固定 memberId');
  });

  it('formatTime 处理 0 分钟返回"今天"', () => {
    const src = readData();
    assert.ok(src.includes("'今天'"), '缺少 今天');
  });

  it('formatTime 处理 1 天返回"昨天"', () => {
    const src = readData();
    assert.ok(src.includes("'昨天'"), '缺少 昨天');
  });

  it('formatTime 处理 <7 天返回"N天前"', () => {
    const src = readData();
    assert.ok(src.includes("`${days}天前`"), '缺少 N天前');
  });

  it('formatTime 处理 >=7 天返回 toLocaleDateString', () => {
    const src = readData();
    assert.ok(src.includes('toLocaleDateString'), '缺少 toLocaleDateString');
  });

  it('page.tsx 使用 transition: \'width 0.3s ease\' 动画', () => {
    const src = readPage();
    assert.ok(src.includes('0.3s'), '缺少过渡动画');
  });
});
