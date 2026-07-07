# Best Practice · Scaffolding Pattern (脚手架设计)

> 来源: Phase-19 / Pulse-19 / Pulse-68 等待期 实战沉淀
> 适用: 后台运维 / 新模块搭建 / 工具脚本初始化

## 一、核心原则

### 1. Type 优先 (接口先行)

```
✅ 先定义 .d.ts / interface / dto.ts 描述数据形态
✅ 再写骨架实现 (return 占位数据 / throw NotImplementedException)
❌ 跳过类型直接堆 if-else 业务逻辑
```

**理由**:
- 后续 E2E 测试可直接 import 类型,无需等实现
- Reviewer 通过类型就能理解模块边界
- 编译器帮忙兜底 (rename / refactor 安全)

### 2. 不实施,只搭骨架

```
✅ 函数签名完整,内部 return null / {}
✅ Service 方法只走 happy path 分支
❌ 不写 try-catch 边界 (留给实施 pulse)
❌ 不集成真实数据库 / 第三方 API
```

**理由**:
- 等待期产物 ≠ 可上线代码,实施阶段会全面重构
- 越简单的脚手架,后续 review 越快
- 减少 Pulse-19 → Pulse-71 之间的 merge conflict

### 3. TODO 标记必须可追溯

```typescript
// ✅ 推荐: TODO[Pulse-72]: 真实 upsert
upsert_qdrant_mock(chunks, vectors, qdrant_url) {
  // TODO[Pulse-72]: requests.put(f"{qdrant_url}/collections/code_chunks/points", json={...})
  return [chunks.length, 0];
}

// ✅ 推荐: FIXME(P0-007): 替换 regex AST 为 tree-sitter
const CLASS_RE = re.compile(...); // FIXME(P0-007): tree-sitter-typescript

// ❌ 不推荐: 裸 TODO,无法追踪
// TODO: optimize
```

**理由**:
- `TODO[Pulse-XX]` 可被 `grep -r "TODO\[Pulse-"` 一键列出
- 每个 TODO 关联到具体 Pulse 编号 → RFC → 评审记录
- 防止"无人认领的 TODO"成为技术债

### 4. Mock Fixture (而非 Mock Service)

```typescript
// ✅ 推荐: fixture 数据,贴近真实结构
export const CAMPAIGN_FIXTURE: Campaign = {
  id: 'fixture-campaign-001',
  tenantId: 'fixture-tenant',
  name: '[FIXTURE] 双 11 大促',
  status: 'active',
  startAt: '2026-11-01T00:00:00+08:00',
  endAt: '2026-11-11T23:59:59+08:00',
  budget: { total: 100000, spent: 0 },
};

// ❌ 不推荐: 运行时 mock (会污染测试)
// beforeEach(() => jest.spyOn(service, 'findAll').mockResolvedValue([]));
```

**理由**:
- Fixture 文件可被 e2e / unit / storybook 共用
- `[FIXTURE]` 前缀在生产 log 中一眼可识别
- 删 fixture 即恢复测试失败 → 防止"沉默通过"

## 二、模板片段

### NestJS Module 骨架

```typescript
// campaign.module.ts (Phase-XX 脚手架)
import { Module } from '@nestjs/common';
import { CampaignController } from './campaign.controller';
import { CampaignService } from './campaign.service';

@Module({
  controllers: [CampaignController],
  providers: [CampaignService],
  exports: [CampaignService],
})
export class CampaignModule {
  // TODO[Pulse-XX]: 接入 TenantModule / RedisModule / QueueModule
}
```

### Controller 骨架

```typescript
// campaign.controller.ts
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { CreateCampaignDto, CampaignResponseDto } from './campaign.dto';

@Controller('campaigns')
export class CampaignController {
  constructor(private readonly service: CampaignService) {}

  @Post()
  async create(@Body() dto: CreateCampaignDto): Promise<CampaignResponseDto> {
    // TODO[Pulse-XX]: 接入 quota guard
    return this.service.create(dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CampaignResponseDto> {
    return this.service.findOne(id);
  }
}
```

### Service 骨架 (happy-path only)

```typescript
// campaign.service.ts
import { Injectable } from '@nestjs/common';
import { CreateCampaignDto, CampaignResponseDto } from './campaign.dto';

@Injectable()
export class CampaignService {
  async create(dto: CreateCampaignDto): Promise<CampaignResponseDto> {
    // TODO[Pulse-XX]: 持久化到 Prisma campaign 表
    return {
      id: `stub-${Date.now()}`,
      ...dto,
      createdAt: new Date().toISOString(),
    };
  }

  async findOne(id: string): Promise<CampaignResponseDto> {
    // TODO[Pulse-XX]: Prisma campaign.findUnique({ where: { id } })
    throw new Error('NotImplemented');
  }
}
```

### Python 工具脚本骨架

