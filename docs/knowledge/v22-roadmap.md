# 🗺️ V22 Roadmap — 基建优先 · MVP交付冲刺 · 科学化自进化

> 生成: 2026-07-19 23:45 · 基于 V21 Day1 科学审计报告
> 评估: 整体开发进度 47/100
> 生命周期: 2026-07-20 08:00 → MVP 交付

---

## ⚠️ 核心诊断

### 项目现状三维评分

| 维度 | 评分 | 缺口 |
|:-----|:----:|:------|
| 后端模块 | 75 | 3 个缺失模块（HR/团建/排班API） |
| 前端页面 | 50 | 30% 骨架页填内容 + 3 个缺少路由 |
| 生产就绪 | 25 | CI/CD/Docker/CDN/域名/SSL/监控均不完整 |
| **综合** | **47** | |

### 核心矛盾

```
✅ 强项: 157个后端模块 · 60,699个测试断言 · 35+新源码页面 · 持续34🏆
❌ 弱项: 无CI/CD流水线 · 无生产级Docker multi-build · 3个领域模块缺失
          90%测试为"源码快照"非真实交互测试 · 无E2E跨模块覆盖
          30%前端页面只有骨架

一句话: 代码量大但生产就绪度极低。测试帝国掩盖了基础设施空白。
```

---

## 🔴 V22 战略目标

### MVP 交付标准（V22 结束时满足）

```
MVP = 3端可运行 + 核心业务流程闭环 + 能演示
```

| # | 目标 | Deadline | 优先级 |
|:-:|:-----|:--------:|:------:|
| 1 | **CI/CD 流水线** | 7/22 | P0 |
| 2 | **docker compose up 即可运行** | 7/23 | P0 |
| 3 | **nginx + SSL + 域名（dev.m5.saas）** | 7/23 | P0 |
| 4 | **HR 模块 API + 页面** | 7/25 | P0 |
| 5 | **排班模块 API 完整化** | 7/25 | P0 |
| 6 | **团建模块 API + 页面** | 7/26 | P0 |
| 7 | **前端骨架页面填充（30%→15%）** | 7/27 | P1 |
| 8 | **3 条跨模块 E2E 流程** | 7/27 | P1 |
| 9 | **Prometheus + Grafana 基础监控** | 7/28 | P1 |
| 10 | **30% 测试从源码分析迁移到真实渲染** | 7/30 | P2 |
| 11 | **性能压测（k6+JMeter）** | 7/30 | P2 |
| 12 | **灾备/备份策略** | 7/31 | P2 |
| 13 | **国际化落地（至少 admin-web 双语）** | 8/01 | P3 |

---

## 🏗️ Phase 0: 基建攻坚（7/20-7/23）

### P0-1: CI/CD 自动化流水线

**Why:** 代码正确性由 CI 保证，不依赖人工验收
**What:**
```yaml
.github/workflows/ci.yml:
  - pnpm install + tsc --noEmit（全7端）
  - node --test（storefront/admin/tob 端测试）
  - vitest run（api 端测试）
  - pnpm lint
  - Dependabot 依赖扫描
```
**验收:** PR push 时自动跑全量 TSC + 测试，阻断失败

### P0-2: 生产级 Docker 构建

**现状:** 只有 `apps/api/Dockerfile`
**目标:**
```
apps/api/Dockerfile          ← 已有，增强multi-stage
apps/admin-web/Dockerfile    ← 新建（Next.js standalone output）
apps/storefront-web/Dockerfile ← 新建
apps/tob-web/Dockerfile      ← 新建
nginx/docker/Dockerfile      ← 新建（nginx + certbot）
```

### P0-3: nginx + 域名 + SSL

**现状:** nginx/nginx.conf 已写好，但未接入 cert-manager DNS-01
**目标:** `docker compose up` 后，`https://admin.dev.m5.saas` 可访问
**基础设施需要的 TLS:**
- cert-manager cert template 已在 `infra/k8s/templates/`，需要适配到 docker-compose

### 小时级计划（7/20）

