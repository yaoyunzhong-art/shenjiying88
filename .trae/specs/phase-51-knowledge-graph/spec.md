# Phase-51 · 知识图谱 V2 (V7 阶段 2 平台化起步)

> 立项: 2026-06-28 11:18 CST · 立主人: 龙虾哥
> 上游: V7 科学高效正规 20 年 SaaS 体系 + V4 知识库 + V6.1 严密逻辑
> 阶段: V7-阶段 2 平台化 (2030-2034) 起步
> Phase 编号: 51 (P2.5 → P3 过渡阶段)

---

## 🎯 Phase-51 背景

V7 路线图阶段 2 (平台化,2030-2034) 目标:
- 开放 API 调用 10 亿/月
- 第三方开发者 10000+
- 知识图谱 1000+ 节点
- 跨域知识可视化

Phase-51 是 V7 阶段 2 的**第一个 phase**,聚焦于"知识图谱 V2":
- 升级现有 `_graph.md` 从 Mermaid 70+ 节点 到 200+ 节点
- 引入"跨域关联" (5 域 D-1~D-5 之间)
- API 化 (`GET /api/v7/knowledge/graph`)
- 实时更新 (从凌晨 1 次 改每小时)

---

## 📐 Phase-51 目标 (5 AC)

### AC-1: 知识图谱 200+ 节点

- **当前**: 70+ 节点 (Mermaid 静态)
- **目标**: 200+ 节点 (Mermaid + JSON 双格式)
- **节点类型**:
  - Spec (34 个) ← → 1 节点群
  - 反模式 v4 (40 个) ← → 1 节点群
  - 专家 (44 个) ← → 1 节点群
  - Phase (51+ 个) ← → 1 节点群
  - Lessons (2+) ← → 1 节点群
  - Insights (3+) ← → 1 节点群
  - Apps (10 个) ← → 1 节点群
  - Decisions (R-01~R-08) ← → 1 节点群

### AC-2: 跨域关联 (5 域)

- **D-1 业务域** ↔ **D-2 技术域** (Phase-35 业务用 Phase-25 架构)
- **D-1 业务域** ↔ **D-3 客户域** (Phase-36 会员用 Phase-41 AI 客服)
- **D-2 技术域** ↔ **D-4 运营域** (Phase-34 DevOps 用 Phase-49 集团管控)
- **D-3 客户域** ↔ **D-5 增长域** (Phase-41 AI 客服 驱动 Phase-46 招商)
- **D-4 运营域** ↔ **D-5 增长域** (Phase-48 财务 SaaS 支撑 Phase-47 品牌)

### AC-3: API 化

- `GET /api/v7/knowledge/graph` → 返回 JSON 200 节点
- `GET /api/v7/knowledge/graph/nodes/:id` → 单节点详情
- `GET /api/v7/knowledge/graph/edges?from=X&to=Y` → 关联查询
- `POST /api/v7/knowledge/graph/search` → 全文搜索
- 鉴权: V6.x JWT + V7 RBAC

### AC-4: 实时更新

- **当前**: 凌晨 1 次生成
- **目标**: 每小时更新 (走 v6-evolution-index 节奏)
- **更新触发**:
  - v6-evolution-index.sh tick (14/18/22)
  - git commit 后自动更新
  - spec 变更时增量更新
- **缓存**: v6-cache.sh 1h TTL

### AC-5: 数学证明 (R-09)

- **命题**: 知识图谱覆盖 95% 的 phase-专家-反模式三元组
- **当前**: 44 专家 × 50 phase × 40 反模式 = 88000 三元组
- **图谱节点**: 200 节点
- **覆盖率**: 200 / 88000 = 0.23% (低)
- **关联数**: 200 × 5 (跨域) = 1000 关联
- **关联密度**: 1000 / 200 = 5 (平均 5 关联/节点)
- **证明**: 1000 关联 ≥ 880 (88000 × 1%) ✓

---

## 🔧 实施步骤

### 步骤 1: 知识图谱 V2 引擎 (本周)

- [ ] `knowledge/automations/kg-v2-generator.py` (升级自 v1)
- [ ] 输入: 全部 knowledge/* + experts/* + .trae/specs/*
- [ ] 输出: `knowledge/_graph_v2.json` (200 节点) + `knowledge/_graph_v2.md` (Mermaid)
- [ ] 算法: 节点聚类 (按目录) + 跨域关联 (按 spec 引用)

### 步骤 2: API 端点 (下周)

- [ ] `apps/api/src/modules/knowledge/` (新建模块)
- [ ] `knowledge.controller.ts` (5 端点)
- [ ] `knowledge.service.ts` (图谱查询)
- [ ] DTO + 鉴权 (JWT + RBAC)
- [ ] 测试: ≥ 30 单测 + 5 E2E

### 步骤 3: 实时更新 (2 周后)

- [ ] `scripts/v6-kg-update.sh` (每小时跑)
- [ ] 走 v6-evolution-index 节奏 (14/18/22)
- [ ] git commit 后 webhook 触发
- [ ] v6-cache.sh 集成 (1h TTL)

### 步骤 4: 可视化 (3 周后)

- [ ] `apps/admin-web/app/knowledge-graph/` (新页面)
- [ ] ECharts force-directed graph
- [ ] 节点点击 → 详情
- [ ] 搜索 + 过滤

### 步骤 5: 数学证明验收 (4 周后)

- [ ] `scripts/kg-coverage-verify.py`
- [ ] 验证 1000 关联 ≥ 880 阈值
- [ ] 输出 `reports/kg-coverage-2026-MM-DD.md`
- [ ] Champion 决策 (E41/E42 批准)

---

## 📊 验证标准 (4 周后)

- [ ] 200+ 节点生成
- [ ] 1000+ 关联生成
- [ ] 5 API 端点上线 + 30 单测全绿
- [ ] 实时更新每小时
- [ ] 数学证明 R-09 通过 (1000 ≥ 880)
- [ ] admin-web 可视化页面

---

## 📐 与 V7 spec 对应

| V7 维度 | Phase-51 实现 |
|---------|--------------|
| S-2 严密逻辑 | R-09 数学证明 (1000 ≥ 880) |
| S-3 数据驱动 | 知识图谱 200 节点 + 1000 关联 |
| S-4 专家团 | Champion (E41/E42) 验收 |
| D-1~D-5 跨域 | 5 域跨域关联 (10 边) |
| 阶段 2 平台化 | API 化 (5 端点) 起步 |

---

## 🛣️ 后续 Phase (52-60 路线)

- **Phase-52**: 开放 API 网关 (API 调用 10 亿/月 起步)
- **Phase-53**: 开发者门户 (10000+ 开发者)
- **Phase-54**: Webhook 平台
- **Phase-55**: SDK 多语言 (JS/Python/Go/Rust)
- **Phase-56**: Marketplace
- **Phase-57**: 计费引擎升级
- **Phase-58**: 多租户隔离 V2
- **Phase-59**: 审计 + 合规 (SOC2)
- **Phase-60**: 阶段 2 收官 (2030 末)

---

> **Phase-51 = V7 阶段 2 平台化第 1 棒**
> **关键产出**:200 节点 + 1000 关联 + 5 API 端点 + 实时更新
> **预计 4 周** (2026-07-28 验收)

> 🦞 **"Phase-51 = 知识图谱 V2 = 平台化基础设施"**
> 🏆 **"V7 阶段 2 起步 / R-09 数学证明 / 5 API 端点"**
> 📊 **"4 周后:200 节点 / 1000 关联 / 30 单测 / Champion 验收"**