```python
#!/usr/bin/env python3
"""
tool-name.py · 简短描述 (Pulse-XX 脚手架)

目标:
  - 一句话说明做什么

设计依据:
  - docs/research/xxx.md §X (链接 RFC)

⚠️  当前为骨架版本:
  - 实现部分使用 mock,留待 Pulse-XX 替换
  - --dry-run 模式可正常输出统计

用法:
  python3 scripts/tool-name.py                  # 正常执行 (mock)
  python3 scripts/tool-name.py --dry-run        # 只统计,不修改
"""
from __future__ import annotations
import argparse
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    parser = argparse.ArgumentParser(description="...")
    parser.add_argument("--dry-run", action="store_true", help="只读不写")
    # TODO[Pulse-XX]: 添加 --batch-size / --changed / --json 等参数
    args = parser.parse_args()

    # TODO[Pulse-XX]: 业务逻辑
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

## 三、与 Lint / CI 集成

脚手架常被 lint 卡住的几个点:

### 1. ESLint `no-unused-vars`

```typescript
// ❌ 脚手架里声明但未使用 → CI 红
const prisma = new PrismaClient(); // 还没用

// ✅ 加 eslint-disable 注释,标注 TODO
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const prisma = new PrismaClient(); // TODO[Pulse-XX]: 接入 campaign.entity
```

### 2. ESLint `require-await`

```typescript
// ❌ async 函数没 await
async create(dto: CreateCampaignDto) {
  return { id: 'stub', ...dto };  // 不需要 async
}

// ✅ 显式标注占位
async create(dto: CreateCampaignDto): Promise<CampaignResponseDto> {
  // TODO[Pulse-XX]: 接入持久化
  await Promise.resolve();  // 占位,避免 require-await 警告
  return { id: 'stub', ...dto };
}
```

### 3. TypeScript `noImplicitAny`

```typescript
// ❌ 脚手架里 metadata 类型模糊
metadata: dict = field(default_factory=dict)  // Python OK,TS 不行

// ✅ 显式 any + TODO
metadata: Record<string, unknown> = {}; // TODO[Pulse-XX]: 收紧类型
```

### 4. knowledge-lint 前置检查

提交前确保:
- `python3 scripts/lint-knowledge.py` 通过
- 新增的 .md 有完整 frontmatter (id / title / phase / pulse / tags / created)

## 四、团队协作

### 1. 脚手架评审清单 (PR Reviewer)

```
[ ] 类型定义完整 (dto / interface / enum)
[ ] 函数签名符合现有 module 风格
[ ] 所有 TODO 带 [Pulse-XX] 标签
[ ] Mock fixture 用 [FIXTURE] 前缀
[ ] 关键路径有 throw NotImplemented / return 占位
[ ] 没有混合实施代码 (happy path 之外)
[ ] Lint 通过 (ESLint + TSC + knowledge-lint)
```

### 2. 脚手架合并时机

```
✅ 允许: Phase 启动期 + Pulse-XX 脚手架 (RFC 通过后)
✅ 允许: 等待期优化 (mock 替换 / fixture 补全)
⚠️  谨慎: Phase 中段合并脚手架 (容易冲撞实施 PR)
❌ 禁止: Phase 末期 / 验收期合并脚手架 (应直接实施)
```

### 3. 与 RFC 联动

| RFC 状态 | 脚手架 PR 策略 |
|---|---|
| Draft | 不允许合并 |
| Voting | 允许合并 (标注 `[SCAFFOLDING-AWAITING-RFC]`) |
| Passed | 正常合并 |
| Blocked | 回退脚手架 |
| Finalized | 禁止新增脚手架,只能实施 |

### 4. Pulse-19 / Pulse-71 衔接示例

```bash
# Pulse-19: 提交脚手架
git commit -m "Pulse-19: RAG 脚手架 (Qdrant + index-codebase mock)"

# Pulse-71: 替换 mock 为真实实现
git commit -m "Pulse-71: 接入 OpenAI text-embedding-3-large (替换 embed_texts_mock)"
git commit -m "Pulse-72: 接入 Qdrant HTTP upsert (替换 upsert_qdrant_mock)"
git commit -m "Pulse-73: tree-sitter-typescript 替换 regex AST (替换 CLASS_RE/METHOD_RE)"
```

每次替换都对应 `TODO[Pulse-XX]` 解除,审计痕迹清晰。

## 五、反模式 (Anti-patterns)

详见 `knowledge/anti-patterns/`:
- `exit-hook-hack.md` · 不要在 hook 里强行绕过退出码
- `native-vs-app-prefix.md` · prefix 必须用统一规范
- `quota-increment-then-check.md` · 守卫位置错误导致配额漂移
- `strict-test-name-pattern.md` · 测试名不要加 `should` 前缀

## 六、关联文档

- [commit.md](./commit.md) · Commit message 规范
- [testing.md](./testing.md) · 测试分层 (e2e / integration / unit)
- [e2e-pattern.md](./e2e-pattern.md) · E2E 测试模板
- `knowledge/anti-patterns/` · 反模式清单
- `knowledge/decision-records/DR-005-rag-architecture.md` · RAG 架构决策
