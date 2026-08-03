# WP-06 知识库 RAG · PRD

> **工作包**: WP-06 (BS-0094~BS-0099)  
> **优先级**: P1  
> **前置**: WP-02A (多租户) · WP-03A (AI 中台)  
> **当前状态**: 部分已有模块，需补齐三层检索、脱敏、采集、评分、老化闭环

---

## 1. 现状分析

### 1.1 已有模块盘点

| 模块 | 定位 | 关键能力 | 不足 |
|------|------|---------|------|
| `ai-rag` | RAG 知识库 + NLP 话术 | 文档 CRUD、关键词检索、话术生成、高级混合检索 (BM25+向量+KG模拟) | 纯内存、mock embedding (128维)、tenant 无隔离 |
| `knowledge` | 知识库索引引擎 | Markdown chunking、256维 mock embedding、cosine 检索、多格式文档解析、检索评估 (Recall/MRR/NDCG) | 纯内存、无持久化、无脱敏、无采集 |
| `empower-card` | 赋能知识卡片 | PostgreSQL CRUD、新鲜度曲线、引用计数、衰减、派单匹配 | 卡片粒度、完整老化无 6 月阈值审查 |
| `db-knowledge` | 数据库知识库 | PostgreSQL 全文搜索、8 张表 (文档/专家/脉冲/模式/阶段/简报/竞品/日志) | 全文搜索而非语义搜索、无脱敏 |

### 1.2 BS 覆盖缺口

| BS | 要求 | 当前覆盖 | 缺口 |
|----|------|---------|------|
| BS-0094 | 三类知识库 (全局/租户/品牌) | `collection` / `kind` / `tag` 概念存在但无多租户层级 | 无 tenant_id/store_id 字段隔离，无三级分库 |
| BS-0095 | RAG 三层优先 (全局→租户→品牌) | 无 | 无级联检索、无 fallback 策略 |
| BS-0096 | 知识脱敏 (检索结果自动脱敏) | 无 | 无脱敏管道 |
| BS-0097 | 知识源自动采集 (微博/抖音/小红书) | 无 | 无采集框架 |
| BS-0098 | 知识质量评分 (准确性/时效性/完整性) | 仅有 cosine similarity | 无多维评分体系 |
| BS-0099 | 知识老化管理 (>6月标记审查) | empower-card 有 freshnessScore + applyDecay | 无6月阈值、无审查工作流、无统一老化引擎 |

---

## 2. 架构方案

### 2.1 总体架构

```
┌─────────────────────────────────────────────────┐
│                 API Gateway                      │
├─────────────────────────────────────────────────┤
│              Knowledge RAG Service               │
├───────────┬──────────┬──────────┬────────────────┤
│  Retriever │  Tiered   │ Desensit │ Quality       │
│  三层     │  Serarch  │ -ization │ & Aging       │
│  Collection│  Cascade │ Pipeline │ Engine         │
├───────────┴──────────┴──────────┴────────────────┤
│           Storage Layer (PG + Vector)            │
│   global_knowledge │ tenant_knowledge │ brand_kb  │
└─────────────────────────────────────────────────┘
```

### 2.2 模块职责

| 组件 | 职责 | 所在模块 |
|------|------|---------|
| **TieredCollection** | 全局/租户/品牌三层知识库管理，含 scope 标签 | `knowledge` |
| **CascadeRetriever** | 品牌→租户→全局 级联降级检索 | `knowledge` |
| **DesensitizePipe** | 检索结果自动脱敏 (Phone/Email/ID/Name/Key) | `knowledge` |
| **KnowledgeCollector** | 知识源采集调度 (微博/抖音/小红书 爬虫接口) | 新建 `collection` 模块或并入 `ai-rag` |
| **QualityScorer** | 知识质量评分 (准确性/时效性/完整性) | `knowledge` |
| **AgingManager** | >6月标记审查 + 自动丢弃低质量 + 通知 | `empower-card` + `knowledge` |

---

## 3. BS-0094 ~ BS-0099 详细设计

### BS-0094: 三类知识库 (全局/租户/品牌)

**目标**: 建立 `global → tenant → brand` 三层知识库分离

