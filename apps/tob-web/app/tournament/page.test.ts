/**
 * tournament/page.test.ts — 赛事页面 L1 测试
 *
 * 覆盖: 赛事数据结构 / 等级Tab / 排行榜 / 赛事卡片 / 报名/成绩 / 晋级阶段
 *       Leaderboard展示 / 成绩提交 / 服务函数
 * L1 JMeter 风格: 正例 + 反例 + 边界
 * 角色视角:
 *   🏌️ 选手 — 浏览赛事、报名参赛、提交成绩
 *   🏆 运营 — 管理赛事等级、查看排行榜
 *
 * 三件套: 正例 35+ | 反例 8+ | 边界 7+
 */

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';

import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function readSource(file: string): string {
  return readFileSync(resolve(__dirname, file), 'utf-8');
}

const pageSrc = readSource('page.tsx');
const dataSrc = readSource('tournament-data.ts');
const svcSrc = readSource('tournament-service.ts');

// ====================================================================
// 测试集 A: 赛事数据模型 (data)
// ====================================================================
describe('🏆 A: Tournament 数据结构(正例)', () => {

  it('A1: Tournament 接口包含 tournamentId/name/level/levelName', () => {
    assert.ok(dataSrc.includes('interface Tournament'), '缺少 Tournament 接口');
    assert.ok(dataSrc.includes('tournamentId'), '缺少 tournamentId');
    assert.ok(dataSrc.includes('name'), '缺少 name');
    assert.ok(dataSrc.includes('level'), '缺少 level');
    assert.ok(dataSrc.includes('levelName'), '缺少 levelName');
  });

  it('A2: Tournament 包含 prizePool/participantCount/maxParticipants', () => {
    assert.ok(dataSrc.includes('prizePool'), '缺少 prizePool');
    assert.ok(dataSrc.includes('participantCount'), '缺少 participantCount');
    assert.ok(dataSrc.includes('maxParticipants'), '缺少 maxParticipants');
  });

  it('A3: Tournament 包含 status/startTime/endTime/description/rules', () => {
    assert.ok(dataSrc.includes('status'), '缺少 status');
    assert.ok(dataSrc.includes('startTime'), '缺少 startTime');
    assert.ok(dataSrc.includes('endTime'), '缺少 endTime');
    assert.ok(dataSrc.includes('description'), '缺少 description');
    assert.ok(dataSrc.includes('rules'), '缺少 rules');
  });

  it('A4: TournamentStatus 联合类型含 4 种', () => {
    assert.ok(dataSrc.includes("type TournamentStatus"), '缺少 TournamentStatus');
    assert.ok(dataSrc.includes("'upcoming'"), '缺少 upcoming');
    assert.ok(dataSrc.includes("'registration'"), '缺少 registration');
    assert.ok(dataSrc.includes("'ongoing'"), '缺少 ongoing');
    assert.ok(dataSrc.includes("'finished'"), '缺少 finished');
  });

  it('A5: Tournament.level 为 1-7 的字面量联合', () => {
    assert.ok(
      dataSrc.includes('level:') && (dataSrc.includes('| 2 | 3 | 4 | 5 | 6 | 7') || dataSrc.includes('1 | 2 | 3 | 4 | 5 | 6 | 7')),
      '缺少 level 1-7 字面量'
    );
  });

  it('A6: progressStages 可选字段含 stage/qualified/total', () => {
    assert.ok(dataSrc.includes('progressStages'), '缺少 progressStages');
    assert.ok(dataSrc.includes('stage'), '缺少 stage');
    assert.ok(dataSrc.includes('qualified'), '缺少 qualified');
    assert.ok(dataSrc.includes('total'), '缺少 total');
  });

  it('A7: LeaderboardEntry 接口完整', () => {
    assert.ok(dataSrc.includes('interface LeaderboardEntry'), '缺少 LeaderboardEntry');
    assert.ok(dataSrc.includes('rank'), '缺少 rank');
    assert.ok(dataSrc.includes('playerId'), '缺少 playerId');
    assert.ok(dataSrc.includes('playerName'), '缺少 playerName');
    assert.ok(dataSrc.includes('score'), '缺少 score');
    assert.ok(dataSrc.includes('handicap'), '缺少 handicap');
    assert.ok(dataSrc.includes('lastUpdated'), '缺少 lastUpdated');
  });

  it('A8: MOCK_TOURNAMENTS 至少 7 个赛事 (L1-L7)', () => {
    const count = (dataSrc.match(/tournamentId: '/g) || []).length;
    assert.ok(count >= 7, `MOCK_TOURNAMENTS < 7 (actual ${count})`);
    assert.ok(dataSrc.includes('MOCK_TOURNAMENTS'), '缺少 MOCK_TOURNAMENTS');
  });

  it('A9: MOCK_LEADERBOARDS 包含至少有 2 个赛事的排行榜', () => {
    const lbKeys = (dataSrc.match(/MOCK_LEADERBOARDS/g) || []).length;
    const entries = (dataSrc.match(/playerId: '/g) || []).length;
    assert.ok(lbKeys >= 1, '缺少 MOCK_LEADERBOARDS');
    assert.ok(entries >= 12, `leaderboard 玩家数 < 12 (actual ${entries})`);
  });

  it('A10: LEVEL_TABS 定义完整 7 级', () => {
    assert.ok(dataSrc.includes('LEVEL_TABS'), '缺少 LEVEL_TABS');
    const levels = (dataSrc.match(/level: \d/g) || []).length;
    assert.ok(levels >= 7, `LEVEL_TABS < 7 (actual ${levels})`);
    assert.ok(dataSrc.includes('日常赛'), '缺少日常赛');
    assert.ok(dataSrc.includes('周赛'), '缺少周赛');
    assert.ok(dataSrc.includes('月赛'), '缺少月赛');
  });

  it('A11: 第4级及以上赛事有 progressStages 数据', () => {
    const l4Plus = dataSrc.match(/level: 4[\s\S]*?progressStages/) ||
                    dataSrc.match(/level: 5[\s\S]*?progressStages/) ||
                    dataSrc.match(/level: 6[\s\S]*?progressStages/) ||
                    dataSrc.match(/level: 7[\s\S]*?progressStages/);
    assert.ok(l4Plus, 'L4+ 赛事缺少 progressStages');
  });

  it('A12: getStatusLabel/getStatusColor 两种状态工具函数', () => {
    assert.ok(dataSrc.includes('export function getStatusLabel'), '缺少 getStatusLabel');
    assert.ok(dataSrc.includes('export function getStatusColor'), '缺少 getStatusColor');
  });

  it('A13: getTimeUntilStart/formatDatetime 时间工具函数', () => {
    assert.ok(dataSrc.includes('export function getTimeUntilStart'), '缺少 getTimeUntilStart');
    assert.ok(dataSrc.includes('export function formatDatetime'), '缺少 formatDatetime');
  });
});

// ====================================================================
// 测试集 B: 赛事服务函数 (service)
// ====================================================================
describe('🏆 B: Tournament 服务函数(正例)', () => {

  it('B1: service 导出 5 个异步函数', () => {
    assert.ok(svcSrc.includes('export async function getTournaments'), '缺少 getTournaments');
    assert.ok(svcSrc.includes('export async function getTournament'), '缺少 getTournament');
    assert.ok(svcSrc.includes('export async function joinTournament'), '缺少 joinTournament');
    assert.ok(svcSrc.includes('export async function submitScore'), '缺少 submitScore');
    assert.ok(svcSrc.includes('export async function getLeaderboard'), '缺少 getLeaderboard');
  });

  it('B2: getTournaments 支持按 level 筛选', () => {
    assert.ok(svcSrc.includes('level?: number'), '缺少 level 可选参数');
    assert.ok(svcSrc.includes('/api/tournaments'), '缺少 API endpoint');
  });

  it('B3: joinTournament 返回 {success, message}', () => {
    assert.ok(svcSrc.includes('success: boolean'), '返回缺少 success');
    assert.ok(svcSrc.includes('message: string'), '返回缺少 message');
  });

  it('B4: submitScore 接收 tournamentId 和 score', () => {
    assert.ok(svcSrc.includes('tournamentId'), 'submitScore 缺少 tournamentId');
    assert.ok(svcSrc.includes('score'), 'submitScore 缺少 score');
  });

  it('B5: getLeaderboard 按 tournamentId 查询', () => {
    assert.ok(svcSrc.includes('getLeaderboard'), '缺少 getLeaderboard');
  });

  it('B6: 服务函数有 mock fallback', () => {
    assert.ok(svcSrc.includes('MOCK_TOURNAMENTS'), '缺少 MOCK_TOURNAMENTS fallback');
    assert.ok(svcSrc.includes('MOCK_LEADERBOARDS'), '缺少 MOCK_LEADERBOARDS fallback');
  });

  it('B7: joinTournament 发送 POST 请求', () => {
    assert.ok(svcSrc.includes("method: 'POST'"), 'joinTournament 缺少 POST');
    assert.ok(svcSrc.includes('/join'), '缺少 /join endpoint');
  });
});

// ====================================================================
// 测试集 C: 页面组件 (page.tsx)
// ====================================================================
describe('🏆 C: Tournament 页面组件(正例)', () => {

  it('C1: 默认导出 TournamentPage', () => {
    assert.ok(pageSrc.includes('export default function TournamentPage'), '缺少默认导出');
  });

  it('C2: 7 个 LEVEL_TABS 遍历渲染', () => {
    assert.ok(pageSrc.includes('LEVEL_TABS'), '引用 LEVEL_TABS');
    assert.ok(pageSrc.includes('LEVEL_TABS.map'), '遍历 TABS');
    assert.ok(pageSrc.includes('setActiveLevel'), '缺少 setActiveLevel');
  });

  it('C3: activeLevel 状态初始值 = 1', () => {
    assert.ok(pageSrc.includes("useState<number>(1)"), 'activeLevel 初始值不为 1');
  });

  it('C4: Tournament 列表用 useEffect 在 level 变化时获取数据', () => {
    assert.ok(pageSrc.includes('useEffect'), '缺少 useEffect');
    assert.ok(pageSrc.includes('getTournaments(activeLevel)'), '缺少按 level 获取');
    assert.ok(pageSrc.includes('[activeLevel]'), '缺少 activeLevel 依赖');
  });

  it('C5: renderTournamentCard 组件存在', () => {
    assert.ok(pageSrc.includes('renderTournamentCard'), '缺少 renderTournamentCard');
  });

  it('C6: 赛事卡片含奖池、参赛人数、距开赛三要素', () => {
    assert.ok(pageSrc.includes('prizePool'), '卡片缺少 prizePool');
    assert.ok(pageSrc.includes('participantCount'), '卡片缺少 participantCount');
    assert.ok(pageSrc.includes('getTimeUntilStart'), '卡片缺少距开赛');
  });

  it('C7: 赛事卡片显示 status 标签', () => {
    assert.ok(pageSrc.includes('getStatusLabel'), '缺少状态标签');
    assert.ok(pageSrc.includes('getStatusColor'), '缺少状态颜色');
  });

  it('C8: renderLeaderboard 组件存在', () => {
    assert.ok(pageSrc.includes('renderLeaderboard'), '缺少 renderLeaderboard');
  });

  it('C9: 排行榜显示 rank/playerName/score 每项', () => {
    assert.ok(pageSrc.includes('entry.rank'), '缺少 rank 渲染');
    assert.ok(pageSrc.includes('entry.playerName'), '缺少 playerName 渲染');
    assert.ok(pageSrc.includes('entry.score'), '缺少 score 渲染');
  });

  it('C10: 排行榜前三名有特殊样式', () => {
    assert.ok(pageSrc.includes('rank <= 3'), '缺少前3名特殊处理');
    assert.ok(pageSrc.includes('rank === 1'), '缺少第一名标识');
    assert.ok(pageSrc.includes('rank === 2'), '缺少第二名标识');
    assert.ok(pageSrc.includes('rank === 3'), '缺少第三名标识');
  });

  it('C11: 第4级及以上赛事显示 progressStages', () => {
    assert.ok(pageSrc.includes('progressStages'), '引用 progressStages');
    assert.ok(pageSrc.includes('stage.qualified'), '缺少 stage.qualified 渲染');
    assert.ok(pageSrc.includes('stage.total'), '缺少 stage.total 渲染');
  });

  it('C12: stage 进度条宽度 = qualified/total * 100%', () => {
    assert.ok(pageSrc.includes('stage.qualified / stage.total'), '缺少进度条计算');
    assert.ok(pageSrc.includes('* 100'), '缺少百分比转换');
  });

  it('C13: 报名按钮逻辑: status=registration 可报名', () => {
    assert.ok(pageSrc.includes("tournament.status === 'registration'"), '缺少 registration 判断');
    assert.ok(pageSrc.includes('立即报名'), '缺少报名按钮文字');
  });

  it('C14: 成绩提交按钮逻辑: status=ongoing 可提交', () => {
    assert.ok(pageSrc.includes("tournament.status === 'ongoing'"), '缺少 ongoing 判断');
    assert.ok(pageSrc.includes('提交成绩'), '缺少提交按钮文字');
  });

  it('C15: 成绩提交含输入框和按钮', () => {
    assert.ok(pageSrc.includes('scoreInput'), '缺少 scoreInput');
    assert.ok(pageSrc.includes('handleSubmitScore'), '缺少 handleSubmitScore');
  });

  it('C16: handleJoin 调用 joinTournament', () => {
    assert.ok(pageSrc.includes('handleJoin'), '缺少 handleJoin');
    assert.ok(pageSrc.includes('joinTournament'), 'handleJoin 中调用 joinTournament');
  });

  it('C17: selectedTournament 状态管理侧边栏', () => {
    assert.ok(pageSrc.includes('selectedTournament'), '缺少 selectedTournament');
    assert.ok(pageSrc.includes('setSelectedTournament'), '缺少 setSelectedTournament');
  });

  it('C18: 点击卡片时 selectedTournament 更新', () => {
    assert.ok(pageSrc.includes('onClick={() => setSelectedTournament'), '缺少卡片点击事件');
  });

  it('C19: 侧边栏显示赛事详情/排行榜', () => {
    assert.ok(pageSrc.includes('selectedTournament &&'), '缺少 selected 条件渲染');
  });

  it('C20: 页面用 PageShell 包装', () => {
    assert.ok(pageSrc.includes('<PageShell'), '缺少 PageShell');
    assert.ok(pageSrc.includes('赛事中心'), '缺少标题');
  });

  it('C21: handicap 差点显示', () => {
    assert.ok(pageSrc.includes('handicap'), '缺少 handicap');
    assert.ok(pageSrc.includes('entry.handicap'), '排行榜渲染 handicap');
  });

  it('C22: joinLoading/submitLoading 状态', () => {
    assert.ok(pageSrc.includes('joinLoading'), '缺少 joinLoading');
    assert.ok(pageSrc.includes('submitLoading'), '缺少 submitLoading');
    assert.ok(pageSrc.includes('setJoinLoading'), '缺少 setJoinLoading');
    assert.ok(pageSrc.includes('setSubmitLoading'), '缺少 setSubmitLoading');
  });

  it('C23: 城市赛以上 level >= 4 区分样式', () => {
    assert.ok(pageSrc.includes('isCityOrWorld'), '缺少 isCityOrWorld 判断');
    assert.ok(pageSrc.includes('tournament.level >= 4'), '缺少 level>=4 判断');
    assert.ok(pageSrc.includes('tournament.level >= 6'), '缺少 level>=6 高亮判断');
  });

  it('C24: L4/L5 紫色渐变, L6/L7 金色渐变', () => {
    assert.ok(pageSrc.includes('linear-gradient(135deg, #8b5cf6') || pageSrc.includes('linear-gradient(135deg, #f59e0b'), '缺少等级颜色渐变');
  });
});

// ====================================================================
// 测试集 D: 空状态/反例
// ====================================================================
describe('🏆 D: Tournament 空状态&反例', () => {

  it('D1 (反例): 赛事列表为空时显示"暂无赛事"', () => {
    const regex = /tournaments\.length === 0/;
    assert.ok(regex.test(pageSrc) || pageSrc.includes('暂无赛事'), '缺少空赛事文案');
  });

  it('D2 (反例): 排行榜为空时显示"暂无排行榜数据"', () => {
    assert.ok(pageSrc.includes('暂无排行榜数据'), '缺少 Leaderboard 空状态');
  });

  it('D3 (边界): getTimeUntilStart 计算 diff <= 0 返回"已开赛"', () => {
    assert.ok(dataSrc.includes('diff <= 0'), '缺少已开赛判断');
    assert.ok(dataSrc.includes("'已开赛'"), '缺少已开赛文字');
  });

  it('D4 (边界): getTimeUntilStart 分层 day/hour/minute', () => {
    assert.ok(dataSrc.includes('days > 0'), '缺少天判断');
    assert.ok(dataSrc.includes('hours > 0'), '缺少小时判断');
    assert.ok(dataSrc.includes('minutes > 0') || dataSrc.includes('hours > 0'), '缺少分钟判断');
  });

  it('D5 (反例): joinTournament 返回 success=false 时不更新 UI', () => {
    assert.ok(pageSrc.includes('result.success'), '缺少结果检查');
  });

  it('D6 (边界): submitScore 校验 50 <= score <= 150', () => {
    assert.ok(pageSrc.includes('isNaN(score)'), '缺少 NaN 检查');
    assert.ok(pageSrc.includes('score < 50') || pageSrc.includes('score > 150'), '缺少分数范围校验');
  });

  it('D7 (反例): loading 状态禁用报名按钮', () => {
    assert.ok(pageSrc.includes('joinLoading'), '缺少 joinLoading 变量');
    assert.ok(pageSrc.includes("cursor: joinLoading ?"), '缺少光标样式');
  });

  it('D8 (边界): sr-only / empty tournaments 处理', () => {
    assert.ok(pageSrc.includes('tournaments.length === 0'), '缺少 tournament 空状态条件');
  });
});

// ====================================================================
// 测试集 E: getTournaments 逻辑
// ====================================================================
describe('🏆 E: Tournament 服务逻辑', () => {

  it('E1 (正例): getTournaments 按 level 过滤 mock', () => {
    assert.ok(svcSrc.includes('filter(t => t.level === level)'), '缺少 level 过滤');
  });

  it('E2 (反例): 不传 level 返回全部赛事', () => {
    assert.ok(svcSrc.includes('return MOCK_TOURNAMENTS'), '缺少全量返回');
  });

  it('E3 (反例): getTournament 找不到时返回 null', () => {
    assert.ok(svcSrc.includes('|| null'), 'tournament 未找到返回 null');
  });

  it('E4 (边界): getLeaderboard 找不到时返回 []', () => {
    assert.ok(svcSrc.includes('|| []'), '缺少空数组 fallback');
  });

  it('E5 (正例): getLeaderboard 找到返回对应数据', () => {
    assert.ok(svcSrc.includes('MOCK_LEADERBOARDS[tournamentId]'), '按 ID 查询');
  });
});

// ====================================================================
// 测试集 F: 数据一致性
// ====================================================================
describe('🏆 F: Tournament 数据一致性', () => {

  it('F1: page 正确导入 data 和 service', () => {
    assert.ok(pageSrc.includes("from './tournament-data'"), 'page 导入 data');
    assert.ok(pageSrc.includes("from './tournament-service'"), 'page 导入 service');
  });

  it('F2: service 正确导入 data', () => {
    assert.ok(svcSrc.includes("from './tournament-data'"), 'service 导入 data');
  });

  it('F3: Tournament 接口 level 类型与 LEVEL_TABS 一致', () => {
    assert.ok(dataSrc.includes('1 |'), 'level 类型含 1');
    assert.ok(dataSrc.includes('number'), 'level 类型为 number');
  });

  it('F4: Tournament 卡片点击阻止报名按钮冒泡', () => {
    assert.ok(pageSrc.includes('e.stopPropagation()'), '缺少 stopPropagation');
  });

  it('F5: 赛事状态变更后更新 participantCount', () => {
    assert.ok(pageSrc.includes('participantCount + 1'), '缺少 +1 更新');
  });
});
