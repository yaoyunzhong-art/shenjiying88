# Best Practice · Documentation Standards (文档规范)

> 创建: 2026-06-26 · Pulse-68 Day 2
> 强制: 🟢 P2
> 来源: 神机营知识库体系

---

## 1. 🎯 目标

文档可检索 + 易维护:
- ✅ 命名一致 (kebab-case)
- ✅ 结构一致 (章节模板)
- ✅ 链接有效 (内链 + 外链)
- ✅ 时效性 (日期 + 版本)

---

## 2. 📐 Markdown 章节模板

```markdown
# Title · 中文标题 (英文补充)

> 创建: YYYY-MM-DD · Phase-X Pulse-X
> 适用: 场景描述
> 来源: 引用的 lessons / patterns / decisions

---

## 1. 🎯 目标/问题

## 2. 📐 核心内容

## 3. ✅ 必须遵守

## 4. ❌ 反模式

## 5. 🧪 测试

## 6. 📊 监控

## 7. 🔗 关联文档

---

> 维护人: Role / 团队
> 更新: 触发条件
```

---

## 3. 📐 文件命名

| 类型 | 命名 | 示例 |
|---|---|---|
| Pattern | `kebab-case-pattern.md` | `quota-guard.md` |
| Best Practice | `kebab-case.md` | `error-handling.md` |
| Anti-Pattern | `kebab-case.md` | `synchronous-llm-call.md` |
| Decision Record | `DR-NNN-kebab-case.md` | `DR-001-multi-tenant.md` |
| Lessons Learned | `phase-NN.md` 或 `pulse-NN.md` | `phase-15.md`, `pulse-63.md` |
| Expert Insight | `E##-topic.md` | `E9-ai-insights.md` |

---

## 4. 📐 内链规范

```markdown
// ✅ 相对路径 + 文件名 (跨平台兼容)
[quota-guard.md](../patterns/quota-guard.md)
[DR-001](../decision-records/DR-001-multi-tenant-guard.md)

// ✅ 锚点链接
[Lesson 1](#lesson-1)

// ❌ 绝对路径
[/Users/yao/.../quota-guard.md]  // 不可移植
[file://quota-guard.md]         // 不工作
```

---

## 5. 📐 代码示例规范

```typescript
// ✅ 完整可运行示例
import { Injectable } from '@nestjs/common'

@Injectable()
export class ExampleService {
  async doWork() {
    // 业务逻辑
    return { success: true }
  }
}

// ❌ 残缺代码 (省略号过多)
// ... some code ...
```

---

## 6. 📐 中文 + 英文混排

- 中文为主,术语保留英文
- 标点:中文段落用中文标点(。,、),英文段落用英文标点(.,,)
- 代码块全部英文
- 注释尽量英文 (国际化)

---

## 7. ✅ 必须遵守

- [ ] 顶部 frontmatter (创建日期 / 适用 / 来源)
- [ ] 标准章节结构 (目标 / 核心 / 必须 / 反例 / 测试 / 监控 / 关联)
- [ ] 内链相对路径
- [ ] 代码示例完整
- [ ] 表格对齐 (markdown 对齐符)

---

## 8. 🔗 关联

- [knowledge/INDEX.md](../INDEX.md) · 知识库总览
