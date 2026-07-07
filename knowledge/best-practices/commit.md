# Best Practice · Commit Message (标准化提交)

> 创建日期: 2026-06-25

> 来源: 多 phase 经验沉淀

## 格式

```
<Pulse 编号>: <简短标题 (50 字内)>

<可选段落: 详细描述>

<可选段落: 关联 RFC / Phase / Expert>

<可选段落: 风险 / 注意事项>
```

## 示例

### ✅ 标准 Pulse commit
```
Pulse-65: V5.1 40 人专家团赋能开发机制 (E1-E40)

主要变更:
- experts/ 目录 + 40 个 E1-E40 档案
- docs/process/ 协作流程文档
- rfcs/voting/ RFC 投票跟踪

关联专家: 全部 V5.1 编制
```

### ✅ 单 phase commit
```
Phase-16F: FinanceService 接入 quota 守卫 (QuotaResourceKind.Invoice)

主要变更:
- tenant-quota.entity.ts: 扩展 enum + DEFAULT_TIER_QUOTAS + switch
- finance.service.ts: 头部守卫 + increment
- finance.module.ts: imports TenantModule
- finance-quota-integration.e2e.test.ts: 10 个 e2e 全绿

关联专家: E10(财务)
```

### ✅ Bug 修复 commit
```
Pulse-63 P0-002 修复: app-journey.test.ts 5 处 assertion 前缀错误

根因: 测试期望 native- 但实际 app-
修复: 5 处 assertion 前缀改为 app- / APP-

附加: 移除 process.on('beforeExit') hack
```

## 禁忌

### ❌ 不要写
```
update
fix
WIP
test
```

### ❌ 不要 emoji 开头 (除非 V5.1 文档)
### ❌ 不要超 72 字符行宽
### ❌ 不要无意义的 "ant 自动" commit 描述

## 自动化

可在 `commit-msg` git hook 中加 lint:
```bash
# .git/hooks/commit-msg
#!/bin/bash
MSG=$(cat $1)
if [[ ! "$MSG" =~ ^(Pulse-|Phase-|Hotfix|chore|docs|test) ]]; then
  echo "❌ Commit message 必须以 Pulse-/Phase-/Hotfix 开头"
  exit 1
fi
```

详见 [scripts/commit-lint.sh](../../scripts/commit-lint.sh)
