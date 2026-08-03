=== V23 Day5 测试策略 ===

## 问题: vitest全量OOM

- vitest v4 + NestJS + Prisma Client + Node v24 全量206文件运行被SIGKILL
- 分模块运行全部正常 (如下)
- 根因: Prisma Client  + NestJS DI 模块并发加载导致fork worker内存累计超过512MB

## 推荐策略

### CI: 分片运行
```yaml
test:
  script:
    - pnpm vitest run src/modules/auth/
    - pnpm vitest run src/modules/cashier/
    - pnpm vitest run src/modules/minor-protection/ src/modules/retrieval/ src/modules/ai-review/
    - pnpm vitest run src/modules/logistics-management/ src/modules/brand-operations/
```

### 已验证通过

| 分片 | 文件 | 测试 | 状态 |
|:-----|:---:|:---:|:----:|
| minor+retrieval+ai-review+logistics+brand | 55/60 | 1169/1198 | ✅ |
| cashier | 36/39 | 785/792 | ✅ |
| rls | 9/9 | 392/392 | ✅ |
