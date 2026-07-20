# V23 审计 · G5 数据组
> 日期: 2026-07-20 · 评审专家: E5赵数据 + E??数据
> 版本: V23 v1.2

## 总体评级
🟢 **通过**

P-31 RLS 多租户隔离已达 Controller+19 model tenantId 全覆盖，知识赋能卡片模块已上线（empower-card 服务 + 7端点 + seed 数据），数据基线和备份有初步设计。整体数据策略满足 V23 轨道B持续交付要求。

---

## 评审意见

### 1️⃣ RLS 多租户隔离——应用层覆盖完整，数据库层仍需推进

P-31 的 RLS 隔离在应用层已完成 Controller+19 model tenantId 全覆盖，TSC 15/15 零错误。Gateway5 事前签署确认 ✅。

**但**：审计结论指出"当前隔离主证据集中在 middleware/util/service/controller/e2e 层，数据库级 Prisma interceptor + RLS 全表自动覆盖仍待完整落地"。V23 Phase 2 (7/27→30) 计划中未明确排入 RLS 全表自动化任务，存在 **半程覆盖** 风险。

**建议**：Phase 2 基建升级期间，将 `Prisma interceptor + RLS 全表自动覆盖` 列入时间预算轨道A。

### 2️⃣ 知识赋能卡片——模块上线但种子数据薄弱

empower-card 模块已创建完整：服务层 (service.test.ts 53 tests)、控制器 (controller.ts 6 REST 路由)、实体 (entity)、module。数据库已创建 empower_card 表 + 索引 + seed数据。知识赋能 API 7端点可用（match/decay/stats）。

**但**：V20 暴露的问题明确记录——"知识API设计好但数据库填充不足（14条初始卡片太少）"。虽然 V23 对策写明"知识种子数据倍增：确保 S1-S6 数据导入+周更新"，但当前 seed 数据是否达到 S1-S6 全覆盖？知识日采 cron 的轨道B时间预算具体是否已排入 11:00-12:00 区块？

**建议**：本周内执行 seed 数据倍增验证跑分，确保至少 100+ 条可用知识卡片（目前 148 条已在知识体系V2上线，但 empower-card API 中的可用种子数据需单独验证）。

### 3️⃣ 数据备份——存在 pg_dump 意识但无 cron 自动化

V23 核心诊断中，"灾备/备份策略"列在轨道A基建攻坚任务下。V23 每日时间预算中 16:00-17:00 区块包含"监控+备份"。但 Phase 0 已完成项清单中**未出现**备份脚本或 pg_dump cron 调度。

**现状**：仓库中存在 `./infra/backup` 目录和 `./infra/k8s/backups`，但无专用的 `pg_dump` cron 脚本。G5 在 V22 晚会签署点评中已提过"数据备份策略提上日程"，V23 应在此硬化。

**建议**：在 Phase 2 基建升级中新增 `scripts/setup-pgdump-cron.sh`，配置每日 03:00（深夜时段）执行全库 pg_dump，保留最近7天轮换。此项应纳入圈梁🔴基建箍的检查项。

---

## 关注点

### 🔴 关注点1: 备份策略——圈梁基建箍缺 pg_dump 检查项
- 当前圈梁7道箍中的 🔴基建箍 检查项包括 CI/Docker/Build，但**不包含数据备份**
- 生产就绪 4/4 维度（CI/Docker/Domain/SSL）仍为 0%——数据备份的优先级应与 Docker 同等
- 建议：基建箍增加"✅ 数据备份 pg_dump cron 已部署"检查项

### 🟡 关注点2: 知识卡片使用率不可见
- 圈梁中 🟠知识赋能 为 P1 建议级，但未定义"使用率"指标
- empower-card API 的 match/decay/stats 端点可用，但缺少运营 dashboard 展示卡片命中率、用户采信率
- 无使用率数据，无法判断"14条→更多种子"是否真正改进了知识消费

### 🟡 关注点3: 数据层 RLS 全表自动覆盖未列入 Phase 计划
- V23 Phase 计划 (Phase 0→1→2→3) 中，Phase 2 的 E2E 链扩展和 real API 接入已排入，但 RLS 全表自动化**不在排期中**
- 如果 Phase 2 结束时仍未落地，V23 版本锁死后 RLS 将长期保持"应用层覆盖+数据库层半程"的状态

---

## 建议

### 建议1: Phase 2 新增 pg_dump cron 任务
```bash
# 创建数据库备份脚本
scripts/setup-pgdump-cron.sh

# cron 条目示例
0 3 * * * pg_dump -U $DB_USER -h $DB_HOST $DB_NAME | gzip > /backups/pg_dump_$(date +\%Y\%m\%d).sql.gz
# 保留最近7天
0 4 * * * find /backups -name "pg_dump_*.sql.gz" -mtime +7 -delete
```
- 排入轨道A: 16:00-17:00 监控+备份时段
- 圈梁基建箍增加备份检查项

### 建议2: 知识卡片种子数据倍增验证 + 使用率仪表盘
- 执行知识种子全覆盖检查：确认 S1-S6 业务领域均有 ≥15 条赋能卡片
- 在 empower-card API 中增加使用率统计端点（每日调用量、匹配成功率、top 卡片）
- 考虑在 E27陈决策的知识仪表盘中集成知识卡片使用看板

### 建议3: 数据库层 RLS 自动化排入 Phase 2
- 将 Prisma interceptor 自动注入 tenantId 列为 Phase 2 必须完成项（V23 圈梁🟡 P1）
- 参考 ADR-046 (empower-card) 的模式，新增 ADR 记录数据库层 RLS 自动化设计

---

> 审计执行: 🐜 树哥 · 2026-07-20 23:10 CST
> 参考文献: V23 roadmap v1.2 · ADR-046 · ADR-001 · gateway5-signoff · p31-tenant-audit
