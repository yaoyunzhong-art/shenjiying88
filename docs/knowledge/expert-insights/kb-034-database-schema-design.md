# 数据库Schema设计指南

> 分类: 技术架构 | 标签: 数据库, Schema设计, PostgreSQL, 迁移策略 | 适用: 后端开发, DBA

## 概述

数据库Schema是应用程序的数据基座，其设计质量直接影响系统的可维护性、查询性能和可扩展性。Schema设计中的糟糕决策——如缺乏索引、表结构未规范化、字段类型选择不当——会在系统发展到一定规模后成为难以回头的技术债务。Shenjiying88系统采用PostgreSQL 15作为主力数据库，结合TypeORM进行ORM映射，需要制定一套兼顾开发效率与运行性能的Schema设计规范。

良好的Schema设计应当经得起三个维度的检验：数据完整性(约束、外键、唯一性）、查询性能(合理的索引策略、分区策略）和可演进性(用迁移而非原地修改管理变更）。根据PostgreSQL性能白皮书的数据，适当的索引设计可以将查询性能提升100倍以上，而错误的索引设计则可能导致写入性能下降80%。

## 核心原则

- **原则1: 范式化到3NF，反范式化有充分理由**: 默认遵循第三范式，消除传递依赖。仅在明确需要优化的查询路径上引入反范式化，且以冗余字段+应用层一致性的方式维护。Shenjiying88在audit_reports表中冗余了audit_name字段，避免每次查询报告时都需要JOIN audits表。
- **原则2: 所有表必有主键和审计字段**: 每张表包含 `id`(UUID v4主键）、`created_at`(DEFAULT NOW()）、`updated_at`(触发器自动更新）、`deleted_at`(软删除标记）。UUID相比自增ID在分布式场景下无需中心化生成器，且避免了ID枚举攻击。
- **原则3: 索引策略前置于开发阶段**: 每张表在创建时预定义索引——主键索引(默认）、外键索引、查询过滤条件索引、排序字段索引。Shenjiying88的Schema Review Checklist中包含"每张表至少2个业务索引"的要求，避免上线后补索引造成停机。
- **原则4: 使用JSONB但不过度依赖**: 对于不确定Schema的元数据(如租户自定义字段）使用JSONB类型，但不可在JSONB字段上执行JOIN或作为过滤主条件。JSONB查询性能比普通列低3-5倍，仅适合存储附属性结构化数据。
- **原则5: 迁移即文档**: 所有Schema变更通过TypeORM Migration进行，而不是手动执行SQL。每次迁移都有对应的回滚脚本。迁移文件命名包含时间戳和变更描述，如 `1721190400000-AddAuditTemplateTable.ts`。

## 实践案例（基于shenjiying88项目）

- **案例1: 审计任务表的Schema设计**: `audits` 表包含 `id(UUID)`、`tenant_id`(外键 + 索引）、`project_id`(外键 + 索引）、`name`、`status`(枚举：pending/running/completed/failed）、`config`(JSONB存储审计配置参数）、`created_by`、`created_at`、`updated_at`、`deleted_at`。复合索引 (tenant_id, status）用于按租户和状态过滤审计任务列表，这是最高频的查询路径。

- **案例2: 软删除与数据归档**: 使用 `deleted_at` 字段实现软删除，所有业务查询默认添加 `WHERE deleted_at IS NULL` 条件。对于超过180天的已删除数据，通过定时任务迁移到 `audits_archive` 表，减少主表体积。主表数据量控制在500万行以下，超过阈值时触发分区或归档策略。

## 反模式警示

- **反模式1: 过度使用EAV(Entity-Attribute-Value）模式**: 试图用一个"万能表"存储所有业务实体。EAV虽然灵活，但查询复杂度高、类型安全缺失、索引效果差。正确的做法是使用具体的业务表 + JSONB扩展字段的组合。

- **反模式2: 生产中执行裸SQL变更**: 直接在生产数据库执行ALTER TABLE ADD COLUMN等操作，没有迁移流程、没有回滚预案。Shenjiying88要求所有变更必须通过PR提交迁移文件，经Code Review后由CI/CD自动执行，且必须包含回滚脚本。

## 参考文献

- PostgreSQL 15 Documentation — DDL Chapter
- Martin Kleppmann (2017) "Designing Data-Intensive Applications" — 第2章
- TypeORM Documentation — Migrations
- Bill Karwin (2010) "SQL Antipatterns"
