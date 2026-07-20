# 🛠 知识赋能 Manual 注入模板
> ADR-045 科学知识体系 V2 · 降级注入手册  
> 当 dispatch-knowledge.ts 的 API/DB 模式都不可用时使用

---

## 用法总览

```
dispatch-knowledge.ts 派单匹配流程:

API 优先 ──→ POST /api/empower-cards/match (NestJS 8098)
  ↓ 失败
DB 直连 ──→ PostgreSQL (seed-empower-cards.sql 导入)
  ↓ 失败
Manual 降级 ──→ 人工匹配 + 结构化注入 (本文档)
```

---

## 场景判断

| 模式 | 触发条件 | 典型状态 |
|:----|:---------|:---------|
| API | NestJS 运行在 8098，empower-card controller 就绪 | ✅ 默认启用 |
| DB  | PostgreSQL 连接可达，empower_card 表存在 | ✅ 自动降级 |
| Manual | 以上都不可用 + 本地需快速注入 | ✅ 需手动操作 |

---

## Manual 注入模板

### 模板 A: SQL 直接注入
在 `scripts/seed-empower-cards.sql` 追加：

```sql
-- ============================================================
-- 手动注入: [模块名] — [日期]
-- 描述: [一句话说明]
-- ============================================================
INSERT INTO empower_card (tag, summary, source, module_mapping, freshness_score, confidence, quote_count, last_quoted_at)
VALUES
('技术', '[简明知识摘要(≤140字)]', '[来源说明]', '[模块映射 P-XX]', 100, 90, 0, NOW()),
('竞品', '[竞品洞察摘要(≤140字)]', '[来源说明]', '竞品分析', 80, 70, 0, NULL),
('市场', '[市场洞察摘要(≤140字)]', '[来源说明]', '市场分析', 85, 65, 0, NULL)
ON CONFLICT DO NOTHING;
```

### 模板 B: API 手动注入
当 API 可用但 dispatch 脚本无法自动匹配时，通过 curl 注入：

```bash
# 注入一条知识卡片
curl -X POST http://127.0.0.1:8098/api/empower-cards \
  -H 'Content-Type: application/json' \
  -d '{
    "tag": "技术",
    "summary": "简明知识摘要(≤140字)",
    "source": "来源说明",
    "moduleMapping": "P-XX"
  }'

# 批量注入
for card in \
  '{"tag":"技术","summary":"摘要1","source":"来源","moduleMapping":"P-XX"}' \
  '{"tag":"竞品","summary":"摘要2","source":"来源","moduleMapping":"竞品分析"}'; do
  curl -s -X POST http://127.0.0.1:8098/api/empower-cards \
    -H 'Content-Type: application/json' \
    -d "$card"
done
```

### 模板 C: 手动匹配输出 (dispatch-knowledge.ts 降级时的输出格式)
当脚本以手动模式运行且无法匹配时，输出此占位格式供人工粘贴到派单 prompt：

```
📚 知识赋能参考（降级·manual）:
- [技术] 简明知识摘要 (来源, 新鲜度100/可信度90)
- [竞品] 竞品洞察摘要 (来源, 新鲜度80/可信度70)
---
```

---

## 快速启动检查清单 ✅

### dispatch-knowledge.ts 脚本状态
| 检查项 | 状态 | 说明 |
|:-------|:----:|:-----|
| 文件存在 | ✅ | `scripts/dispatch-knowledge.ts` |
| Shebang 正确 | ✅ | `#!/usr/bin/env tsx` |
| 调用方式 | ✅ | `tsx scripts/dispatch-knowledge.ts <模块名> [关键词...]` |
| API 模式 | ✅ | 默认: POST http://127.0.0.1:8098/api/empower-cards/match |
| DB 降级 | ✅ | 直连 PostgreSQL 127.0.0.1:5432/shenjiying |
| Manual 降级 | ✅ | 输出占位格式供人工粘贴 |

### empower_card 数据库初始化
| 检查项 | 状态 | 说明 |
|:-------|:----:|:-----|
| 迁移脚本 | ✅ | `apps/api/src/database/migrations/20260719_create_empower_card_tables.sql` |
| 种子数据 | ✅ | `scripts/seed-empower-cards.sql` (14条初始卡片) |
| API 模块 | ✅ | `apps/api/src/modules/empower-card/` (controller/service/entity/module) |
| API 路由 | ✅ | `POST /api/empower-cards/match` — 派单自动匹配 |
| API 路由 | ✅ | `POST /api/empower-cards` — 创建卡片 |
| API 路由 | ✅ | `POST /api/empower-cards/:id/quote` — 引用记录 |
| API 路由 | ✅ | `POST /api/empower-cards/decay` — 退化曲线 |
| API 路由 | ✅ | `GET /api/empower-cards/stats/today` — 赋能评分 |

### 首次部署 DDL
```sql
-- 若 empower_card 表不存在，执行迁移
\i apps/api/src/database/migrations/20260719_create_empower_card_tables.sql

-- 导入种子数据
\i scripts/seed-empower-cards.sql
```

---

## 最佳实践
1. **摘要 ≤140 字**: 保持简洁，便于展示和搜索
2. **标签标准化**: 技术/竞品/市场/用户/合规/设备/会员/运营/选址
3. **module_mapping 精准**: P-XX / 竞品分析 / 用户研究 / 全模块
4. **新鲜度评分**: 新鲜 ≤7天 = 100, ≤30天 = 80, >30天 = 50
5. **可信度评分**: 官方标准=95, 成熟模式=90, 行业报告=70, 竞品猜测=60
6. **及时引用**: 每次引用记得调用 `POST /api/empower-cards/:id/quote` 记录
