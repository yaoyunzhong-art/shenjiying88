# V23 PRD: 架构底座 (Architecture Base)

> 范围: BS-0001 ~ BS-0020 (Sprint-0)  
> 来源: `docs/knowledge/2026-07-23-6-8-development-master-backlog-v2.md` §4 WP-00  
> 日期: 2026-07-23  
> 状态: ✅ 验收完成

---

## 1. 产品概述

### 1.1 解决的问题

1. **三环境混杂风险**: dev / staging / prod 在变量、端口、ssl 上尚未完全分离
2. **备份缺失**: 除 Time Machine 快照外无自动化 DB 备份恢复脚本
3. **边缘/离线能力零散**: 虽有 Edge Module / Offline-Sync / Offline-Queue, 但无统一运营视图
4. **底座可观测性**: 缺少单页汇总 R11 硬约束偏离度和环境分离状态

### 1.2 非目标

- ❌ 不涉及 LYT 真实协议联调 (WP-01B)
- ❌ 不涉及多租户数据隔离实现 (WP-02A)
- ❌ 不涉及安全审计阀门 (WP-02B)

---

## 2. 规格

### 2.1 环境分离 (BS-0006)

| 功能 | 规格 | 优先级 |
|:-----|:-----|:------:|
| dev 环境就绪 | Docker Compose + .env.docker (已存在) | P0 |
| staging 环境就绪 | Docker Compose + .env.staging.example + 独立端口偏移 | P0 |
| prod 环境独立 Compose | 待建 (当前复用 dev) | P0 |
| 环境状态文档 | 产出缺失项 Matrix 和推荐下一步 | P0 |

### 2.2 备份机制 (BS-0009)

| 功能 | 规格 | 优先级 |
|:-----|:-----|:------:|
| pg_dump 全量备份 | 骨架脚本, 支持 .env 加载 | P0 |
| 备份恢复 | 骨架脚本, 交互式确认 + 最新备份自动选择 | P0 |
| 加密选项 | 骨架预留 AES-256 加密参数 | P1 |
| 远端上传 | 骨架预留 S3/OSS 上传参数 | P1 |
| 保留策略 | 骨架实现 N 天自动清理 | P0 |

### 2.3 边缘/离线 (BS-0018~BS-0020)

| 功能 | 规格 | 状态 |
|:-----|:-----|:----:|
| 边缘节点管理 | EdgeNodeService | ✅ 已实现 |
| 离线排队 | OfflineTicketService | ✅ 已实现 |
| 时间同步 | TimeSyncService | ✅ 已实现 |
| 边缘 AI 推理 | EdgeInferenceService | ✅ 已实现 |
| 离线收银同步 | OfflineSyncService + IdempotencyChecker + ConflictResolver | ✅ 已实现 |
| Mobile 离线队列 | OfflineQueue (FIFO + Dead-Letter) | ✅ 已实现 |
| CRDT 数据合并 | ConflictResolver | ✅ 已实现 |

---

## 3. 关键文档

| 文档 | 路径 |
|:-----|:-----|
| 架构硬约束 | `docs/operations/r11-architecture-hard-constraints.md` |
| 环境分离说明 | `docs/operations/environment-separation.md` |
| 部署指南 (运维) | `docs/operations/deployment-guide.md` |
| 部署指南 (生产) | `docs/production-deployment-guide.md` |
| 生产就绪报告 | `docs/production-deployment-readiness-report.md` |
| 灰度发布计划 | `infra/canary-deployment-plan.md` |
| WP-00 验收卡 | `docs/knowledge/acceptance/2026-07-23-wp-00-acceptance.md` |

---

## 4. 验收标准

| 验收项 | 结果 |
|:-------|:----:|
| 环境分离文档存在, 说明三环境当前状态 | ✅ |
| 备份脚本骨架存在 (不要求实际可运行) | ✅ |
| Acceptance card 覆盖当前底座审计结果 | ✅ |
| PRD 摘要卡存在 | ✅ |
| 工作区干净 | 待 commit 后确认 |
