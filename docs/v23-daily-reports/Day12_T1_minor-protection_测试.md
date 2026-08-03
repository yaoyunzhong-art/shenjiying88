# Day12 T1: minor-protection 模块 Controller 测试补充

**日期**: 2026-07-25
**执行人**: 树哥 Trae (subagent)
**任务**: api模块测试补充 — minor-protection controller 单元测试

---

## 审计结果

扫描 `apps/api/src/modules/` 下所有模块，发现：
- 所有 >5 源文件的模块均已有 `.test.ts` 覆盖（通过 `.spec.ts` 扫描遗漏了 `.test.ts` 文件）
- 优先列表中 **minor-protection** 缺少 controller 测试（仅 service.test.ts 97行 + integration.test.ts）

## 执行

### 所选模块: `minor-protection` (未成年保护)

**原因**: 唯一缺失 controller 单元测试的优先模块，且业务关键（合规 — 身份认证 + 时段管控 + 审计日志）

### 测试文件

`apps/api/src/modules/minor-protection/minor-protection.controller.test.ts`

**覆盖 22 个测试用例，6 个 Controller 端点**:

| 端点 | 测试用例 | 类型 |
|------|---------|------|
| `GET /config` | 返回完整默认配置, 副本独立性 | 正例 + 边界 |
| `POST /verify` | 未成年认证, 成年人认证, 身份证脱敏, 监护人同意, 记录可查询 | 正例 + 边界 + 回归 |
| `GET /verifications` | 列表查询, 空列表, 租户隔离 | 正例 + 边界 |
| `GET /verifications/:id` | ID查询, 不存在记录, 租户不匹配 | 正例 + 负例 |
| `POST /check-access` | 未认证→review, 成年人→pass, 未成年人无同意→review, 购买/游戏行为管控 | 正例 |
| `GET /access-logs` | 日志列表, 自定义limit, 空租户, 隔离 | 正例 + 边界 |

### 运行结果

```
✅ Test Files  3 passed (3)
✅ Tests     37 passed (37)
   - controller.test.ts: 22 passed
   - service.test.ts: 9 passed (已有)
   - integration.test.ts: 6 passed (已有)
⏱ Duration: 2.79s
```

### TSC 检查

`npx tsc --noEmit` 对新增测试文件 **0 错误**。

## 提交

- Commit: 包含在前一个 Day12 L1 commit (`1a58d8a13`)
- 文件: `apps/api/src/modules/minor-protection/minor-protection.controller.test.ts`