**设计要点**:
1. `knowledge_documents` 表增加 `scope` 字段:
   - `scope` ENUM: `'global' | 'tenant' | 'brand'`
   - `tenant_id` UUID (scope=tenant/brand 时必填)
   - `brand_id` UUID (scope=brand 时必填)
2. `knowledge.entity.ts` `KnowledgeDocument` 增加 scope/tenantId/brandId
3. 文档 CRUD 接口增加 scope 参数: `POST /knowledge/index?scope=tenant&tenantId=xxx`
4. db-knowledge 同步 scope 字段
5. 已有数据默认 scope='global', tenant_id=NULL, brand_id=NULL

**已有模块利用**:
- `knowledge-indexer.service.ts` 的 `chunkDocument()` / `indexDocument()` 保持不变，入参增加 scope 参数
- `ai-rag.entity.ts` `CollectionType` 扩展为 `{GLOBAL, TENANT, BRAND}` 三层集合
- `db-knowledge.service.ts` 的 `search()` SQL 增加 `scope` / `tenant_id` / `brand_id` 过滤条件

### BS-0095: RAG 三层优先 (全局→租户→品牌)

**目标**: 查询时按 "品牌知识 → 租户知识 → 全局知识" 级联检索

**设计要点**:
1. **CascadeRetriever** 实现 `retrieve(query, {tenantId, brandId})`:
   - Step 1: 查询 `brand` 级知识 (scope=brand, brand_id=给定值)，若 topK 不足或 minScore 不够，继续
   - Step 2: 查询 `tenant` 级知识 (scope=tenant, tenant_id=给定值)，补充结果
   - Step 3: 查询 `global` 级知识，补充结果
   - 去重合并: 按 score 降序，相同 chunk 去重
2. 返回结果携带 `scope` 来源，用于脱敏和评分
3. 接口: `POST /knowledge/query` 增加 tiered:boolean

**已有模块利用**:
- `knowledge.service.ts` 的 `query()` — 扩展支持 cascade flag
- `ai-rag/ai-rag-advanced.service.ts` 的 `hybridSearch()` — 嵌入级联层
- `empower-card` 的 `search()` — 保留单层，但 tag 可区分 scope

### BS-0096: 知识脱敏 (检索结果自动脱敏)

**目标**: 检索结果自动对敏感信息掩码

**设计要点**:
1. **DesensitizePipe** 管道处理:
   ```
   手机号: 138****1234
   邮箱: user***@example.com
   身份证: 110***********1234
   姓名: 张*
   API Key: sk-***-xxxx
   IP: 192.168.*.*
   ```
2. 正则匹配+替换，不影响原始存储，仅输出层脱敏
3. 配置化: 可开启/关闭脱敏、配置脱敏字段白名单
4. 接口: `POST /knowledge/query` 增加 `desensitize:boolean` (默认 true)

**已有模块利用**:
- 复用 `apps/api/src/modules/ai-model-config/encryption.util.ts` 的 API Key 脱敏逻辑
- 知识层输出统一经 DesensitizePipe 处理

### BS-0097: 知识源自动采集 (微博/抖音/小红书)

**目标**: 建立知识采集框架，支持微博/抖音/小红书

**设计要点**:
1. **KnowledgeCollector** 抽象采集器接口:
   ```typescript
   interface CollectorSource {
     source: 'weibo' | 'douyin' | 'xiaohongshu'
     collect(keyword: string, count: number): Promise<RawKnowledgeItem[]>
   }
   ```
2. V1 实现: 模拟采集（给定 keyword 返回 mock 数据，标记 `collected: true`）
3. V2 对接真实 API: 预留 `CollectorPlugin` 插槽
4. 采集结果自动调用 `indexDocument()` 入库
5. 采集配置: 频率、关键词、白名单/黑名单
6. 采集日志: 记录每次采集的 source/时间/条数

**已有模块利用**:
- 采集结果走 `knowledge-indexer.service.ts` 的 `indexDocument()` 入库
- 采集配置存储在 `empower-card` 或新建 `collection_config` 表
- 采集日志复用 `empower-card` 的引用日志模式

### BS-0098: 知识质量评分 (准确性/时效性/完整性)

**目标**: 多维评分体系驱动知识质量提升

**设计要点**:
1. **QualityScorer** 提供多维评分:
   - `accuracy`: 基于验证次数/专家审核
   - `timeliness`: 基于 1 - (now - createdAt) / 180days
   - `completeness`: 基于 chunk 数/元数据填充率
   - `usage`: 基于引用次数/检索命中率
   - `overall`: 加权汇总
