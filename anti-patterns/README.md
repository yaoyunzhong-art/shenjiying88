# 🚫 Anti-Patterns — 反模式记录

## 模块定位

`anti-patterns/` 目录记录 shenjiying88 项目开发过程中发现并修复的**反模式（Anti-Pattern）**案例。每个 `.md` 文件围绕一个具体的错误场景展开，包含：错误示例、症状表现、正确做法和关键教训。

目标是建立项目团队的 **"翻车档案馆"**，避免同类错误重复发生。

## 核心功能

- 📝 记录实际发生的反模式案例，附带可复现的代码片段
- ✅ 对比错误 vs 正确实现，提供即用型修正方案
- 🔍 标注来源（具体 issue / PR / commit），方便回溯上下文
- 🧠 提炼通用原则，形成团队编码共识

## 目录结构

```
anti-patterns/
├── README.md                          # 本文档
├── mock-byte-mismatch.md              # Mock 假数据违反算法规格
├── substr-no-word-boundary.md         # substr 匹配代替 word boundary
└── wrapper-assumes-structure.md       # Wrapper 假设数据结构
```

## 当前反模式一览

| 文件名 | 场景 | 核心教训 | 来源 |
|--------|------|----------|------|
| `mock-byte-mismatch.md` | 加密/hash 函数 Mock 字节数错误 | Mock 必须严格按真实算法字节数实现 | T81 |
| `substr-no-word-boundary.md` | NLP 子串匹配误识别 | 必须使用 `\b` word boundary | T92 |
| `wrapper-assumes-structure.md` | 嵌套 Wrapper 覆盖字段 | Wrapper 必须明确文档化字段归属；避免 `??` 吞掉 0/false | T89 |

## 使用方式

直接阅读对应的 `.md` 文件即可。推荐在 Code Review 阶段参考相关案例。

## 关键原则总结

1. **Mock 必须忠于真实实现**——算法字节数不能"差不多"
2. **NLP 匹配必须用 word boundary**——拒绝 `indexOf` 子串扫描
3. **Wrapper 必须明确接口契约**——谁管理哪些字段说清楚
4. **0/false 是合法值**——只用 `=== undefined` 做默认值判断，不用 `??`
5. **避免深层 Wrap**——1 层 wrapper 比 3 层更可控
