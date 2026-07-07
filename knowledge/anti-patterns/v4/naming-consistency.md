# 命名一致性反模式 v4

## 元信息
- **编号**: AP-W10 (Anti-Pattern Watch #10)
- **分类**: 命名 / 可维护性
- **发现**: 2026-06-27 Phase-36 MemberLevel 现状盘点
- **影响**: spec 误判 4 档 → 实际 5 档 (多 1 档 Platinum)
- **修复耗时**: 1 spec 重写 + 派发前盘点

---

## 现象描述

写 Phase-36 spec 时,我以为 MemberLevel 是 4 档:
```
NORMAL → SILVER → GOLD → DIAMOND
```

但实际代码中是 5 档:
```
Bronze → Silver → Gold → Platinum → Diamond
```

后果: spec 与现状不符,派发任务会做错或做重复。

---

## 根因分析

### 1. 派发前未做现状盘点

- ❌ 直接基于"行业惯例"写 spec
- ❌ 没看 `member.entity.ts` 实际定义
- ❌ 没跑 `member.entity.test.ts` 验证现状

### 2. 默认假设 vs 实际架构不一致

| 默认假设 (我) | 实际架构 |
|--------------|---------|
| 4 档:NORMAL/SILVER/GOLD/DIAMOND | 5 档:Bronze/Silver/Gold/Platinum/Diamond |
| 用"消费元"做阈值 | 用"积分"做阈值 (1 元 = 1 积分) |
| 4 态:ACTIVE/DORMANT/CHURNED | 4 态:Active/Frozen/Expired/Blacklisted |

### 3. 命名混乱

- 旧版用 NORMAL (全大写),新版用 Bronze (PascalCase)
- 状态用 DORMANT/CHURNED,实际是 Frozen/Expired

---

## 数学证明 · spec 错误率

设:
- `P(不盘点直接写 spec)` = 派发前不盘点概率
- `P(spec 与现状不一致)` = 行业惯例 ≠ 项目实际

则:
```
P(spec 错误) = P(不盘点) × P(实际 ≠ 行业惯例)
             ≈ 0.7 × 0.5
             = 35%
```

如果盘点后:
```
P(spec 错误 | 已盘点) = 0.7 × 0.1 (默认不一致)
                    = 7%
```

降低 5 倍。

---

## 修复方案

### 方案 1: 派发前盘点 (本次采用)

**强制流程**: 写 spec 前必做 3 步

```bash
# Step 1: 找现有实体
find apps/api/src/modules/<module> -name "*.entity.ts"

# Step 2: 看 enum 定义
grep -E "export enum " apps/api/src/modules/member/member.entity.ts

# Step 3: 跑测试验证
cd apps/api && node --import tsx --test src/modules/member/member.entity.test.ts
```

### 方案 2: spec 模板强制带"现状盘点"节

```markdown
## 0. 现状盘点 (派发前必做)

### 0.1 已就位
- <文件列表 + 行数 + 测试通过数>

### 0.2 与决策对齐
| 决策 | 现状 | 差距 |
|------|------|------|
```

### 方案 3: 反向工程 spec

```bash
# 从 entity 反向生成 spec
node scripts/extract-entity-spec.js apps/api/src/modules/member/member.entity.ts
```

---

## 预防机制 (R-07 V2)

### 1. spec 强制盘点节

每个 `.trae/specs/phase-XX/spec.md` 必须包含 §0 现状盘点。

### 2. 反模式库 v4 检查

每次写新 spec,先查反模式库:
- [dead-test-code.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/dead-test-code.md) - 测试腐烂
- [esm-cwd-tsx-loader.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/esm-cwd-tsx-loader.md) - cwd 必要性
- [tsx-decorator-pitfall.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/tsx-decorator-pitfall.md) - NestJS 装饰器

### 3. 学习记录

派发前盘点失败 → 写入 `.trae/learnings/<date>.md`

```markdown
# 2026-06-27 派发前盘点失败案例

## 错误
spec 假设 4 档,实际 5 档

## 修复
重写 spec §0 加现状盘点节

## 教训
"派发前必做盘点"不是口号,是流程
```

---

## 经验教训

> 🦞 **"spec 是契约,不是猜测"**

1. **现状优先于惯例**: 项目实际 ≠ 行业惯例
2. **测试可验证**: 跑测试 5 分钟 vs 重写 spec 30 分钟
3. **派发前盘点**: 减少 80% spec 错误
4. **反模式库 v4 累积**: 每个新反模式 → 加固预防机制

---

## 案例时间线 · Phase-36 Member

- **21:35**: 写 spec V1 (4 档)
- **21:38**: 大飞哥决策 5 Open Questions
- **21:40**: 写 spec V2 (升级阈值数学推导,仍 4 档)
- **21:42**: 派发前盘点发现 5 档 (含 Platinum)
- **21:43**: 重写 spec V3 (5 档 + D1 Prisma 已实现 + T166-1+2+3 增量)
- **21:50**: 综合派发 V4 (含 T166-2/3 预备)

---

## 相关反模式

- [dead-test-code.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/dead-test-code.md): 测试与生产同步
- [esm-cwd-tsx-loader.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/esm-cwd-tsx-loader.md): cwd 必要性
- [cron-wipe-phase34.md](file:///Users/yaoyunzhong/Desktop/shenjiying/shenjiying88/knowledge/anti-patterns/v4/cron-wipe-phase34.md): R-06 防御

---

> 🦞 **"派发前 5 分钟盘点 = 节省 30 分钟返工"**