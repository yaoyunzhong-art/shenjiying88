## V23 PRD: 系统配置 / SaaS 设置管理模块

**版本**: v23
**状态**: Draft
**作者**: 树哥 🐜
**创建日期**: 2026-07-21
**更新日期**: 2026-07-21

---

### 1. 概述

#### 1.1 背景

随着 M5 平台 SaaS 化深入，平台级系统配置缺乏统一管理入口:
- **现有**: `tenant-config` 模块仅覆盖租户级三级配置 (W-S/W-T/W-B)，按 level+ownerId 隔离
- **缺失**: 平台级全局系统设置 (功能开关、限流、维护模式、白名单等) 无标准化管理
- **痛点**: 运维修改系统设置需直接改环境变量 / 数据库，缺乏权限审计和版本管理

#### 1.2 目标

V23 新增 `system-config` 模块，提供平台级系统/SaaS 配置的统一管理接口:

1. **功能开关管理 (Feature Flags)**: 平台级功能灰度控制开关
2. **限流配置 (Rate Limit)**: 全局+租户级 API 限流参数
3. **维护模式 (Maintenance)**: 平台维护状态控制
4. **白名单管理 (Whitelist)**: IP/域名白名单配置
5. **其他系统设置**: SSO 默认提供商、通知开关、会话超时等
6. **配置变更审计**: 所有修改操作记录 operator + timestamp

#### 1.3 与 tenant-config 的关系

| 维度 | tenant-config | system-config (新增) |
|------|---------------|----------------------|
| 作用域 | 租户内三级 (store/tenant/brand) | 全局平台级 |
| 隔离性 | 按 level+ownerId 严格隔离 | 全平台共享 |
| 操作角色 | store_admin / tenant_admin / etc. | 仅 super_admin 写入 |
| 审计 | 按租户审计日志 | 平台级审计日志 |
| 默认值 | 种子 seed 预置 | BUILTIN_SETTINGS 预置 |
| 持久化 | DB + 内存双写 | 当前内存 (后续 DB) |

---

### 2. API 设计

**Base URL**: `/api/v1/system-config`

#### 2.1 端点一览

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| GET | `/system-config` | 列出所有系统配置 (支持 category 过滤) | super_admin / brand_admin / auditor |
| GET | `/system-config/:key` | 查询单个配置 | super_admin / brand_admin / auditor |
| PUT | `/system-config/:key` | 更新配置值 | super_admin |
| POST | `/system-config` | 创建新配置 | super_admin |
| DELETE | `/system-config/:key` | 重置配置为默认值 | super_admin |
| GET | `/system-config/meta/categories` | 获取配置分类列表 | 全部 |
| GET | `/system-config/meta/audit-log` | 获取变更审计日志 | super_admin / brand_admin / auditor |

#### 2.2 请求/响应示例

**PUT /system-config/feature_flag.auto_approve_new_tenant**
```json
// Request
{ "value": "true" }

// Response
{
  "key": "feature_flag.auto_approve_new_tenant",
  "category": "feature_flag",
  "value": "true",
  "valueType": "boolean",
  "description": "新租户注册自动审核开关",
  "defaultValue": "false",
  "updatedBy": "admin-1",
  "updatedAt": "2026-07-21T02:30:00.000Z",
  "version": 2
}
```

**POST /system-config** (创建)
```json
// Request
{
  "key": "feature_flag.new_feature_x",
  "category": "feature_flag",
  "value": "true",
  "valueType": "boolean",
  "description": "新功能 X 开关"
}

// Response (HTTP 201)
{
  "key": "feature_flag.new_feature_x",
  "category": "feature_flag",
  "value": "true",
  "valueType": "boolean",
  "description": "新功能 X 开关",
  "defaultValue": "true",
  "updatedBy": "admin-1",
  "updatedAt": "2026-07-21T02:30:00.000Z",
  "version": 1
}
```

---

### 3. 配置分类与项定义

#### 3.1 内置配置项 (12项)