```
08:00-10:00  CI/CD: .github/workflows 文件创建 + 测试
10:00-12:00  4个Dockerfile创建 + docker compose build 通过
14:00-16:00  nginx + certbot 集成 + 开发域名配置
16:00-18:00  验收: docker compose up 成功启动所有服务
20:00-22:00  知识体系 + 审计项
```

---

## 📋 Phase 1: 领域填补（7/24-7/26）

### P1-1: HR 员工管理系统

**后端 (api):**
```
apps/api/src/modules/hr/
├── hr.entity.ts          ← Employee/Department/Attendance/Payroll
├── hr.service.ts         ← CRUD + 考勤计算 + 薪资计算
├── hr.controller.ts      ← RESTful endpoint
├── hr.module.ts
├── hr.service.test.ts    ← ≥20 tests (vitest)
└── hr.controller.test.ts ← ≥10 tests
```

**前端 (admin-web):**
```
apps/admin-web/app/employees/   ← 已有? 检查
apps/admin-web/app/attendance/  ← 新建打卡页面
apps/admin-web/app/payroll/     ← 新建薪资页面
```

### P1-2: 排班管理 API 完善

**现状:** shift-scheduler module 存在但只有基础 entity
**增强:**
```
apps/api/src/modules/shift-scheduler/
├── shift.entity.ts            ← 扩字段(班次类型/轮转规则/能力标签)
├── shift-algorithm.service.ts ← 自动排班算法(约束满足)
├── shift-optimization.ts      ← 成本优化引擎
├── shift.service.ts ← 扩展(批量+冲突检测+人员匹配)
```

### P1-3: 团建模块

**后端 (api):**
```
apps/api/src/modules/team-building/
├── team-building.entity.ts
├── team-building.service.ts
├── team-building.controller.ts
├── team-building.module.ts
├── team-booking.service.ts    ← 预约/取消/支付集成
└── *.test.ts                  ← ≥30 tests
```

**前端 (tob-web):**
```
apps/tob-web/app/team-building/   ← 新建
apps/tob-web/app/team-booking/    ← 新建
```

---

## 🧪 Phase 2: 测试体系升级（7/24-7/30）

### 2.1 增长实渲染测试（从源码分析逐步迁移）

**现状:** 90% 测试使用 readFileSync + 字符串分析
**迁移策略:** 不批量推翻重写——对 20 个核心页面优先升级

```
Priority 1 (7/24-7/26): finance/budget, customers/(page+new), storefront/checkout, admin/dashboard
Priority 2 (7/27-7/28): 所有 P-38 finance 页面
Priority 3 (7/29-7/30): storefront 核心列表页
```

### 2.2 跨模块 E2E

**现状:** 39 个 __e2e__ 文件但只有 1 个跨模块 admin-to-sdk-to-api 流程
**目标（3 条完整链路）:**

```
#1 admin-→storefront-→api: 创建优惠券 → 门店端应用 → 对账验证
#2 admin-→tob-→payment: 创建品牌活动 → 品牌端审批 → 支付结算
#3 storefront-→inventory-→supplier: 门店开单 → 库存扣减 → 供应商采购触发
```

---

## 🌐 Phase 3: 运维 + 监控（7/28-7/31）

### 3.1 Prometheus + Grafana

部署 gte（由现有 `infra/k8s/monitoring-stack.yaml` 生成配置）：
```
/api/metrics          ← NestJS Prometheus metrics
/api/health           ← Health check endpoint
infra/grafana/        ← 预置 dashboard JSON（已有部分）
```

### 3.2 性能压测

```
scripts/loadtest/
├── checkout-flow.k6.js          ← 收银并发(100vus/3min)
├── financial-report.k6.js       ← 报表查询(50vus)
├── api-rampup.k6.js             ← API 阶梯压测
└── README.md
```

### 3.3 备份 + 灾备

```yaml
# 新增 cron
00 03 * * *  pg_dump → s3备份 (保留30天轮转)
00 04 * * *  灾备演练回放
```

---

## 📊 Phase 4: V21 自进化引擎第三层（持续）

### 4.1 L1 实时反循环升级

当前有异常记录 → L1 自动触发反模式库匹配
升级: 记录 JSON 到 `memory/evolution/snapshots/` 并自动 push 到 L3 评分

