# Tenant LLM 租户 LLM 配置

> 租户大模型配置管理服务，支持 LLM 配置的 CRUD。在 ShenjiYing 的多租户 AI 平台中，每个租户可以独立管理其对接的大语言模型配置，包括模型供应商选择（OpenAI、Claude、通义千问等）、模型参数调优、API Key 管理以及额度控制。此模块是租户 AI 能力接入的核心配置中心。

## 功能

- **租户 LLM 配置管理 (CRUD)** — 完整的 LLM 供应商与模型配置生命周期管理，支持多供应商共存、配置级联覆盖（系统级 → 租户级 → 应用级）
- **配置详情查询** — 支持按租户、按供应商、按模型粒度查询配置详情，提供配置校验接口验证 API Key 有效性与模型可达性
- **多供应商支持** — 预置主流 LLM 供应商集成模板（OpenAI、Anthropic Claude、阿里通义千问、百度文心、智谱 GLM），租户可自定义供应商接入点
- **模型参数模板** — 提供常用的模型参数预设模板（如温度、Top P、最大 Token 数），支持租户保存自定义参数组合，提升重复配置效率
- **密钥安全存储** — API Key 等敏感信息加密存储，支持密钥轮换与到期提醒

## API

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /tenant-llm/configs | 配置列表（支持供应商、模型、租户过滤） |
| GET | /tenant-llm/configs/:id | 配置详情 |
| POST | /tenant-llm/configs | 创建配置 |
| PUT | /tenant-llm/configs/:id | 更新配置 |
| DELETE | /tenant-llm/configs/:id | 删除配置 |
| POST | /tenant-llm/configs/:id/validate | 校验配置连通性 |

## 技术栈

- **NestJS** — 基于装饰器的模块化架构，统一异常处理与管道校验
- **TypeORM** — 配置数据持久化，支持多表关联（供应商、模型参数、密钥记录）
- **加密存储** — 使用 AES-256-GCM 对敏感凭据字段加密存储，保障数据安全
- **RESTful API** — 标准化的配置管理端点，支持多维度查询与批量操作

## 核心依赖

| 模块 | 用途 |
|------|------|
| FoundationModule | 基础服务依赖（通用管道、过滤器、基类） |
| TenantModule | 租户隔离上下文，确保 LLM 配置按租户严格隔离 |
| EncryptionModule | 敏感数据（API Key、Secret）的加密/解密服务 |
| CacheModule | 配置数据的缓存加速，减少数据库查询压力 |
| AuditModule | 配置变更的审计日志记录，满足合规要求 |
