# 🔌 熔断机制 v2

> 版本: v2 | 🐜 [V17: audit-quality-fuse]
> 状态: 生效
> 最后更新: 2026-07-14

---

## 概述

熔断机制用于 DevOps/SRE 自动化流程中，当检测到同源连续失败时，自动逐级升级处理方式，从正常派修直至 P0 停线熔断。

不同源（不同团队/模块/故障类型）的连续失败仅标记聚合，不触发熔断。

---

## 熔断规则

| 门限 | 级别 | 处理方式 | 派修动作 |
|------|------|----------|----------|
| 同源 fail ×1 | — | 正常派修 | 自动创建 JIRA/P1 修复任务，派给责任方 |
| 同源 fail ×2 | **P1** | 标记审查 | 触发人工审查，要求责任人在 2h 内回复 RCA |
| 同源 fail ×3 | **P0** | 停线熔断 | 立即停线，锁定所有非紧急 deploy，召集紧急复盘会 |

### 不同源失败

- 连续不同源 fail → 仅标记，不升级熔断级别
- 每轮汇总输出聚合报告

---

## 核心概念

### 同源定义

"同源" = 同时满足以下条件之一：

1. **相同模块/微服务** — 例如 `@admin-web/user` 连续 fail
2. **相同错误类型** — 例如连续 TSC 类型错误
3. **相同测试套件** — 例如同一 `*.ringbeam.test.ts` 连续失败
4. **相同根因** — 人工确认或根因分析工具标记

### 熔断计数器

```
同源计数器 (per source):
  sourceKey = md5(module + "-" + errorType + "-" + testSuite)
  counter[sourceKey] += 1
  
  当 counter[sourceKey] == 2 → P1
  当 counter[sourceKey] == 3 → P0
  
  不同源计数器 (global):
  global_miss += 1 → 仅标记聚合
```

### 计数器重置

- ✅ 同源 fail 被修复后 → 重置该源计数器为 0
- ✅ 每日 00:00 UTC → 全部计数器重置
- ✅ 人工输入 `fuse-reset` → 按 sourceKey 或全部重置

---

## 熔断体类型

| 类型 | 检测方式 | 熔断动作 |
|------|----------|----------|
| 🏗️ 编译熔断 | TSC 错误数 > 阈值 | 阻止编译，通知 infra |
| 🔬 测试熔断 | E2E/Unit fail 同源 ×3 | 停线锁定 deploy |
| 📡 监控熔断 | 生产级 alert 同源 ×3 | 触发紧急 on-call |
| 🔐 安全熔断 | 安全扫描 fail | 立即停线 + 安全组介入 |

---

## 熔断回调 (Fuse Hooks)

每个熔断级别可注册回调:

```
onFuseLevel1: { notifyOwner, createTicket }
onFuseLevel2: { notifyCc, requestRCA, 2hDeadline }
onFuseLevel3: { lockDeploy, summonReview, freezeDeploy }
```

回调按顺序执行，任意回调失败 → 该级别 escalate

---

## 示例场景

### 场景 A: 同源测试连续失败

```
Round 1: @admin-web/user 登录流 E2E fail  ×1 → 正常派修
Round 2: @admin-web/user 登录流 E2E fail  ×2 → P1 标记审查 (2h RCA)
Round 3: @admin-web/user 登录流 E2E fail  ×3 → P0 停线熔断

通知链:
  Round 2 → #team-admin-web + @owner
  Round 3 → #prod-alert + @sre + @cto
```

### 场景 B: 不同源失败仅标记

```
Round 1: @api/user fail → 派修
Round 2: @admin-web/rate-limit fail → 派修 (不同源，仅标记)
Round 3: @storefront/payment fail → 派修 (不同源，仅标记)

输出: 聚合报告 (3 个失败，0 个熔断)
```

---

## 集成方式

### 脚本调用

```bash
# 触发熔断检查 (在 CI/CD 流水线中使用)
./scripts/fuse-check.sh --source="admin-web/user" --status="fail"

# 查看当前熔断状态
cat .fuse-state.json

# 手动重置熔断
./scripts/fuse-check.sh --reset --source="admin-web/user"
```

### CI/CD 集成

在 `turbo.json` 或 CI pipeline 每条测试/编译步骤后插入:

```json
{
  "dependsOn": ["^build"],
  "outputs": [],
  "onFail": {
    "script": "./scripts/fuse-check.sh --source={{TASK}} --status=fail"
  }
}
```

---

## 相关文件

| 文件 | 用途 |
|------|------|
| `.fuse-state.json` | 运行时熔断状态持久化 |
| `.audit-hash-chain` | 审计哈希链（与熔断联动使用） |
| `scripts/fuse-check.sh` | 熔断检测脚本 |
| `scripts/audit-freshness-check.sh` | 审计新鲜度检查（熔断前置步骤） |
| `scripts/alignment-verify.py` | 圈梁对齐 + 质量门禁（熔断输入源） |

---

## 历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v1 | 2026-06 | 初始版本 |
| v2 | 2026-07-14 | 规范熔断规则文档，增加同源/不同源定义、熔断体类型、回调钩子、集成方式 |
