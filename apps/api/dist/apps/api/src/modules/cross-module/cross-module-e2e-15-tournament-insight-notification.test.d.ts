/**
 * E2E 跨模块 #15 — 赛事管理 → AI 经营洞察 → 通知派发 联动
 *
 * 链路:
 *   HTTP → TestController
 *     → TournamentService.createTournament → updateTournamentStatus
 *     → TournamentService.registerParticipant → generateBracket → recordMatchResult
 *     → AiInsightService.generateReport / detectAnomaly
 *     → NotificationService.registerTemplate → send → getDispatch
 *
 * 验证:
 *   - 赛事完整生命周期: Draft → Open → Ongoing → Completed
 *   - 参与者注册 → bracket 生成 → 比赛完成
 *   - AI Insight 洞察分析
 *   - 通知模板注册 + 派发
 *   - 失败通知 → retry
 *   - 跨租户隔离
 */
import 'reflect-metadata';
//# sourceMappingURL=cross-module-e2e-15-tournament-insight-notification.test.d.ts.map