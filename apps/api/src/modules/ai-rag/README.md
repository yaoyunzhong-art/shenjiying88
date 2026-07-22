# RAG 知识库模块 (ai-rag)

## 模块概述

RAG 知识库模块（编号 T114-2）是 shenjiying88 平台的检索增强生成（Retrieval-Augmented Generation）与智能话术生成子系统。该模块基于知识库文档管理、语义检索和 AI 话术生成三大核心能力，为销售、客服和教育培训场景提供精准的知识检索和话术辅助。

## 核心功能

- **知识库管理（Knowledge Base Manager）**：文档的增删改查（CRUD），支持文档分块（chunking）、向量化与元数据管理。
- **RAG 检索增强生成（RAG Pipeline）**：基于语义相似度检索相关文档分块，结合上下文生成精准回答，支持多集合检索源引用。
- **销售话术生成（Sales Script Generator）**：根据用户画像、产品信息和对话上下文，自动生成个性化的销售话术（支持专业/友好/紧迫三种语气，多语言）。
- **高级检索服务（Advanced RAG）**：混合检索（BM25 + 向量 + 知识图谱）、Cross-Encoder 重排序、检索结果融合、文档理解（摘要/实体抽取/问答对）。
- **多租户隔离**：所有 API 通过 `TenantGuard` 实现租户级数据隔离，支持跨集合检索。

## 目录结构

```
ai-rag/
├── README.md                              # 本文件
├── ai-rag.module.ts                       # NestJS 模块定义
├── ai-rag.controller.ts                   # REST API 控制器
├── ai-rag.service.ts                      # 核心服务（知识库/RAG/话术生成）
├── ai-rag-advanced.service.ts             # 高级检索与增强服务
├── ai-rag.entity.ts                       # 实体/类型定义
├── ai-rag.dto.ts                          # 请求/响应 DTO
├── ai-rag.controller.spec.ts              # 控制器单元测试
├── ai-rag.controller.test.ts              # 控制器集成测试
├── ai-rag.service.spec.ts                 # 服务单元测试
├── ai-rag.service.test.ts                 # 服务集成测试
├── ai-rag.service.deep.test.ts            # 服务深度测试
├── ai-rag.dto.test.ts                     # DTO 验证测试
├── ai-rag.entity.test.ts                  # 实体测试
├── ai-rag.module.test.ts                  # 模块注入测试
├── ai-rag.e2e.test.ts                     # E2E 测试
├── ai-rag.comprehensive.test.ts           # 综合测试
├── ai-rag.ringbeam.test.ts                # 圈梁测试
├── ai-rag.role.test.ts                    # 角色测试
├── ai-rag.role-scenario.test.ts           # 角色场景测试
├── ai-rag.role-extended.test.ts           # 角色扩展测试
├── ai-rag-ingestion.test.ts               # 文档导入测试
├── ai-rag-ingestion-plus.test.ts          # 文档导入增强测试
├── ai-rag-advanced.spec.ts                # 高级检索单测
└── ai-rag-validate.test.ts                # 验证测试
```

## 使用方法

### 知识库文档管理

```bash
# 创建文档
POST /api/ai-rag/documents
Content-Type: application/json

{
  "collection": "products",
  "title": "街机游戏 - 狼来了",
  "content": "狼来了是一款经典的儿童射击类街机游戏..."
}

# 检索文档
GET /api/ai-rag/documents/doc-001

# 删除文档
DELETE /api/ai-rag/documents/doc-001

# 获取集合统计
GET /api/ai-rag/collections/products/stats
```

### RAG 智能问答

```bash
POST /api/ai-rag/query
Content-Type: application/json

{
  "question": "如何重置游戏设备密码？",
  "collections": ["faq", "support"],
  "topK": 5
}
```

### 销售话术生成

```bash
POST /api/ai-rag/script
Content-Type: application/json

{
  "productName": "儿童射击乐园",
  "userProfile": {
    "age": 8,
    "interests": ["射击", "动物"],
    "visitFrequency": "weekly"
  },
  "tone": "friendly",
  "locale": "zh-CN",
  "context": {
    "previousScripts": [],
    "userObjections": []
  }
}
```

### 高级混合检索

```bash
POST /api/ai-rag/advanced/search
Content-Type: application/json

{
  "text": "街机设备常见故障",
  "filters": {
    "collection": "support"
  },
  "topK": 10,
  "searchStrategy": "hybrid",
  "minScore": 0.3
}
```

## 依赖说明

| 依赖 | 用途 |
|------|------|
| `@nestjs/common` | NestJS 核心装饰器 |
| `@nestjs/core` | NestJS 运行时 |
| `rxjs` | 响应式编程（控制器返回 Observable） |
| `class-validator` | DTO 请求参数校验 |
| `class-transformer` | DTO 类型转换 |
| `vitest` | 测试框架 |
| `reflect-metadata` | 装饰器元数据反射 |
| 租户守卫 (`agent/tenant.guard`) | 多租户隔离 |

