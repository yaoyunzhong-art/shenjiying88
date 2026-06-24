/**
 * 🐜 自动: [svip] E2E 基础测试
 *
 * E2E 链路: HTTP → SvipController → SvipService → Tier/Member/Benefit
 *
 * 覆盖:
 *   - Tier 初始化 + 列表 + upsert
 *   - Member 创建/获取/列表 + 状态机 (Active ↔ Frozen)
 *   - 等级升级 (upgradeTier) + 降级 (downgradeTier)
 *   - Benefit 创建/列表 + useBenefit
 *   - 到期降级 (checkAndDowngradeExpired)
 *   - 自动升级 (checkAndAutoUpgrade, 联动 loyalty)
 *   - 跨租户隔离
 *   - 错误处理
 */
import 'reflect-metadata';
//# sourceMappingURL=svip.e2e.test.d.ts.map