# 🛡️ 验收卡: WP-COMPLIANCE 合规与治理阀门

> 日期: 2026-07-23
> 版本: v1.0
> 圈梁: 代码✅ 配置✅ 证据✅ 回滚✅
> 负责: WP-COMPLIANCE
>
> 引用 BS:
> - BS-0233: 开发合规阀门
> - BS-0248: 季度全系统模拟
> - BS-0250: 问题闭环追踪
> - BS-0261: 持续优化 KPI
> - BS-0262: 模拟运行覆盖率 100%

---

## 验收标准

### ✅ BS-0233 — 合规阀门引擎

| # | 标准 | 状态 | 证据 |
|:-:|------|:----:|------|
| 1 | GET /compliance/gate/check 返回三阀门结果 | ✅ | 端点已实现，返回 passed + results (COVERAGE/TSC_PASS/TEST_PASS) |
| 2 | 阀门检查覆盖代码审查完成率 | ✅ | checkCoverage() 方法，默认阈值 90% |
| 3 | 阀门检查覆盖 TSC 类型检查通过率 | ✅ | checkTscPass() 方法，默认阈值 100% |
| 4 | 阀门检查覆盖测试通过率 | ✅ | checkTestPass() 方法，默认阈值 100% |
| 5 | 阀门配置可动态调整 | ✅ | GET/POST /compliance/gate/config 端点 |
| 6 | 阀门可绕过（enabled=false） | ✅ | SKIP 状态处理 |
| 7 | 检查结果记录审计日志 | ✅ | gate check 写入 AuditLogService |
| 8 | 合规阀门单元测试 | ✅ | compliance-gate.service.test.ts (15+ tests) |
| 9 | 偏离单模板存在 | ✅ | .trae/compliance/deviation-registry.json |

### ✅ BS-0248 — 季度全系统模拟

| # | 标准 | 状态 | 证据 |
|:-:|------|:----:|------|
| 1 | 季度模拟脚本存在 | ✅ | scripts/compliance-quarterly-simulate.sh |
| 2 | 检查覆盖率指标 | ✅ | --coverage 参数支持 |
| 3 | 检查 TSC 通过率 | ✅ | --tsc-pass 参数支持 |
| 4 | 检查测试通过率 | ✅ | --test-pass 参数支持 |
| 5 | 检查偏离单完整性 | ✅ | --deviation-only 模式 + jq 解析 |

### ✅ BS-0250 — 问题闭环追踪

| # | 标准 | 状态 | 证据 |
|:-:|------|:----:|------|
| 1 | 偏离注册表文件存在 | ✅ | .trae/compliance/deviation-registry.json |
| 2 | 结构含 id/severity/title/status/createdAt/closedAt/blocker | ✅ | 含所有必填字段 + bsRefs/description/assignedTo/targetCloseDate/resolution |

### ✅ BS-0261 — 持续优化 KPI

| # | 标准 | 状态 | 证据 |
|:-:|------|:----:|------|
| 1 | 闭环率指标定义 | ✅ | compliance-gate.service 的三阀门 + 偏离单检查自动度量 |
| 2 | 修复周期追踪 | ✅ | deviation-registry.json 含 targetCloseDate + createdAt + closedAt |

### ✅ BS-0262 — 模拟运行覆盖率 100%

| # | 标准 | 状态 | 证据 |
|:-:|------|:----:|------|
| 1 | 季度模拟覆盖所有核心场景 | ✅ | 脚本支持全量检查 (覆盖率+TSC+测试+偏离单) |
| 2 | 模拟结果可审计 | ✅ | 脚本输出详细日志 + 退出码映射 |

---

## 产出物清单

| 文件 | 用途 | 圈梁 |
|------|------|:----:|
| apps/api/src/modules/compliance/compliance-gate.service.ts | 合规阀门引擎 | ✅ |
| apps/api/src/modules/compliance/compliance-gate.service.test.ts | 阀门引擎测试 | ✅ |
| apps/api/src/modules/compliance/compliance.controller.ts(修改) | 新增 gate 端点 | ✅ |
| apps/api/src/modules/compliance/compliance.module.ts(修改) | 注册 gate 服务 | ✅ |
| apps/api/src/modules/compliance/compliance.controller.test.ts(修改) | 新增 gate 端点测试 | ✅ |
| apps/api/src/modules/compliance/compliance.module.test.ts(修改) | 注册验证测试 | ✅ |
| scripts/compliance-quarterly-simulate.sh | 季度模拟脚本 | ✅ |
| .trae/compliance/deviation-registry.json | 偏离单注册表 | ✅ |
| docs/operations/r19-compliance-gate.md | 合规阀门操作手册 | ✅ |
| docs/knowledge/prd/v23/v23-prd-compliance-gate.md | PRD 摘要卡 | ✅ |
| docs/knowledge/acceptance/2026-07-23-wp-compliance-acceptance.md | 验收卡（本文件） | ✅ |

---

## 回滚计划

### 回滚 A: 全量回滚

```bash
git checkout HEAD~1 -- \
  apps/api/src/modules/compliance/compliance-gate.service.ts \
  apps/api/src/modules/compliance/compliance-gate.service.test.ts \
  apps/api/src/modules/compliance/compliance.controller.ts \
  apps/api/src/modules/compliance/compliance.module.ts \
  apps/api/src/modules/compliance/compliance.controller.test.ts \
  apps/api/src/modules/compliance/compliance.module.test.ts \
  scripts/compliance-quarterly-simulate.sh \
  .trae/compliance/deviation-registry.json

# PRD 文档不影响运行时, 可保留
```

### 回滚 B: 仅回滚 API 变更

```bash
# 恢复 controller.ts 移除 gate 端点
git checkout HEAD~1 -- apps/api/src/modules/compliance/compliance.controller.ts
git checkout HEAD~1 -- apps/api/src/modules/compliance/compliance.module.ts
git checkout HEAD~1 -- apps/api/src/modules/compliance/compliance.module.test.ts
git checkout HEAD~1 -- apps/api/src/modules/compliance/compliance.controller.test.ts
# 删除新增文件
rm -f apps/api/src/modules/compliance/compliance-gate.service.ts
rm -f apps/api/src/modules/compliance/compliance-gate.service.test.ts
```

---

## 合规声明

```yaml
6-8_refs:
  - BS-0233
  - BS-0248
  - BS-0250
  - BS-0261
  - BS-0262
blocker_id: none
```
