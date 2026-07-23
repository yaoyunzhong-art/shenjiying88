# R19a 合规阀门 (Compliance Gate) 操作手册

> 迭代: WP-COMPLIANCE | BS-0233
> 日期: 2026-07-23
> 状态: ✅ 初始发布
> 前置: r19-compliance-report-mechanism.md (合规报告机制)

---

## 一、概述

合规阀门（Compliance Gate）是 WP-COMPLIANCE 的核心执行引擎，提供配置化的自动合规检查能力。每个 PR 合并前应通过合规阀门检查。

### 1.1 阀门体系

```
┌─────────────────────────────────────────────┐
│         合规阀门 (Compliance Gate)             │
├─────────────────────────────────────────────┤
│  1. COVERAGE  ── 代码审查完成率 (≥90%)        │
│  2. TSC_PASS  ── TSC类型检查通过率 (≥100%)    │
│  3. TEST_PASS ── 测试通过率 (≥100%)           │
└─────────────────────────────────────────────┘
```

### 1.2 偏离单模板

偏离单存储于 `.trae/compliance/deviation-registry.json`，结构如下：

```json
{
  "meta": { "version": "1.0", "lastUpdated": "..." },
  "deviations": [
    {
      "id": "DEV-0001",
      "severity": "P0",
      "title": "...",
      "description": "...",
      "bsRefs": ["BS-XXXX"],
      "status": "open" | "in_progress" | "closed",
      "createdAt": "...",
      "closedAt": null,
      "blocker": false,
      "assignedTo": null,
      "targetCloseDate": null,
      "resolution": null
    }
  ]
}
```

---

## 二、API 端点

### 2.1 执行阀门检查

```http
GET /compliance/gate/check
  ?coverage=95
  &tscPass=100
  &testPass=100
```

**响应示例:**

```json
{
  "passed": true,
  "results": [
    {
      "gate": "COVERAGE",
      "status": "PASS",
      "currentValue": 95,
      "threshold": 90,
      "message": "代码审查完成率 95% ≥ 90% ✅"
    },
    {
      "gate": "TSC_PASS",
      "status": "PASS",
      "currentValue": 100,
      "threshold": 100,
      "message": "TSC 类型检查通过率 100% ≥ 100% ✅"
    },
    {
      "gate": "TEST_PASS",
      "status": "PASS",
      "currentValue": 100,
      "threshold": 100,
      "message": "测试通过率 100% ≥ 100% ✅"
    }
  ],
  "checkedAt": "2026-07-23T..."
}
```

### 2.2 查看配置

```http
GET /compliance/gate/config
```

### 2.3 更新配置

```http
POST /compliance/gate/config
Content-Type: application/json

{
  "coverageThreshold": 85,
  "enabled": true
}
```

---

## 三、阀门阈值说明

| 阀门 | 默认阈值 | 说明 | 建议调整范围 |
|:----:|:--------:|------|:----------:|
| COVERAGE | 90% | 代码审查完成率 = 已审查 PR / 总 PR | 80%-95% |
| TSC_PASS | 100% | TSC 类型检查通过率 | 100% 不可降 |
| TEST_PASS | 100% | 测试通过率 | 100% 不可降 |

---

## 四、季度模拟 (BS-0248)

### 4.1 执行脚本

```bash
# 全量模拟
./scripts/compliance-quarterly-simulate.sh

# 自定义指标
./scripts/compliance-quarterly-simulate.sh --coverage=95 --tsc-pass=100 --test-pass=100

# 仅检查偏离单
./scripts/compliance-quarterly-simulate.sh --deviation-only

# 详细输出
./scripts/compliance-quarterly-simulate.sh --verbose
```

### 4.2 输出格式

```
═══════════════════════════════════════════════════════════
  ║  季度合规模拟 — Q3                                    ║
  ║  时间: 2026-07-23T10:00:00+0800                       ║
═══════════════════════════════════════════════════════════

[1/4] 代码审查完成率 (COVERAGE)
  ✅ 代码审查完成率: 95% ≥ 90%

[2/4] TSC 类型检查通过率 (TSC_PASS)
  ✅ TSC 类型检查通过率: 100% ≥ 100%

[3/4] 测试通过率 (TEST_PASS)
  ✅ 测试通过率: 100% ≥ 100%

[4/4] 偏离单检查 (DEVIATION_REGISTRY)
  ✅ 偏离注册表存在
    总偏离单: 5  (关闭: 3  P0开放: 0  P1开放: 2)
  ✅ 无待处理 P0 偏离项

═══════════════════════════════════════════════════════════
  总检查项: 4  |  通过: 4  |  失败: 0
  ✅ 季度合规模拟: 全部通过
═══════════════════════════════════════════════════════════
```

---

## 五、持续优化指标 (BS-0261, BS-0262)

### 5.1 核心 KPI

| 指标 | 公式 | 目标 | 监控方式 |
|:----|------|:----:|:--------:|
| 闭环率 | 关闭偏离数 / 总数 | ≥95% | deviation-registry.json 状态统计 |
| 修复周期 | 关闭日期 - 创建日期 | ≤14天(P0)/≤30天(P1) | targetCloseDate 追踪 |
| 模拟覆盖率 | 已覆盖场景 / 总场景 | 100% | 季度模拟脚本输出 |

### 5.2 持续改进流程

```
PR 提交 → 合规阀门自动检查 → 通过 ✅ → 合并
                               ↓ 不通过
                        生成偏离单 → 派发修复 → 验收关闭
```

---

## 六、圈梁证据

### 代码 ✅
- `apps/api/src/modules/compliance/compliance-gate.service.ts` — 阀门引擎
- `apps/api/src/modules/compliance/compliance-gate.service.test.ts` — 引擎测试 (15+)
- `apps/api/src/modules/compliance/compliance.controller.ts` — 新增 gate 端点
- `apps/api/src/modules/compliance/compliance.module.ts` — 注册 gate 服务

### 配置 ✅
- `compliance-gate.service.ts` 中 GateConfig 可配置
- `.trae/compliance/deviation-registry.json` — 偏离单模板

### 证据 ✅
- `scripts/compliance-quarterly-simulate.sh` — 季度模拟脚本
- `docs/knowledge/acceptance/2026-07-23-wp-compliance-acceptance.md` — 验收卡

### 回滚 ✅
```bash
# 快速回滚所有 API 变更
git checkout HEAD~1 -- apps/api/src/modules/compliance/
rm -f scripts/compliance-quarterly-simulate.sh
rm -f .trae/compliance/deviation-registry.json
```
