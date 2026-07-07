# Anti-Pattern: Wrapper 假设数据结构

**场景**: 设计嵌套 wrapper / decorator / adapter

## 错误示例

```typescript
// ❌ 错误: LongTermMemory 包装 AgentMemory 时丢失 createdAt
class AgentMemory {
  set(key, value, category, ttlMs) {
    this.store.set(key, {
      key, value, category,
      createdAt: now,  // ← 强制 now, 不保留外部传入的
      lastAccessedAt: now,
      accessCount: 0,
      ttlMs: ttlMs ?? this.defaultTtlMs,  // ← ttlMs=0 被 ?? 替换为默认
    });
  }
}

class LongTermMemory {
  store(entry) {
    const full = {
      ...entry,
      createdAt: entry.createdAt ?? now,  // ← 期望保留 entry.createdAt
      lastAccessedAt: now,
      accessCount: 0,
    };
    this.inner.set(full.key, full, full.category, full.ttlMs);
    // 但 AgentMemory.set 重新包装时:
    //   - createdAt 被覆盖为 now
    //   - ttlMs=0 被 ?? 替换
    // → full.createdAt 丢失!
  }
}

// 症状: 测试 "30 天前 importance 衰减一半" 失败
//   实际: createdAt=now, ageDays=0, decayed=1.0 (无衰减)
```

## 症状

- 时间字段被覆盖
- 0/false/null 被默认值替换
- 嵌套对象的属性访问不到

## 正确做法

```typescript
// ✅ 方案 1: 下层 wrapper 明确文档化
class AgentMemory {
  /**
   * @param value - the value to store (DO NOT include createdAt/lastAccessedAt;
   *                these are managed by AgentMemory)
   */
  set(key, value, category, ttlMs) {
    this.store.set(key, { key, value, category, createdAt: now, ... });
  }
}

// ✅ 方案 2: 上层不依赖下层,直接管理存储
class LongTermMemory {
  private readonly entries = new Map<string, LongTermMemoryEntry>();

  store(entry) {
    const full = { ...entry, createdAt: entry.createdAt ?? now };
    this.entries.set(full.key, full);  // 直接存,不再 wrap
  }
}

// ✅ 方案 3: 透传自定义时间字段
class AgentMemory {
  set(key, value, opts: { category?, ttlMs?, createdAt? } = {}) {
    this.store.set(key, {
      key, value,
      category: opts.category ?? 'context',
      createdAt: opts.createdAt ?? now,  // ← 接受外部 createdAt
      ttlMs: opts.ttlMs ?? this.defaultTtlMs,
    });
  }
}
```

## 关键原则

1. **wrapper 必须明确文档化**: value 结构 / 字段管理权
2. **0/false 是合法值**: 不要用 `??` 替换,只有 undefined 才用默认
3. **时间字段语义**: "现在"vs"用户指定"必须区分
4. **避免深层 wrap**: 1 层 wrapper 比 3 层更可控

## 关键修复

```typescript
// ❌ 错误: ttlMs ?? defaultTtlMs
const ttl = ttlMs ?? this.defaultTtlMs;  // ttlMs=0 变成 defaultTtlMs

// ✅ 正确: 检查 undefined
const ttl = ttlMs === undefined ? this.defaultTtlMs : ttlMs;
```

## Phase-23 来源

T89 long-term-memory.ts (重构: 移除 AgentMemory wrapper, 直接 Map 存储)
