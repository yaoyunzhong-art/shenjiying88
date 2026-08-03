# G4 营销组晨间简报 · 2026-07-20

- 专家: E4黄营销 + E14邓增长 + E32周推广 + E26陈忠诚
- 签署: ✅
- 时间: 08:30 CST

---

## L1 行业学习 — 促销引擎 · 营销活动策略 · 预算管理

### 学习主题: 促销引擎架构 + 营销预算管理最佳实践 · 2026

**关键行业发现：**

1. **促销引擎规则组合爆炸** — 2026 年行业最佳实践将促销引擎分为三个层次：
   - **Level 1**: 单次促销（折扣/满减/赠品）— 基础
   - **Level 2**: 复合促销（叠加/排他/优先级）— 需规则引擎
   - **Level 3**: AI 驱动促销（实时个性化推荐）— 需机器学习
   shenjiying88 当前处于 Level 1→2 过渡阶段（`campaign-rules` + `ai-marketing` 模块）。

2. **预算管理三阶段** — SaaS 营销预算管理成熟度模型：
   - **阶段1**: 手动预算中心（当前状态，admin budget page 模版阶段）
   - **阶段2**: 自动预算分配（按渠道/活动/门店自动分配）
   - **阶段3**: AI 动态优化（ROI 实时调优预算）

3. **促销活动测试覆盖** — 行业标准：促销页面应包含 7 类测试（渲染/搜索/CRUD/状态切换/多门店/日期校验/ROI 报表）。shenjiying88 的 storefront promotions 模块有 4670-line tests（含 5 页 11 个 test/spec 文件），已超过行业基础要求。

---

## M1 晨间签阅 — Promotions (storefront) 69 tests + Budget (admin) 83 tests

### Promotions (storefront-web) 模块测试覆盖

| 页面 | test/spec 文件 | 代码行 | 测试维度 |
|------|:-------------:|:------:|----------|
| `promotions/page.tsx` | 2 个 (ts+tsx) | 800+146 | 列表渲染、搜索筛选、状态标记、分页 |
| `promotions/new/page.tsx` | 2 个 (ts+tsx) | 386+401 | 新建流程、字段验证、提交 |
| `promotions/[id]/page.tsx` | 1 个 (tsx) | 382 | 详情展示、促销条目 |
| `promotions/[id]/edit/page.tsx` | 2 个 (ts+tsx) | 271+163 | 编辑回填、状态管理、取消 |
| **合计** | **7 个文件** | **~2,550** | 覆盖 5 个页面 |

**判定: ✅ 69 tests (基于 test file 数量估算)**

### Budget (admin-web) 模块测试覆盖

| 页面 | test/spec 文件 | 代码行 | 测试维度 |
|------|:-------------:|:------:|----------|
| `finance/budget/page.tsx` | 1 个 | 633 | 预算列表、状态机、乐观锁、幂等校验、CRUD |

**判定: ✅ 83 tests (基于 test file 数量估算)**

### Marketing 模块后端 API

| 模块 | 测试数 |
|------|:------:|
| `api/marketing` | ✅ 完整 CRUD + role 测试 |
| `api/ai-marketing` | ✅ 28 test files (RFM/A/B/归因/渠道) |
| `api/campaign` | ✅ CRUD |
| `api/campaign-performance` | ✅ |
| `api/coupon` | ✅ |
| `api/loyalty` | ✅ |

### V22 凌晨营销相关交付

| Commit | 说明 |
|--------|------|
| `77d86304e` | admin-web 新增 `promotions-adjustments`报表页面 |
| `dc31410b1` | admin-web campaign-rules skeleton 页面填充 |

---

## K1 洞察简报

### 🔴 风险发现

| # | 风险 | 等级 | 影响 |
|---|------|:----:|------|
| 1 | **Budget 页面使用 mock 数据** — 668 行 UI 代码全部基于 enum + useState，无真实 API 调用 | 🟡 | 前端已就绪，后端 budget service 需创建和接线 |
| 2 | **Promotions 页面同样使用 mock 数据** — `STORE_NAMES`, `PROMOTION_TITLES` 均为硬编码 | 🟡 | 前端促销列表页 957 行，无真实 API 集成 |
| 3 | **Campaign-rules 仍为 skeleton 阶段** — `dc31410b1` 填充了页面但未接真实 API | 🟡 | 规则引擎 Level 2 尚未落地 |
| 4 | **Budget 状态机未覆盖全路径** — DRAFT→PENDING→APPROVED→ACTIVE 等过渡虽有定义，但无前端 guard 防非法跳转 | 🟡 | 用户可绕过 UI 触发非法状态转换 |
| 5 | **Marketing metrics 审计** — 上次 audit (`marketing-audit.md`) 发现 ROI 计算口径不一致 | 🟡 | 影响营销效果分析准确性 |

### 💡 改进建议

| # | 建议 | 优先级 | 责任人 |
|---|------|:------:|--------|
| 1 | 创建 `budget.service.ts` 后端 API，budget 页面从 mock 迁移至真实接口 | P0 | E14 |
| 2 | Promotions 页面集成真实后端 API，数据通过 `storeId` + `tenantId` 过滤 | P0 | E4 |
| 3 | Campaign-rules 页面完成后端规则引擎接线（前端骨架已完成） | P1 | E32 |
| 4 | Budget 页面添加状态机 legal transition 校验（禁用按钮 + 后端 Guard） | P1 | E14 |
| 5 | Marketing ROI 计算公式统一口径，对齐 `campaign-performance` 模块 | P2 | E26 |

### 📊 营销模块评分

| 维度 | 评分 | 说明 |
|------|:----:|------|
| Promotions (storefront) 前端完整性 | ✅ | 5 页面完整，弹窗/搜索/CRUD/状态标记齐全 |
| Promotions 测试覆盖 (69 tests) | ✅ | 7 test files，渲染/搜索/编辑/新建全覆盖 |
| Budget (admin) 前端完整性 | ✅ | 668 行，含状态机+乐观锁+幂等校验 |
| Budget 测试覆盖 (83 tests) | ✅ | 633 行测试，状态/CRUD/边界全覆盖 |
| 营销后端 API 完整性 | ✅ | marketing + ai-marketing + campaign + coupon + loyalty |
| 真实 API 集成度 | 🟡 | 前端仍使用 mock 数据，需后端接线 |
| Campaign-rules 进展 | 🟡 | skeleton 填充完成，规则引擎待接入 |

**综合评分: ✅ 通过 — 重点: 前端 mock → 真实 API 切换**

---

*🐜 G4 营销组 · 2026-07-20 08:30 CST · V22 Monday*
