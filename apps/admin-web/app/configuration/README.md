# 配置管理 — Configuration

系统配置管理模块，提供配置项（Config Entries）、功能开关（Feature Flags）、密钥（Secrets）、证书（Certificates）的集中治理能力，支持三级独立配置生效、操作审计、配置版本 Diff 等功能。

## 目录结构

```
configuration/
├── page.tsx                                     # 配置治理工作台主页（客户端组件，含 Mock 版）
├── configuration-workspace-client.tsx            # 配置治理工作台主客户端组件（真实 API 版）
├── loading.tsx                                  # 主页加载骨架屏
├── page.test.tsx / page.test.ts                 # 主页单元测试
│
├── entries/
│   └── [id]/
│       ├── page.tsx                             # 配置项详情页（服务端组件）
│       ├── configuration-config-entry-detail-client.tsx  # 配置项详情客户端组件
│       ├── loading.tsx                          # 详情加载骨架屏
│       └── page.test.tsx                        # 详情页测试
│
├── flags/
│   └── [key]/
│       ├── page.tsx                             # 功能开关详情页（服务端组件）
│       ├── configuration-feature-flag-detail-client.tsx  # 功能开关详情客户端组件
│       ├── loading.tsx                          # 详情加载骨架屏
│       └── page.test.tsx                        # 详情页测试
│
├── secrets/
│   └── [name]/
│       ├── page.tsx                             # 密钥详情页（服务端组件）
│       ├── configuration-secret-detail-client.tsx       # 密钥详情客户端组件
│       ├── loading.tsx                          # 详情加载骨架屏
│       └── page.test.tsx                        # 详情页测试
│
├── certificates/
│   └── [name]/
│       ├── page.tsx                             # 证书详情页（服务端组件）
│       ├── configuration-certificate-detail-client.tsx  # 证书详情客户端组件
│       ├── loading.tsx                          # 详情加载骨架屏
│       └── page.test.tsx                        # 详情页测试
│
├── operations/
│   └── [operation]/
│       ├── page.tsx                             # 操作审计详情页（客户端组件）
│       ├── configuration-operation-detail-client.tsx    # 操作审计详情客户端组件
│       ├── loading.tsx                          # 详情加载骨架屏
│       └── page.test.tsx                        # 详情页测试
│
└── three-level/
    ├── page.tsx                                 # 三级独立配置页（服务端组件，加载 W-S/W-T/W-B）
    ├── three-level-config-client.tsx             # 三级配置客户端（tab 切换 / 编辑 / 回滚）
    ├── loading.tsx                              # 三级配置加载骨架屏
    └── page.test.tsx / page.test.ts             # 三级配置测试
```

## 核心功能

### 配置治理工作台（总览）

| 功能 | 说明 |
|------|------|
| **总览 Dashboard** | 展示配置项/功能开关/密钥/证书的治理数量与状态 |
| **配置项管理** | 按 key、分组（系统/用户/安全/等）、环境（prod/staging/dev）、状态过滤与搜索 |
| **功能开关管理** | 功能开关列表，支持搜索与切换生效状态 |
| **密钥管理** | 密钥列表，支持查看与状态跟踪 |
| **证书管理** | TLS/SSL 证书列表，支持到期跟踪 |
| **三级独立配置** | 按 W-S（门店）/ W-T（租户）/ W-B（品牌）三个工作台分别配置生效级别 |

### 配置详情页

- **配置项详情** (`entries/[id]`) — 展示单条配置的 key、value、环境、分组、状态；通过 `@m5/types` 的 `readConfigurationConfigEntryDetailParam` 解析路由参数，`loadConfigurationConfigEntryDetail` 加载数据
- **功能开关详情** (`flags/[key]`) — 展示开关定义、当前状态、生效范围；`readConfigurationFeatureFlagDetailParam` + `loadConfigurationFeatureFlagDetail`
- **密钥详情** (`secrets/[name]`) — 展示密钥元数据、最后轮换时间、关联服务；`readConfigurationSecretDetailParam` + `loadConfigurationSecretDetail`
- **证书详情** (`certificates/[name]`) — 展示证书指纹、颁发者、到期日；`readConfigurationCertificateDetailParam` + `loadConfigurationCertificateDetail`
- **操作审计详情** (`operations/[operation]`) — 展示操作记录、RBAC 角色、审批要求、审计级别、状态追踪

### 三级独立配置 — 编辑与回滚

通过 `@m5/sdk.getTenantWorkbenchConfigs` 加载 W-S/W-T/W-B 三个工作台的真实生效配置，客户端支持：
- Tab 切换三个工作台
- 编辑配置项（`setTenantConfigBatch`）
- 回滚历史（`rollbackTenantConfig`）
- 敏感等级识别（secret / restricted / internal / public）

## 使用指引

1. **治理工作台** — 访问 `/configuration`，总览页展示各分类计数；可切换到「功能开关」「配置项」「密钥」「证书」Tab
2. **查看详情** — 点击列表中任意条目进入相应详情页，支持三层 scope（tenantId / brandId / storeId / marketCode）
3. **三级配置编辑** — 访问 `/configuration/three-level`，选择工作台 → 查找配置 → 编辑 → 提交生效
4. **操作审计** — 访问 `/configuration/operations`，查看管理操作历史与审批状态

## 相关依赖

| 包 | 来源 | 用途 |
|----|------|------|
| `@m5/ui` | 内部 UI 库 | `DataTable` / `PageShell` / `StatusBadge` / `Tabs` / `FilterChips` / `Pagination` / `SearchFilterInput` / `DetailActionBar` / `LoadingSkeleton` |
| `@m5/types` | 内部类型库 | 路由参数解析函数、配置项/功能开关/密钥/证书类型定义 |
| `@m5/sdk` | 内部 SDK | `ApiClient` — `getTenantWorkbenchConfigs` / `setTenantConfigBatch` / `rollbackTenantConfig` |
| `@m5/ui/three-level-config` | 内部 UI 子模块 | `WORKBENCH_CARDS` / `CATEGORY_LABELS` / `SENSITIVITY_LABELS` / `SENSITIVITY_COLORS` / `ConfigSensitivity` / `WorkbenchCode` |
| `next/link` | 外部 | 路由导航 |
| `../components/use-detail-actions` | 同层模块 | 详情页共享/复制等操作 hook |
| `../configuration-view-model` | 同层模块 | 状态标签映射 + 摘要函数 |
| `../xxx-view-model`（各子模块） | 同层模块 | 数据加载函数（`loadConfigurationConfigEntryDetail` 等） |
| `../approvals-data` | 同层模块 | 审批路由引用 |
