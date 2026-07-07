# 基础开发11 Git 提交流程

## 目标

本规范用于 `基础开发11` 主线与挂载子线，统一解决 3 个问题：

- 所有开发完成的代码必须被完整采集留存
- 所有提交必须具备统一格式、可追溯来源和验证结果
- 本地开发、自动提交、远端校验必须形成闭环，避免“代码已写但未规范落盘”

## 适用范围

- `基础开发11` 全部主线任务
- `apps/*`
- `packages/*`
- `apps/api/src/modules/*`
- `.trae/specs/*`
- `docs/*`

## 本次核查结论

- 仓库当前已有本地 `hooks + commit-lint + race-safe-commit` 机制
- 现状问题不在“完全没有规范”，而在“规范分散、入口不统一、远端校验不足”
- 主要缺口：
  - 根目录缺统一入口文档
  - 缺 `基础开发11` 专用强制提交命令
  - 缺远端 GitHub Actions 提交/PR 标题治理
  - 自动提交脚本存在 `--no-verify` 兜底，容易削弱规范

## 强制提交规则

### 1. 强制提交时机

以下情况必须执行一次本地 Git 提交：

- 一个明确任务完成后
- 一轮代码修改通过定向测试后
- 一轮问题修复收口后
- 一轮文档/规范更新收口后
- 睡眠、切阶段、切主线前

禁止出现以下状态长期悬空：

- 代码已修改但未提交
- 测试已通过但未提交
- 文档已更新但未提交
- 多个不相关任务混在同一提交里

### 2. 基础开发11标准命令

基础开发11统一使用以下命令提交：

```bash
pnpm commit:f11 -- "type(scope): summary" [paths...]
```

示例：

```bash
pnpm commit:f11 -- "fix(loyalty): map plan errors to business exceptions" apps/api/src/modules/loyalty/loyalty.service.ts apps/api/src/modules/loyalty/loyalty.service.test.ts apps/api/src/modules/loyalty/loyalty-plan.e2e.test.ts
```

若需要整轮改动全部入库：

```bash
pnpm commit:f11 -- "docs(ops): add foundation11 git workflow" --all
```

### 3. 提交前校验

提交前必须满足：

- hooks 已安装并生效
- commit message 通过 `scripts/commit-lint.sh`
- 本轮目标文件已明确，不混入无关文件
- 关键改动已完成最小验证

推荐顺序：

```bash
bash scripts/install-hooks.sh --verify
pnpm test
pnpm commit:f11 -- "feat(scope): summary" [paths...]
```

## 提交信息规范

首行必须使用以下前缀之一：

- `Pulse-XX`
- `Phase-XX`
- `Hotfix`
- `feat`
- `fix`
- `docs`
- `test`
- `refactor`
- `chore`
- `perf`
- `build`
- `ci`
- `style`

同时满足：

- 首行长度不超过 `72` 字符
- 禁止无语义标题，如 `update`、`fix`、`WIP`
- 禁止多个不相关任务混在一个标题里

推荐格式：

```text
type(scope): summary
```

示例：

```text
fix(loyalty): map plan errors to business exceptions
feat(campaign): register trigger service in module
docs(ops): add foundation11 git workflow
```

## 标准流程

### 本地开发流程

1. 明确本轮任务边界
2. 完成代码与测试
3. 运行最小必要验证
4. 使用 `pnpm commit:f11` 提交
5. 记录验证结果和提交号

### 自动提交流程

自动提交只用于“防止代码丢失”，不替代正式任务收口提交：

- `race-safe-commit.sh` 用于保护脏工作区
- 自动提交不等于任务完成
- 自动提交后，仍需补一次正式任务提交，说明本轮完成项与验证结果

## 强制校验机制

### 本地

- `scripts/install-hooks.sh` 负责安装 `.githooks`
- `.githooks/commit-msg` 调用 `scripts/commit-lint.sh`
- `pnpm commit:f11` 会在提交前再次主动执行 lint

### 远端

- GitHub Actions 必须校验：
  - PR 标题格式
  - push 中新增提交的 commit message 格式
- 不通过则阻止合并

## 禁止事项

- 禁止 `git commit --amend` 覆盖既有任务提交
- 禁止长期依赖 `--no-verify`
- 禁止把无关文件混入主线提交
- 禁止不跑验证直接提交“已完成”
- 禁止跳过 hooks 安装直接进入主线开发

## 恢复与补救

### 发现未提交代码

- 立即按任务边界拆分
- 补跑最小验证
- 使用 `pnpm commit:f11` 补提交

### 发现自动提交但无正式提交

- 保留自动提交不回滚
- 追加一次正式提交，明确：
  - 本轮任务
  - 影响文件
  - 验证结果

### 发现历史存在规范缺失

- 不强行改写历史
- 从当前开始按 `基础开发11` 规则执行
- 在 handoff 或 retro 中记录规范偏差和修复动作

## 验收标准

满足以下 5 项才算 Git 流程闭环：

- 有统一入口文档
- 有统一强制提交命令
- 有本地 hooks 校验
- 有远端 workflow 校验
- 有任务完成即提交的执行纪律

## 快速检查

```bash
bash scripts/install-hooks.sh --verify
git status --short
pnpm commit:f11 -- "docs(ops): add foundation11 git workflow" docs/operations/foundation11-git-workflow.md
```
