# Automations · 自动化脚本库

> 创建日期: 2026-06-25
> 来源: extract-knowledge.py 自动补全
> 创建: Pulse-65 (2026-06-25)
> 目标: **把重复任务脚本化**,降低人工维护成本

---

## 📜 脚本列表

### 1. [extract-knowledge.py](./extract-knowledge.py) · 知识自动提取
**用途**: 从 phase retro + git log + debt.md 自动提炼 lessons / anti-patterns / decision-records

```bash
# 提取指定 phase
python3 scripts/extract-knowledge.py --phase 16

# 提取指定 pulse
python3 scripts/extract-knowledge.py --pulse 65

# 自动模式 (从 debt.md 扫描 P0/P1)
python3 scripts/extract-knowledge.py --auto
```

**输出**:
- `knowledge/lessons-learned/phase-XX.md`
- `knowledge/anti-patterns/anti-pattern-name.md`
- `knowledge/decision-records/DR-NNN-title.md`

### 2. [knowledge-stats.py](./knowledge-stats.py) · 知识库统计
**用途**: 统计 7 个子库的文件数 / 行数 / 增长趋势

```bash
# 输出到 stdout
python3 scripts/knowledge-stats.py

# 写入 markdown
python3 scripts/knowledge-stats.py --write docs/knowledge-stats.md

# 输出 JSON (给 CI/仪表板用)
python3 scripts/knowledge-stats.py --json
```

---

## 🔄 触发时机

| 触发事件 | 执行脚本 | 输出位置 |
|---|---|---|
| 每个 Phase 完成后 | `extract-knowledge.py --phase XX` | `lessons-learned/phase-XX.md` |
| 每个 Pulse 结束时 | `knowledge-stats.py` | `docs/knowledge-stats.md` |
| 每个 RFC 投票后 | (待写 `extract-decision.py`) | `decision-records/DR-NNN.md` |
| 每个 Bug 修复后 | (待写 `extract-antipattern.py`) | `anti-patterns/anti-pattern-XXX.md` |

---

## 🎯 设计原则

1. **幂等**: 已存在的文件不覆盖
2. **可审计**: 每次运行输出 changelog
3. **可调度**: 支持 CI / cron 触发
4. **可扩展**: 模板驱动,新主题不需改代码

---

## 📈 未来脚本 (待开发)

- `extract-decision.py` — RFC → DR-NNN.md
- `extract-antipattern.py` — Bug → anti-pattern-XXX.md
- `extract-pattern.py` — 重复出现的代码 → pattern-XXX.md
- `sync-experts.py` — 同步 expert feedback → knowledge/
- `lint-knowledge.py` — 检查知识库格式/链接

---

> 由 main agent 维护,新脚本请追加到本 README
> 下次审查: 每个 Stage 结束时
