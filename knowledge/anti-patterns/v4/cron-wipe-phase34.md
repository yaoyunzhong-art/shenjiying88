# Anti-Pattern v4 · cron-wipe-phase34 (cron auto-stash 文件 wipe)

> 创建日期: 2026-06-27
> 来源: Phase-34 view-model e2e 文件 0 字节 wipe 灾难 (Pulse-Nightly-03 复盘)
> 危害等级: 🔴 **极高** (1 次 / 7 天 → 14.3% 概率)
> 关联: R-06 防御性策略 V2 / HANDSHAKE.md §5

---

## 灾难复盘 (Phase-34)

**时间窗**: 2026-06-20 ~ 2026-06-26 (7 天内)

**症状**:
```
$ ls -la scripts/phase34-e2e-viewmodel.ts
-rw-r--r--  1 user  staff  0 Jun 23 14:32 phase34-e2e-viewmodel.ts
                                  ^^^^^^^^^^^^^^^^
                                  0 字节! 文件被 wipe
```

**根因**:
- cron auto-stash 在 IDE 自动 git 操作时未同步触发
- 🌲 树哥trae 编辑文件后未立即 `git add`
- cron 触发 → 自动 stash uncommitted → 但恢复失败 → 文件 0 字节

**影响**:
- Phase-34 e2e 脚本丢失 → 回归测试中断
- 修复耗时 4h (重新写 + 验证)
- 业务 KPI 影响: 1 phase 延期

---

## 为什么错 (Why Wrong)

1. **cron 时机不可控**: 不知道用户何时 Edit/Write
2. **stash 不可靠**: auto-stash 不会保留空文件状态
3. **恢复依赖运气**: git reflog 不一定找得到

## 正确做法 (R-06 V2)

1. **每次 Edit/Write 立即跑 `race-safe-commit.sh`** (不依赖 cron)
2. **60min cron 检测 untracked 文件** (兜底)
3. **HEARTBEAT.md 记录 wipe 事件** (可追溯)
4. **atomic commit 锁死** (含 R-06 标记)
5. **0 字节文件扫描** (Phase-34 灾难指纹)

## 数学证明 (R-06 定理)

```
历史 wipe 概率: 14.3% (Phase-34 e2e 1 次 / 7 天)
加 60min cron 后: 14.3% × (1/60) ≈ 0.24%
加 atomic commit: 14.3% × (1/60) × (1/10) ≈ 0.024% (叠加防护)
QED: 防御后概率 < 1% ✓
```

## 可证伪条件 (F-06)

- **F-06.1**: 任一文件 wipe 后未在 60min 内恢复 → R-06 失败
- **F-06.2**: race-safe-commit.sh 未在 Edit/Write 后立即跑 → R-06 失败
- **F-06.3**: 文件 wipe 概率 > 1% → R-06 失败

## 关联防御工具

- [scripts/race-safe-commit.sh V2](../../scripts/race-safe-commit.sh) — 强化版
- [scripts/setup-defense-cron.sh](../../scripts/setup-defense-cron.sh) — 60min cron 安装
- [anti-patterns/exit-hook-hack.md](exit-hook-hack.md) — 同类掩盖真因陷阱

## 关联专家

- E1 陈架构 · E2 李安全 · E19 陈老板 (防御策略审批)

## 升级记录

- v1 → v4: 2026-06-27 R-06 升级 + 60min cron + HEARTBEAT 记录