| key | category | valueType | 默认值 | 描述 |
|-----|----------|-----------|--------|------|
| `feature_flag.auto_approve_new_tenant` | feature_flag | boolean | false | 新租户注册自动审核 |
| `feature_flag.platform_whitelist_enabled` | feature_flag | boolean | false | IP 白名单总开关 |
| `rate_limit.api_global` | rate_limit | number | 1000 | 全局 API QPS |
| `rate_limit.api_per_tenant` | rate_limit | number | 100 | 每租户 API QPS |
| `maintenance.mode` | maintenance | boolean | false | 平台维护模式 |
| `maintenance.message` | maintenance | string | 系统维护中... | 维护提示消息 |
| `whitelist.allowed_ips` | whitelist | json_array | [] | IP 白名单 |
| `whitelist.allowed_domains` | whitelist | json_array | ["shenjiying.com"] | CORS 域名白名单 |
| `sso.default_provider` | sso | string | internal | 默认 SSO 提供商 |
| `notification.email_global_enabled` | notification | boolean | true | 邮件通知全局开关 |
| `notification.sms_global_enabled` | notification | boolean | true | 短信通知全局开关 |
| `platform.default_locale` | platform | string | zh-CN | 平台默认语言 |
| `platform.session_timeout_minutes` | platform | number | 1440 | 会话超时 (分钟) |

---

### 4. 安全设计

| 控制点 | 策略 |
|--------|------|
| 写入权限 | 仅 `super_admin` 可执行 POST/PUT/DELETE |
| 读取权限 | `super_admin` / `brand_admin` / `auditor` 可读 |
| 值校验 | 按 valueType 校验: boolean → true/false, number → 数字, json → 合法 JSON, json_array → JSON 数组 |
| 审计日志 | 所有变更记录 operator, role, previousValue, newValue, timestamp |
| 审计日志保留 | 最近 1000 条 (内存) |

---

### 5. 模块结构

```
apps/api/src/modules/system-config/
├── saas-settings.controller.ts       # Controller + 类型定义 + 内置设置
├── saas-settings.controller.test.ts  # 集成测试 (≥10 用例)
└── ...                               # 后续迭代增加 service / module
```

---

### 6. 后续规划

- **P1**: 引入 TypeORM/Prisma 持久化 (当前仅内存)
- **P2**: 配置变更 Webhook 通知
- **P3**: 配置版本对比/回滚
- **P4**: 配置批量导入/导出
- **P5**: 配置生效前预览/评估

---

### 7. 测试覆盖

`saas-settings.controller.test.ts` 覆盖以下场景:

| # | 用例 | 类型 |
|---|------|------|
| 1 | super_admin 列出全部系统配置 | 正例 |
| 2 | 按分类过滤返回正确结果 | 正例 |
| 3 | brand_admin 也可查看系统配置 | 正例 |
| 4 | auditor 也可查看系统配置 | 正例 |
| 5 | tenant_admin 查看抛出 ForbiddenException | 反例 |
| 6 | operator 查看抛出 ForbiddenException | 反例 |
| 7 | 获取单个存在的配置项 | 正例 |
| 8 | 获取不存在的配置抛出 NotFoundException | 反例 |
| 9 | super_admin 更新配置值成功 | 正例 |
| 10 | 更新 number 类型配置到有效值 | 正例 |
| 11 | 更新 boolean 为非法值抛出 BadRequest | 反例 |
| 12 | 更新不存在的配置抛出 NotFoundException | 反例 |
| 13 | brand_admin 更新配置抛出 ForbiddenException | 反例 |
| 14 | super_admin 创建新配置成功 | 正例 |
| 15 | 创建已存在的配置抛出 BadRequest | 反例 |
| 16 | 非法分类抛出 BadRequest | 反例 |
| 17 | tenant_admin 创建配置抛出 ForbiddenException | 反例 |
| 18 | super_admin 重置配置到默认值 | 正例 |
| 19 | brand_admin 重置抛出 ForbiddenException | 反例 |
| 20 | 返回所有分类 | 正例 |
| 21 | 变更操作后审计应有记录 | 正例 |
| 22 | 多次审计日志按时间倒序排列 | 正例 |
| 23 | auditor 也可查看审计日志 | 正例 |
| 24 | JSON array 传入非数组抛出 BadRequest | 反例 |
| 25 | JSON 非法语法抛出 BadRequest | 反例 |
| 26 | JSON array 有效值通过校验 | 正例 |
| 27 | number 类型默认值验证 | 正例 |

合计: 27 个测试用例 (≥10 达标)