2. 评分触发时机:
   - 新建知识: 默认 70 分
   - 更新知识: 重新评分
   - 定期 (每日 Cron): 全量重算
   - 引用/验证: 动态上调
3. 评分存储: `knowledge_documents` 表增加 `quality_score` / `quality_detail` JSONB
4. 查询可加 `minQualityScore` 过滤

**已有模块利用**:
- 复用 `retrieval-eval.ts` 的评估框架
- `empower-card` 的 `confidence` 字段作为 timeliness 维度的一部分

### BS-0099: 知识老化管理 (>6月标记审查)

**目标**: 超过 6 个月的旧知识标记审查或自动下架

**设计要点**:
1. **AgingManager**:
   - `6月阈值`: createdAt > 180 days → status = 'aging'
   - `审查流程`: aging 知识进入审查队列
   - `自动丢弃`: quality_score < 30 且 aging > 30 天 → auto-delete
   - `通知`: 通知管理员审查
2. 状态机: `active → aging → under_review → ( re-verified → active | archived )`
3. 与 empower-card 的 `applyDecay()` 整合:
   - empower-card 的 `freshnessScore` 作为 timeliness 指标
   - 全面老化引擎接管: `knowledge_documents.status` + `empower_card.freshnessScore` 双轨
4. 配置: `agingThresholdDays` (默认 180), `autoArchiveDays` (默认 30)

**已有模块利用**:
- `empower-card` 的 `applyDecay()` 保留为卡片层老化
- 文档层老化扩展 `knowledge_documents` 表增加 `status` / `reviewed_at` / `reviewer` 字段
- 老化后评分变化联动 `QualityScorer` 重新评估

---

## 4. DB 迁移

### knowledge_documents 表 ALTER

```sql
ALTER TABLE knowledge_documents
  ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'global'
    CHECK (scope IN ('global', 'tenant', 'brand')),
  ADD COLUMN IF NOT EXISTS tenant_id UUID,
  ADD COLUMN IF NOT EXISTS brand_id UUID,
  ADD COLUMN IF NOT EXISTS quality_score INT DEFAULT 70
    CHECK (quality_score >= 0 AND quality_score <= 100),
  ADD COLUMN IF NOT EXISTS quality_detail JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'aging', 'under_review', 'archived')),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewer TEXT;

-- 迁移: 已有数据设为 global
UPDATE knowledge_documents
  SET scope = 'global', quality_score = 70, status = 'active'
  WHERE scope IS NULL;

-- 索引
CREATE INDEX IF NOT EXISTS idx_knowledge_scope ON knowledge_documents (scope);
CREATE INDEX IF NOT EXISTS idx_knowledge_tenant ON knowledge_documents (tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_knowledge_brand ON knowledge_documents (brand_id) WHERE brand_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_knowledge_quality ON knowledge_documents (quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_knowledge_status ON knowledge_documents (status);
```

### collection_config 表 (新建)

```sql
CREATE TABLE IF NOT EXISTS collection_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL CHECK (source IN ('weibo', 'douyin', 'xiaohongshu')),
  scope TEXT NOT NULL DEFAULT 'global',
  tenant_id UUID,
  brand_id UUID,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  frequency TEXT NOT NULL DEFAULT 'daily'
    CHECK (frequency IN ('hourly', 'daily', 'weekly', 'manual')),
  enabled BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### collection_log 表 (新建)

```sql
CREATE TABLE IF NOT EXISTS collection_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  keyword TEXT,
  items_count INT DEFAULT 0,
  success BOOLEAN DEFAULT TRUE,
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. 不允许变更的已有功能

以下已有能力必须保留，不允许重写:

1. `ai-rag.service.ts` 的全部 CRUD / RAGPipeline / SalesScriptGenerator 逻辑
2. `knowledge-indexer.service.ts` 的 `chunkDocument()` / `embed()` 逻辑
3. `knowledge.service.ts` 的全部接口签名
4. `empower-card.service.ts` 的全部 CRUD / decay / quote 逻辑
5. `db-knowledge.service.ts` 的全部现有接口
6. 已有 test 文件不允许添加 `test.skip` / `test.only`
