# shenjiying88

## Git Quick Start

- 安装团队 hooks：

```bash
bash scripts/install-hooks.sh --install
```

- 校验 hooks 状态：

```bash
bash scripts/install-hooks.sh --verify
```

- 使用 `基础开发11` 标准命令提交：

```bash
pnpm commit:f11 -- "type(scope): summary" [paths...]
```

- 详细规范见：
  - `docs/operations/foundation11-git-workflow.md`
  - `knowledge/best-practices/commit.md`