### 4.2 L3 评分增强

现有评分模型设权重为:
```
测试通过分(40) = min(40, pass/(pass+fail)×40)  ← 当前已有
树哥合规分(20) = (1 - 违规/交付)×20             ← 当前已有
TSC稳定分(20) = (1 - TSCfail/总文件)×20         ← 当前已有
闭环率分(20) = 修复/发现×20                     ← 当前已有
=== 新增 ===
基建分(10) = CI绿色率×5 + Docker build通过率×5  ← 新增
E2E分(10) = E2E通过链路数/目标数×10              ← 新增
```

总评上限调到 120 分，100 以上为 🟢S

### 4.3 L4 批处理增强

每周日跑 7 天数据时，加入:
- 测试质量迁移率（从快照→渲染测试的百分比）
- 生产就绪系数（CI通过率 / 部署次数）
- 领域覆盖率增量（补齐模块数量周环比）

---

## ⏰ V22 cron 调度（更新版）

| 时段 | 开发任务 | 新增基建 |
|:----:|:---------|:---------|
| **00:00** | 午夜冲刺启动 | — |
| **02:00** | Phase 1 模块补全 | — |
| **04:00** | 自动测试 + 验收 | CI health check |
| **06:00** | 全量验收+TSC | Docker build check |
| **07:00** | 🔐 CI/CD : 自动测试+构建 | gh workflow 运行 |
| **08:00** | 晨间派单（基建优先） | — |
| **10:00** | 验收脉冲 | — |
| **11:00** | 📚 日采 | — |
| **12:00** | 午间派单 | — |
| **14:00** | 基建攻坚+领域填补 | Docker/nginx/SSL |
| **16:00** | 测试迁移（源码→渲染） | — |
| **18:00** | 晚间验收 | CI绿色率检查 |
| **20:00** | 晚会签署 | 基建就绪检查 |
| **22:00** | L3+L4进化 | SaaS 健康评分 |

---

## 🎯 V22 Day1 指标（7/20）

| 指标 | 目标 |
|:-----|:----:|
| commits | ≥30 |
| CI流水线 | 1 条完整 .github/workflows |
| Dockerfile | 4个(admin/storefront/tob/nginx) |
| docker compose build | 全通过 |
| TSC | 0 |
| 新增测试 | ≥300 |
| 基建缺口闭合 | 15%→20% |
| 连续稳态 | ≥34🏆 |

## 🔗 圈梁更新（V22 六道箍）

| 箍 | 含义 | 检查方式 |
|:--:|:-----|:---------|
| 🟢 代码 | TSC零错误 | `npx tsc --noEmit -p <project>` |
| 🟢 测试 | 测试文件存在 & 0 fail | `.test.tsx` 不skip |
| 🟢 审计 | 圈梁表更新 | `phase-to-module-mapping.md` |
| 🟡 PRD | 新建页面24h补PRD | PRD摘要卡 |
| 🟠 知识赋能 | 数据库自动检索 | `POST /api/empower-cards/match` |
| 🔴 **基建** | **CI/Docker/Build 绿色** | **gh workflow pass / docker build pass** |

---

## ⚠️ 风险清单

| ID | 风险 | 概率 | 影响 | 缓解 |
|:--:|:-----|:----:|:----:|:-----|
| R-001 | docker compose build 因 tsconfig/gyp 失败 | 高 | 高 | 预检查所有 native deps |
| R-002 | CI 配置错误导致阻断开发 | 中 | 中 | 先跑本地模拟 |
| R-003 | 树哥不适应基建任务 | 高 | 高 | 基建由龙虾哥写脚本，树哥只执行 |
| R-004 | k8s 配置与 docker-compose 冲突 | 中 | 中 | 保持两套配置并行 |
| R-005 | 团建/HR 模块 PRD 未定义 | 中 | 高 | 基建期同时起草 PRD |
| R-006 | 现有 k8s 配置不可用（secret的.env 不对） | 高 | 高 | 基建第一天校验 |

---

> **一句话: V22 从 "写代码" 转向 "搭基建"，补上生产就绪和领域缺失，目标 47→70 分。**
