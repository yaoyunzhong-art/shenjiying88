# 合规管理模块 (Compliance)

## 模块概述

合规管理模块（Phase-20 T39-T43）是系统的合规基础设施，提供法规遵从能力。涵盖 PII（个人身份信息）自动检测与脱敏、GDPR 数据删除（被遗忘权）、不可篡改审计日志（Hash Chain）、审计查询导出以及合规阀门控制。

模块采用 `Global` 装饰器注册为全局模块，所有其他模块可直接注入使用子服务。

## 核心功能

### 1. PII 检测 (`PIIDetectorService`)

| 功能 | 描述 |
|------|------|
| 支持类型 | 手机号、邮箱、身份证号、信用卡号、IP 地址 |
| 正则匹配 | 每种 PII 类型使用专用正则表达式 |
| 置信度评分 | 每条检测结果附带 0-1 置信度 |
| 批量检测 | 支持并发扫描多段文本 |
| 敏感指数 | 基于 PII 类型权重 + 数量计算综合敏感指数（0-1） |

### 2. PII 脱敏 (`PIIMaskerService`)

| 功能 | 描述 |
|------|------|
| 自动替换 | 将检测到的 PII 内容替换为掩码字符（默认 `*`） |
| 保留类型标识 | 可选保留原始 PII 类型信息 |
| 脱敏率统计 | 计算脱敏比率 |
| 批量脱敏 | 支持批量处理多段文本 |

### 3. GDPR 删除 (`GDPRErasureService`)

| 功能 | 描述 |
|------|------|
| 删除请求 | 发起用户数据删除申请 |
| Grace Period | 默认 30 天宽限期，支持自定义 |
| 级联删除 | 注册到模块的子系统可收到删除通知，清除关联数据 |
| 定时处理 | 批量处理到期删除请求 |
| 删除撤销 | 宽限期内支持撤销删除请求 |
| 审计追踪 | 完整的删除生命周期审计记录 |
| 硬删除 | 宽限期到期后执行不可逆的硬删除 |

### 4. 审计日志 (`AuditLogService`)

| 功能 | 描述 |
|------|------|
| Append-Only | 仅允许追加，不允许修改或删除 |
| Hash Chain 防篡改 | 每条记录 hash = SHA256(prevHash + payload)，篡改即破链 |
| 完整性校验 | 遍历整条 Hash Chain 验证数据完整性 |
| 操作类型 | CREATE / UPDATE / DELETE / READ / CUSTOM |

### 5. 审计查询 (`AuditQueryService`)

| 功能 | 描述 |
|------|------|
| 多维查询 | 按租户、操作人、动作、资源、时间范围过滤 |
| 导出功能 | 支持 CSV / JSON 格式导出 |
| 合规保留 | 默认保留 7 年（合规要求），导出时标记有效期 |
| 导出完整性 | 导出附带 Hash Chain 完整性校验结果 |

### 6. 合规阀门 (`ComplianceGateService`)

| 功能 | 描述 |
|------|------|
| 覆盖率检查 | 检查代码覆盖率是否达标 |
| TSC 通过率 | 检查 TypeScript 编译通过率 |
| 测试通过率 | 检查测试用例通过率 |
| 动态配置 | 支持运行时更新阀门阈值 |

## 接口说明

### REST API

| 方法 | 端点 | 描述 |
|------|------|------|
| POST | `/compliance/pii/detect` | PII 检测 |
| POST | `/compliance/pii/mask` | PII 脱敏 |
| POST | `/compliance/pii/batch-detect` | 批量 PII 检测 |
| POST | `/compliance/pii/batch-mask` | 批量 PII 脱敏 |
| POST | `/compliance/erasure` | 请求删除用户数据 |
| POST | `/compliance/erasure/:userId/cancel` | 撤销删除请求 |
| POST | `/compliance/erasure/:userId/hard-delete` | 执行硬删除 |
| POST | `/compliance/erasure/process-scheduled` | 定时处理到期删除 |
| GET | `/compliance/erasure/:userId` | 查询删除状态 |
| GET | `/compliance/erasure/audit/:tenantId` | 删除审计追踪 |
| POST | `/compliance/audit/append` | 追加审计日志 |
| POST | `/compliance/audit/query` | 查询审计日志 |
| POST | `/compliance/audit/export` | 导出审计日志 |
| GET | `/compliance/audit/verify` | 校验审计链完整性 |
| GET | `/compliance/gate/check` | 合规阀门检查 |
| GET | `/compliance/gate/config` | 获取阀门配置 |
| POST | `/compliance/gate/config` | 更新阀门配置 |
| GET | `/compliance/health` | 合规模块健康检查 |

所有接口受 `TenantGuard` 保护。

### 跨模块合约 (Contract)

模块通过 `compliance.contract.ts` 暴露以下合约类型供其他模块消费：

- `PIIScanResultContract` — PII 扫描结果合约
- `PIIMaskResultContract` — PII 脱敏结果合约
- `ErasureRequestContract` — 删除请求合约
- `AuditLogEntryContract` — 审计日志条目合约
- `AuditQueryResultContract` — 审计查询结果合约
- `AuditVerifyContract` — 审计链完整性合约
- `ComplianceHealthContract` — 合规健康检查合约

## 依赖模块

| 模块 | 关系 | 说明 |
|------|------|------|
| agent | 强依赖 | `TenantGuard` 多租户鉴权守卫 |

本模块为 `@Global()` 全局模块，所有模块无需导入即可注入 PII 检测/脱敏/GDPR 删除/审计日志服务。

## 配置项

暂无独立的环境变量配置。各子服务的行为由内部参数控制：

| 服务 | 可调参数 | 默认值 |
|------|---------|--------|
| PII 检测 | 置信度阈值 | 0.8 |
| GDPR 删除 | Grace Period | 30 天 (2592000000ms) |
| 审计日志 | 默认可追加 | 无上限 |
| 审计导出 | 保留期 | 7 年 (2555 天) |
| 合规阀门 | 覆盖率达到等 | 动态配置 |
