# Anti-Pattern: substr 匹配代替 word boundary

**场景**: NLP 任务 - 实体抽取 / 关键词匹配 / 文本相似度

## 错误示例

```typescript
// ❌ 错误: 用 indexOf 子串扫描
function extractMentions(text: string, graph: KnowledgeGraph): EntityMention[] {
  for (const entity of graph.entities) {
    const lower = text.toLowerCase();
    const name = entity.name.toLowerCase();
    let idx = lower.indexOf(name);
    while (idx !== -1) {
      // 'Alice' 会被 'Alicee' / 'Malice' 误匹配
      mentions.push({ text: text.slice(idx, idx + name.length), entity });
      idx = lower.indexOf(name, idx + name.length);
    }
  }
}

// 测试失败案例:
//   "Alicee is here" → 误匹配为 "Alice"
//   "Malice aforethought" → 误匹配为 "Alice"
```

## 症状

- "Apple" 匹配 "Pineapple"
- "Cat" 匹配 "Category"
- "AI" 匹配 "AIM" / "MAIN"

## 正确做法

```typescript
// ✅ 正确: 用 word boundary regex
function extractMentions(text: string, graph: KnowledgeGraph): EntityMention[] {
  for (const entity of graph.entities) {
    const escaped = entity.name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');  // word boundary
    let match: RegExpExecArray | null;
    while ((match = regex.exec(text)) !== null) {
      mentions.push({
        text: text.slice(match.index, match.index + match[0].length),
        entity,
        span: { start: match.index, end: match.index + match[0].length },
      });
    }
  }
}

// "Alicee" 不再匹配 "Alice" (因为 \balice\b 要求 word boundary)
```

## 关键原则

1. **必须 word boundary**: NLP 任务统一用 `\b...\b`
2. **正则特殊字符转义**: `.` `*` `+` 等需要 `\\` 转义
3. **大小写不敏感**: 用 `i` flag
4. **重叠处理**: 维护 matched spans,跳过重叠的 matches

## Phase-23 来源

T92 entity-linking.ts (extractMentions 重构,Alicee → Alice bug 修复)
