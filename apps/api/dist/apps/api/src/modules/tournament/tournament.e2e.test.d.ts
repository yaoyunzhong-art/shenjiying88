/**
 * 🐜 自动: [tournament] E2E 基础测试
 *
 * E2E 链路: HTTP → TournamentController → TournamentService → Tournament/Match/Ranking
 *
 * 覆盖:
 *   - Tournament CRUD: 创建 / 详情 / 列表 / 更新
 *   - 状态机: Draft → Open → Ongoing → Completed
 *   - 个人报名: 注册 / 重复报名 / 满员
 *   - 团队报名: 创建团队 / 审核通过 / 拒绝
 *   - Bracket 生成: 单淘汰 / 循环赛 / 至少 2 人
 *   - 比赛结果: 录入分数 / 自动完成 tournament
 *   - 排名计算
 *   - 跨租户隔离
 *   - 错误处理 (404)
 */
import 'reflect-metadata';
//# sourceMappingURL=tournament.e2e.test.d.ts.map