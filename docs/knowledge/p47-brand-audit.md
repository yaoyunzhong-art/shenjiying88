# P-47 品牌运营模块专项审计

> 更新时间: 2026-07-14 14:40
> 范围: `PRD-012` / `apps/api/src/modules/brand-custom/` / `apps/api/src/modules/marketing/` / `apps/api/src/modules/content/`
> 审计人: 🦞 龙虾哥 × 🌲 树哥

## 1. 审计结论

**评级: 🟡 已补主圈梁（4.1/5）**

P-47 当前不是“未开始”，而是典型的“代码和测试已经很多，但 Phase 口径没正式收口”的模块。`brand-custom`、`marketing`、`content` 已共同覆盖品牌官网管理、品牌活动、品牌素材与多品牌配置主链，现阶段主要缺口集中在真实素材存储链路和门店前台联动验收。

## 2. PRD需求覆盖检查

| RQ-ID | 需求 | 代码 | 测试 | 状态 |
|:-----:|:-----|:----:|:----:|:----:|
| RQ-47-01 | 品牌官网管理 | `content.service.ts` / `content.controller.ts` | ✅ `content-ringbeam.test.ts` / `content.e2e.test.ts` | ✅ |
| RQ-47-02 | 品牌活动 | `marketing.service.ts` / `marketing.controller.ts` | ✅ `marketing-ringbeam.test.ts` / `marketing.e2e.test.ts` | ✅ |
| RQ-47-03 | 品牌素材 | `brand-custom.service.ts` / `content.service.ts` | ✅ `brand-custom-ringbeam.test.ts` / `brand-custom.e2e.test.ts` | 🟡 |
| RQ-47-04 | 门店品牌同步 | `brand-custom.service.ts` / `brand-custom.controller.ts` | ✅ `brand-custom.phase-p47.test.ts` / `brand-custom.e2e.test.ts` | 🟡 |

**PRD覆盖率: 2 / 4 完整闭环，2 / 4 已有主证据待补强化**。

## 3. 代码实现映射

### 3.1 品牌定制

| 文件 | 职责 |
|:----|:-----|
| `brand-custom.service.ts` | 主题、域名、邮件模板、多租户品牌配置 |
| `brand-custom.controller.ts` | 品牌配置对外入口 |
| `brand-custom.dto.ts` | 品牌配置 DTO / template 类型 |

### 3.2 品牌活动

| 文件 | 职责 |
|:----|:-----|
| `marketing.service.ts` | 活动评估、RFM、AB、优惠券、ROI、归因 |
| `marketing.controller.ts` | 营销 HTTP 入口 |
| `coupon-issuer.ts` / `channel-router.ts` / `attribution.ts` | 发券、渠道路由、归因辅助链路 |

### 3.3 官网内容

| 文件 | 职责 |
|:----|:-----|
| `content.service.ts` | 内容 CRUD、发布、归档、搜索 |
| `content.controller.ts` | 内容查询与操作入口 |
| `content.entity.ts` / `content.dto.ts` | 内容模型与请求约束 |

## 4. 测试证据

| 测试文件 | 类型 | 用例数 |
|:---------|:----:|:------:|
| `brand-custom-ringbeam.test.ts` | 圈梁 | 2 |
| `brand-custom.phase-p47.test.ts` | Phase | 13 |
| `brand-custom.e2e.test.ts` | E2E | 9 |
| `marketing-ringbeam.test.ts` | 圈梁 | 4 |
| `marketing.e2e.test.ts` | E2E | 18 |
| `content-ringbeam.test.ts` | 圈梁 | 2 |
| `content.e2e.test.ts` | E2E | 21 |

**主证据合计: 69 tests**

## 5. 对齐判断

```text
PRD-012
  ├── RQ-47-01 官网内容管理      ✅ 代码 + ✅ 测试
  ├── RQ-47-02 品牌活动          ✅ 代码 + ✅ 测试
  ├── RQ-47-03 品牌素材          ✅ 主链已在，但缺对象存储级证据
  └── RQ-47-04 门店品牌同步      ✅ 配置/测试已在，但缺真实前台联动验收
```

当前结论：P-47 已经具备“需求卡 + 代码映射 + 主测试 + 专项审计”四道箍，不再属于 `⬜未开始`。

## 6. 缺口清单

| 缺口 | 类型 | 严重度 | 建议 |
|:-----|:----:|:------:|:-----|
| logo/banner/video 缺对象存储级上传证据 | 功能 | 🟡 P2 | 后续补真实文件上传与持久化链路 |
| 门店品牌同步缺浏览器/前台联动验收 | 验收 | 🟡 P2 | 追加品牌页或门店页联动抽检 |
| `marketing-metrics` 尚未纳入 P-47 主圈梁 | 审计 | 🟢 P3 | 后续作为增强证据补挂 |

## 7. 验证记录

```bash
pnpm --dir apps/api exec vitest run src/modules/brand-custom/brand-custom-ringbeam.test.ts src/modules/brand-custom/brand-custom.phase-p47.test.ts src/modules/brand-custom/brand-custom.e2e.test.ts src/modules/marketing/marketing-ringbeam.test.ts src/modules/marketing/marketing.e2e.test.ts src/modules/content/content-ringbeam.test.ts src/modules/content/content.e2e.test.ts
bash scripts/prd-validate.sh
```
