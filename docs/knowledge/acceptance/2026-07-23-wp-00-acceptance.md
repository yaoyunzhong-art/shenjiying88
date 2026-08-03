# WP-00 架构底座验收卡 (BS-0001~BS-0020)

> 日期: 2026-07-23 (V23 Day3 Sprint-0)  
> 状态: ✅ 扫描完成, 增量补充完成  
> 分支: tree/codeup-acr-ci-20260717  
> 验收人: 树哥 (Trae Agent)  

---

## 1. 底座审计总览

### 1.1 已存在的基础设施

| # | 设施 | 路径 | 覆盖度 |
|:-:|:-----|:-----|:------:|
| 1 | 架构硬约束文档 | `docs/operations/r11-architecture-hard-constraints.md` | ✅ 59条约束, 偏离度47%已记录 |
| 2 | 部署指南 | `docs/operations/deployment-guide.md` / `docs/production-deployment-guide.md` | ✅ 两份 |
| 3 | Docker Compose 三套 | `docker-compose.yml` (dev) + `docker-compose.staging.yml` + `docker-compose.dev.yml` (Qdrant) | ⚠️ prod 缺少独立 compose |
| 4 | 三环境变量模板 | `.env.docker` / `.env.staging.example` / `.env.production.example` | ✅ |
| 5 | K8s 生产 Manifests | `infra/k8s/*-deployment.yaml` | ✅ 7个服务 |
| 6 | Terraform 基础设施 | `infra/terraform/aliyun-prod-*.tf` | ✅ 阿里云 ECS/RDS/Redis/MQ |
| 7 | 边缘计算模块 | `apps/api/src/modules/edge/` | ✅ ~23个文件, 含 AI 推理/离线排队/时间同步 |
| 8 | Cashier 离线同步 | `apps/api/src/modules/cashier/offline-sync.service.ts` | ✅ 幂等性检测, CRDT, 离线队列 |
| 9 | Mobile 离线队列 | `apps/mobile/src/sync/offline-queue.ts` | ✅ 离线写操作队列 (Dead-letter) |
| 10 | 生产就绪报告 | `docs/production-deployment-readiness-report.md` | ✅ V17+V18 两阶段 |
| 11 | 灰度计划 | `infra/canary-deployment-plan.md` | ✅ |

### 1.2 当前发现的问题

| # | 问题 | 严重度 | 关联 BS |
|:-:|:-----|:------:|:-------:|
| 1 | 无独立 prod docker-compose, 依赖 dev template | 🔴 高 | BS-0006 |
| 2 | `.env.staging` / `.env.production` 实际文件不存在 (仅有 example) | 🔴 高 | BS-0006 |
| 3 | 无 backup/restore 自动化脚本 (纯 manual) | 🔴 高 | BS-0009 |
| 4 | 无 staging CI/CD pipeline | 🟡 中 | BS-0007 |
| 5 | 无灾备/冷备验证记录 | 🟡 中 | BS-0009 |
| 6 | 无 ACR regcred 轮换自动化 (已有 check 脚本但无自动轮换) | 🟡 中 | BS-0011 |
| 7 | 无生产环境真实域名 | 🟡 中 | BS-0010 |
| 8 | 边缘 CRDT 实测覆盖率不足 | 🟢 低 | BS-0018 |
| 9 | LYT 真实协议阻塞 (外部 blocker) | 🔴 阻塞 | BS-0021~BS-0029 |

### 1.3 偏离度 (R11 架构硬约束)

参照 `docs/operations/r11-architecture-hard-constraints.md` 偏离度分析:

| 层级 | 约束数 | 已实现 | 部分 | 未 | 偏离度 | 本 WP-00 补充后 |
|:----:|:-----:|:-----:|:----:|:--:|:------:|:--------------:|
| M5母机 | 12 | 6 | 3 | 3 | 32% | 依旧 32% (需各 WP 推进) |
| LYT适配 | 10 | 1 | 3 | 6 | 68% | 依旧 68% (外部 blocker) |
| 多租户 | 18 | 10 | 4 | 4 | 32% | 依旧 32% |
| 数据层 | 10 | 2 | 2 | 6 | 66% | 依旧 66% |
| 安全 | 9 | 3 | 2 | 4 | 52% | 依旧 52% |
| **合计** | **59** | **22** | **14** | **23** | **47%** | **47%** |

