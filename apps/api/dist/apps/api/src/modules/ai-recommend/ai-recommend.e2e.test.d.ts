/**
 * 🐜 自动: [ai-recommend] E2E 基础测试
 *
 * E2E 链路: HTTP → AiRecommendController → AiRecommendService → Recommendation/Strategy/Profile
 *
 * 覆盖:
 *   - 热门推荐: 列表 + 限制数量
 *   - 个性化推荐: 无画像回退 / 有画像匹配
 *   - 推荐生成: 4 种策略 + 兜底
 *   - 策略管理: CRUD + 启停
 *   - 用户画像: 增改查
 *   - 反馈收集: 评分 / 转化
 *   - 推荐历史查询
 *   - 错误处理 (404 / 业务错误)
 */
import 'reflect-metadata';
//# sourceMappingURL=ai-recommend.e2e.test.d.ts.map