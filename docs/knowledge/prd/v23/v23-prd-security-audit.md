# V23 PRD — 安全与审计阀门 (WP-02B)

> **PRD 摘要卡**
> 来源: `docs/knowledge/2026-07-23-6-8-development-master-backlog-v2.md §4`
> BS 域: BS-0048~BS-0059, BS-0062~BS-0065

---

## 1. 概述

本轮交付对安全与审计模块进行全量扫描、补缺与加固，确保所有安全门禁真实有效而非「宣称通过」。

## 2. 设施盘点

### 安全模块 (`apps/api/src/modules/security/`)

| 设施 | 状态 | 说明 |
|------|------|------|
| `SecurityController` | ✅ | 安全扫描、WAF 规则管理、JWT/IDOR/敏感数据检测 |
| `SecurityScannerService` | ✅ | SQL 注入、XSS、IDOR、JWT 弱密钥、敏感数据暴露、速率限制检测 |
| `WAFService` | ✅ | IP/路径/UA/Header 过滤、速率限制、阻断日志 |
| `security.ringbeam.test.ts` | ✅ | 圈梁测试 |

### 审计模块 (`apps/api/src/modules/audit/`)

| 设施 | 状态 | 说明 |
|------|------|------|
| `AuditController` | ✅ | 14 个端点（CRUD + 异常检测 + 风险评分 + 分账 + 合规报告） |
| `AuditService` | ✅ | In-memory 全链路追踪、异常行为检测、风险评分、分账日志、GDPR 合规 |
| `AuditLogEntity` | ✅ | TypeORM 实体，含多列索引 |
| `AuditModule` | ✅ | 导出 `AuditService` 供其他模块注入 |
| `audit.ringbeam.test.ts` | ✅ | 圈梁测试 |

### 合规基线 (`.trae/compliance/`)

| 文件 | 状态 | 说明 |
|------|------|------|
| `bs-catalog.json` | ✅ | BS 项目目录（113KB） |
| `coverage-matrix.json` | ✅ | 覆盖率矩阵（当前空） |
| `deviation-registry.json` | ✅ | 偏离登记表（当前无偏离） |

### 安全基线脚本

| 文件 | 状态 | 说明 |
|------|------|------|
| `scripts/security-baseline-scan.sh` | ✅ | G2-C1 8项安全基线真实扫描 |
| `scripts/authguard-coverage-check.sh` | ✅ | AuthGuard 覆盖率检测 |

## 3. WP-02B 变更清单

### 3.1 新增审计事件类型

审计模块原有事件类型缺少用户创建/删除操作的事件追踪。本轮补充：

- `user.created` — 用户创建
- `user.deleted` — 用户删除
- `user.disabled` — 用户禁用
- `user.enabled` — 用户启用
- `admin.user_created` — 管理员创建用户
- `admin.user_deleted` — 管理员删除用户
- `admin.user_disabled` — 管理员禁用用户
- `admin.user_enabled` — 管理员启用用户

修改文件:
- `apps/api/src/modules/audit/audit.service.ts` — 类型定义
- `apps/api/src/modules/audit/audit.entity.ts` — 类型定义

### 3.2 修复测试缺陷

修复 `audit.role-api.test.ts` 中测试用例：异常检测需 `eventType='auth.login'` + `metadata.success=false`，但原测试使用了不存在的事件类型 `auth.login_failed`。

### 3.3 安全基线扫描

上游脚本 `scripts/security-baseline-scan.sh` 依赖 `authguard-coverage-check.sh` 和 `remote-push-detect.sh`。AuthGuard 覆盖率实际为 **95.75%**（212个控制器中203个有 @UseGuards），远超 80% 阈值。

## 4. 安全门禁矩阵

| 门禁 | 职责 | 状态 |
|------|------|------|
| AuthGuard | 控制器级认证 | ✅ 95.75% 覆盖率 |
| TenantGuard | 多租户隔离 | ✅  |
| WAF | 请求过滤 & 速率限制 | ✅  |
| SecurityScanner | SQLi/XSS/IDOR/JWT 检测 | ✅  |
| AuditService | 全链路审计追踪 | ✅ 14 端点 |
| Risk Scoring | 异常行为风险评分 | ✅  |
| Compliance Report | GDPR Art.30 | ✅  |
| Settlement Audit | 分账事件追踪 | ✅  |

## 5. 删除/弃用

无。

## 6. 测试覆盖率

| 模块 | 测试文件数 | 测试用例数 | 状态 |
|------|-----------|-----------|------|
| audit | 14 | 396 | ✅ 全绿 |
| security | 13 | 347 | ✅ 全绿 |

## 7. 参考资料

- `apps/api/src/modules/audit/` — 审计模块
- `apps/api/src/modules/security/` — 安全模块
- `scripts/security-baseline-scan.sh` — 安全基线扫描脚本
- `.trae/compliance/` — 合规基线文件
- `docs/knowledge/2026-07-23-6-8-development-master-backlog-v2.md` — 主需求文档
