# Best Practice · Dependency Management (依赖管理规范)

> 创建: 2026-06-26 · Pulse-68 Day 2
> 强制: 🟡 P1
> 来源: pnpm + monorepo + Phase-15+ 实战

---

## 1. 🎯 目标

依赖可控 + 安全:
- ✅ 版本锁定 (pnpm-lock.yaml)
- ✅ 漏洞扫描 (npm audit / snyk)
- ✅ 升级有节奏 (每月 minor)
- ✅ 内部依赖 monorepo 共享

---

## 2. 📐 pnpm workspace

```json
// pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

**优势**:
- 单一 lockfile (pnpm-lock.yaml)
- 软链接共享 (节省空间)
- 严格依赖隔离

---

## 3. ✅ 添加依赖

```bash
# 添加生产依赖
pnpm add @nestjs/common -w

# 添加到特定 workspace
pnpm add @anthropic-ai/sdk --filter @m5/api

# 添加开发依赖
pnpm add -D vitest --filter @m5/api

# 升级
pnpm update @nestjs/common -w
```

---

## 4. ✅ 版本策略

| 依赖类型 | 版本策略 | 示例 |
|---|---|---|
| 核心框架 | ^ (允许 minor) | `^10.0.0` |
| 工具库 | ^ | `^5.0.0` |
| 内部 packages | workspace:* | `workspace:*` |
| 安全关键 | exact (锁定) | `5.2.1` |

---

## 5. ✅ 安全扫描

```bash
# 每周 CI 自动跑
pnpm audit --audit-level=high
pnpm snyk test  # (可选,Phase-22 接入)
```

**策略**:
- 高危漏洞 → 24h 内修复
- 中危 → 7 天内修复
- 低危 → 下次升级周期

---

## 6. ✅ 升级节奏

| 类型 | 频率 | 评估 |
|---|---|---|
| 安全补丁 | 立即 | 不破坏 API |
| minor 升级 | 每月 | 测试通过 |
| major 升级 | 每季 | RFC + 完整回归 |

---

## 7. ❌ 反模式

- ❌ `*` 通配版本 (不可控)
- ❌ 升级未测试直接合 main
- ❌ 长期不升级 (技术债累积)
- ❌ 多 lockfile (冲突)

---

## 8. 🔗 关联

- [security-checklist.md](./security-checklist.md) · 漏洞修复
- [database-migration.md](./database-migration.md) · 库版本变更
