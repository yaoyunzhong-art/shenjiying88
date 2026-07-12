# 🔧 科学修问题框架

## 问题分层（按影响面）

### 🔴 Tier 1: 阻断性问题（影响任何人使用）
1. health模块25fail → E2E DI依赖缺失（NestJS运行时可忽略）
2. admin-web 26页零测试 → 真实页面功能完全无验证

### 🟡 Tier 2: 质量债（影响可信度但不阻塞）
3. require()残留41文件 → @ts-nocheck掩盖
4. dangerouslySetInnerHTML 6处 → XSS可被利用
5. as any 4000+处 → Prisma mock类型抽象

### 🟢 Tier 3: 流程缺失（长期优化）
6. 专家参与0次 → 流程问题
7. 文档缺失 → 知识沉淀问题

## 根因分析

| 问题 | 根因 | 不是根因 |
|:-----|:-----|:---------|
| health 25fail | E2E需要redis/eventbus等外部服务 | 测试写得不好 |
| admin-web 0测试 | 26页是模板骨架，非真实功能页面 | 开发偷懒 |
| require()残留 | ESM migration时遗留 | 代码质量差 |
| dangerouslySetInnerHTML | 旧页面遗留写法 | 故意引入安全漏洞 |

## 修复优先级
1. XSS修复 → 6处 → 30min
2. 补admin-web测试 → 1个样板 + 26个冒烟 → 2h
3. require残留 → 已@ts-nocheck → 低优
4. health 25fail → 标记为known chronic
