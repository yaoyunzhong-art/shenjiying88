# WP-06 知识库 RAG · 验收卡

> **前缀**: `feat(rag): WP-06`  
> **工作包**: WP-06 (BS-0094~BS-0099)  
> **验收标准**: 三层检索、脱敏、采集、评分、老化全具备

---

## AC-1: 三类知识库 (BS-0094)

**验收项** | **标准**
---|---
AC-1.1 | `knowledge.entity.ts` `KnowledgeDocument` 增加 `scope: 'global' \| 'tenant' \| 'brand'` + `tenantId?` + `brandId?`
AC-1.2 | `POST /knowledge/index` 接受 `scope` 参数，scope=tenant/brand 时必填 tenantId/brandId
AC-1.3 | `POST /knowledge/query` 返回结果携带 scope 信息
AC-1.4 | scope 默认 'global'，已存数据迁移不影响
AC-1.5 | db-knowledge 的 `knowledge_documents` 表同步 scope 字段
AC-1.6 | unit test: 创建 global/tenant/brand 三类文档，按 scope 过滤查询验证隔离
AC-1.7 | unit test: tenantA 文档不出现在 tenantB 查询结果中

## AC-2: RAG 三层优先 (BS-0095)

**验收项** | **标准**
---|---
AC-2.1 | `CascadeRetriever` 实现 `retrieve(query, {tenantId, brandId}): RetrievedChunk[]`
AC-2.2 | 检索按 brand → tenant → global 降级级联
AC-2.3 | 每级返回 topK 结果，不足时继续上级查询
AC-2.4 | 去重合并: 同一 chunk 取 score 最高值，不重复出现
AC-2.5 | 返回结果携带 level 标记 (`'brand' \| 'tenant' \| 'global'`)
AC-2.6 | `POST /knowledge/query` 支持 `tiered: boolean` 参数开关
AC-2.7 | 非 tiered 模式保持原有单层行为
AC-2.8 | unit test: 三层各有若干文档，验证级联检索得到全部结果
AC-2.9 | unit test: brand 级已满足 topK 时，不请求 tenant/global
AC-2.10 | unit test: 三层空时返回空

## AC-3: 知识脱敏 (BS-0096)

**验收项** | **标准**
---|---
AC-3.1 | `DesensitizePipe` 实现手机号脱敏: `138****1234` 格式
AC-3.2 | 邮箱脱敏: `user***@example.com`
AC-3.3 | 身份证脱敏: `110***********1234`
AC-3.4 | 姓名脱敏: 保留姓，名掩码如 `张*`
AC-3.5 | API Key 脱敏: 复用 `encryption.util.ts` 的 `maskApiKey()`
AC-3.6 | 不修改原始存储，仅输出层过滤
AC-3.7 | 可配置化: `desensitize: boolean` (默认 true)
AC-3.8 | 脱敏规则配置白名单 (哪些字段不过滤)
AC-3.9 | unit test: 各脱敏规则正例
AC-3.10 | unit test: desensitize=false 时返回原始内容

## AC-4: 知识源自动采集 (BS-0097)

**验收项** | **标准**
---|---
AC-4.1 | `CollectorSource` 接口定义 `source \| collect(keyword, count) → RawKnowledgeItem[]`
AC-4.2 | V1 实现 WeiboCollector (mock 返回模拟数据)
AC-4.3 | V1 实现 DouyinCollector (mock)
AC-4.4 | V1 实现 XiaohongshuCollector (mock)
AC-4.5 | 采集结果自动调用 `indexDocument()` 入库，kind='doc', tags=['collected']
AC-4.6 | `collection_config` 表管理采集配置 (source/keyword/frequency/scope/enabled)
AC-4.7 | `collection_log` 表记录采集日志 (source/items_count/success/error/时间)
AC-4.8 | 采集接口 `POST /knowledge/collect` 接受 source/keyword/count
AC-4.9 | 采集配置 CRUD 接口
AC-4.10 | unit test: mock collector 返回数据并验证入库
AC-4.11 | unit test: 采集配置增删改查

## AC-5: 知识质量评分 (BS-0098)

**验收项** | **标准**
---|---
AC-5.1 | `QualityScorer` 实现 accuracy 评分 (基于 expert_vetted 比例)
AC-5.2 | timeliness 评分: `max(0, 1 - age/180)` 天
AC-5.3 | completeness 评分: (chunk_count / expected) + metadata_fill_rate
AC-5.4 | usage 评分: 基于引用次数/检索命中率 (归一化 0-100)
AC-5.5 | overall 权重公式: `accuracy*0.3 + timeliness*0.3 + completeness*0.2 + usage*0.2`
AC-5.6 | 新建文档默认 quality_score=70
AC-5.7 | 更新文档时重新评分
AC-5.8 | Cron 每日全量重算 (或: 每 24h 触发)
AC-5.9 | `knowledge_documents` 表存储 `quality_score` + `quality_detail` JSONB
AC-5.10 | 查询支持 `minQualityScore` 过滤
AC-5.11 | unit test: 各维度评分计算
AC-5.12 | unit test: 空数据/边界值 (age>180应得0分)

## AC-6: 知识老化管理 (BS-0099)

**验收项** | **标准**
---|---
AC-6.1 | `AgingManager` 实现状态机: `active → aging → under_review → (active | archived)`
AC-6.2 | `agingThresholdDays` 默认 180 天，超过自动标记 `status='aging'`
AC-6.3 | `autoArchiveDays` 默认 30 天，aging + quality_score<30 → status='archived'
AC-6.4 | 老化后触发 `QualityScorer` 重评
AC-6.5 | 老化通知管理接口 (列出待审查 aging 文档)
AC-6.6 | 审查操作: 重新验证 → status='active', reviewed_at/记录; 归档 → status='archived'
AC-6.7 | 与 empower-card 的 `applyDecay()` 共存: 文档层老化 + 卡片层新鲜度双轨
AC-6.8 | `knowledge_documents` 表增加 `status` / `reviewed_at` / `reviewer` 字段
AC-6.9 | Cron 每日检查老化文档
AC-6.10 | unit test: 模拟 age>180 文档自动标记 aging
AC-6.11 | unit test: quality<30 + aging>30天自动归档
AC-6.12 | unit test: 审查后重新激活/归档操作

## AC-7: 整体验收

**验收项** | **标准**
---|---
AC-7.1 | `apps/api/src/modules/knowledge/` 扩展完成、TSC 编译零错误
AC-7.2 | `apps/api/src/modules/empower-card/` 扩展完成、TSC编译零错误
AC-7.3 | 无 `test.skip` / `test.only`
AC-7.4 | 无已有功能重写 (`ai-rag.service.ts` / `knowledge-indexer.service.ts` 等保持不动)
AC-7.5 | 新建文件遵循项目命名风格: `*.service.ts` / `*.entity.ts` / `*.dto.ts`
AC-7.6 | all existing tests pass (已有测试不因本次改动而失败)
AC-7.7 | commit message prefix: `feat(rag): WP-06 BS-0094~BS-0099`