> WP-00 本职是底座扫描和骨架搭建, 偏离度下降需要后续 WP-01A~WP-02B 等实质性开发。

---

## 2. 本 WP-00 增量产出

### 2.1 新增文件

| 文件 | 说明 | 覆盖 BS |
|:----|:-----|:-------:|
| `docs/operations/environment-separation.md` | 三环境骨架 + 缺失项矩阵 | BS-0006 |
| `scripts/backup-db.sh` | PostgreSQL 备份骨架脚本 | BS-0009 |
| `scripts/restore-db.sh` | PostgreSQL 恢复骨架脚本 | BS-0009 |
| `docs/knowledge/acceptance/2026-07-23-wp-00-acceptance.md` | 本验收卡 | 全 BS |
| `docs/knowledge/prd/v23/v23-prd-architecture-base.md` | PRD 摘要卡 | 全 BS |

### 2.2 已存在但本次确认的资产

| 资产 | 路径 | 状态 |
|:-----|:-----|:----:|
| 架构硬约束 | `docs/operations/r11-architecture-hard-constraints.md` | ✅ 已存在 |
| Edge 模块 | `apps/api/src/modules/edge/` | ✅ 已存在 (23 个文件) |
| 离线排队 | `apps/api/src/modules/cashier/offline-sync.service.ts` | ✅ 已存在 |
| Mobile 离线队列 | `apps/mobile/src/sync/offline-queue.ts` | ✅ 已存在 |
| 三环境 config | `.env.docker` / `.env.staging.example` / `.env.production.example` | ✅ 已存在 |
| K8s Manifests | `infra/k8s/*.yaml` | ✅ 7 服务 |
| Terraform | `infra/terraform/aliyun-prod-*.tf` | ✅ 阿里云 |

---

## 3. 四要素覆盖检查

| 要素 | 状态 | 说明 |
|:----|:----:|:-----|
| ✅ 代码 | ✅ | Edge 模块 ~6500行 TS; offline-sync ~400行 TS; offline-queue ~200行 TS |
| ✅ 配置 | ✅ | 三环境变量 + docker-compose + env.example |
| ✅ 证据 | ✅ | 本 acceptance card + R11 偏离度分析 + 环境分离文档 |
| ✅ 回滚 | ⚠️ 基础 | backup-db.sh / restore-db.sh 骨架存在, 但未实战验证 |

四要素状态: **✅ 通过** (回滚: 骨架存在, 生产验证待后续 Sprint)

---

## 4. 圈梁合规检查

| 检查项 | 状态 |
|:-------|:----:|
| 无 test.skip/only | ✅ 本次未改测试 |
| 四要素: 代码 + 配置 + 证据 + 回滚 | ✅ |
| PR 合规字段: `6-8_refs: [BS-0001..BS-0020]` | ✅ |
| blocker_id: none | ✅ |
| 分支: tree/codeup-acr-ci-20260717 | ✅ |

---

## 5. 已知 Blockers

| 阻塞项 | 阻塞目标 | 状态 |
|:-------|:---------|:----:|
| LYT 电玩城接口文件未到位 | WP-01B 协议联调 | 外部 blocker |
| 数字运动潮玩馆管理系统接口文件未到位 | WP-01B 协议联调 | 外部 blocker |
| 生产域名未注册 | 生产环境上线 | 外部 blocker |

---

## 6. 结论

本 WP-00 架构底座已完成:
1. ✅ 扫描全部 BS-0001~BS-0020 覆盖的基础设施 → 见 §1.1
2. ✅ 环境分离文档 → `docs/operations/environment-separation.md`
3. ✅ 备份骨架脚本 → `scripts/backup-db.sh` / `scripts/restore-db.sh`
4. ✅ 边缘/离线能力确认 → Edge 模块 + Cashier Offline-Sync + Mobile Offline-Queue 均存在实现
5. ✅ 本验收卡 → 当前文件
6. ✅ PRD 摘要卡 → `docs/knowledge/prd/v23/v23-prd-architecture-base.md`

下一 sprint 建议: WP-01A (LYT 适配层框架) / WP-02A (多租户与数据隔离)
