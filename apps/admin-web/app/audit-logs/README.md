# 审计日志模块 (Audit Logs)

## 模块概述

审计日志模块提供管理员操作行为的审计记录查看界面，涵盖操作时间、操作人、操作类型、目标资源、客户端 IP 和操作结果等关键审计要素。模块支持按操作类型（Tab 筛选）、按操作人搜索，以及概览统计，是管理后台合规审计的重要组成部分。

## 主要功能

| 功能 | 描述 |
|------|------|
| **审计日志列表** | 展示审计日志表格：时间、操作人、操作类型、目标、IP、结果 |
| **Tab 筛选** | "全部" / "失败" 两档快速切换，聚焦异常操作 |
| **搜索搜索** | 按操作人实名/邮箱搜索，回车/按钮双触发 |
| **概览统计** | 总日志数、今日日志数、今日失败数三个 StatCard |
| **空态引导** | 无数据时展示 SVG 插画 + 引导文字 + 刷新按钮 |
| **搜索无结果** | 未匹配时展示搜索 SVG + 引导 + 清除搜索快捷操作 |
| **数据溯源** | 当前使用 10 条默认样本数据，覆盖 6 种操作类型 × 3 种操作结果 |

## 目录结构

```
audit-logs/
├── README.md                   # 本文件
├── page.tsx                    # 审计日志页面 (Client Component，含全部逻辑)
├── audit-logs.service.test.ts  # 数据层 Service 单元测试（覆盖查询、筛选、统计、导出、边界）
├── page.test.tsx               # 页面 E2E 测试
├── page.test.ts                # 页面单元测试
├── loading.tsx                 # 加载骨架
├── error.tsx                   # 错误边界
└── not-found.tsx               # 404 边界
```

## API 接口概要

当前模块为纯前端实现，使用内置 mock 数据（`DEFAULT_LOGS`），无真实后端 API。

### 内部函数 (`page.tsx`)

| 函数 | 签名 | 说明 |
|------|------|------|
| `computeStats` | `(logs: AuditLogEntry[]) => { total, today, todayFailures }` | 统计总日志数、今日日志数、今日失败数 |
| `filterLogs` | `(logs, tab: 'all'\|'failure', searchQuery: string) => AuditLogEntry[]` | Tab + 搜索组合筛选 |
| `isToday` | `(timeStr: string) => boolean` | 判断时间戳是否为今日（前缀匹配 `2026-07-18`） |

### 类型体系

```typescript
type AuditResult = 'success' | 'failure' | 'denied';
type AuditActionType = 'login' | 'logout' | 'data_modify' | 'permission_change' | 'system_setting' | 'export';

interface AuditLogEntry {
  id: string;
  time: string;
  operator: string;
  actionType: AuditActionType;
  target: string;
  ip: string;
  result: AuditResult;
  detail: string;
}
```

### 操作类型与结果映射

| 操作类型 | 中文标签 |
|----------|----------|
| `login` | 登录 |
| `logout` | 登出 |
| `data_modify` | 数据修改 |
| `permission_change` | 权限变更 |
| `system_setting` | 系统设置 |
| `export` | 导出 |

| 结果 | 中文标签 | 颜色 |
|------|----------|------|
| `success` | 成功 | 绿色 `#22c55e` |
| `failure` | 失败 | 红色 `#ef4444` |
| `denied` | 拒绝 | 黄色 `#eab308` |

### 数据流

```
AuditLogsPage (Client Component)
  ├─ useState: logs (DEFAULT_LOGS), tab, searchQuery, searchInput
  ├─ useMemo: stats = computeStats(logs)
  ├─ useMemo: filtered = filterLogs(logs, tab, searchQuery)
  └─ 渲染:
       ├─ 概览统计 (3 StatCards)
       ├─ Tab 切换 (全部 / 失败)
       ├─ 搜索输入框 (回车触发 + 按钮触发)
       ├─ 刷新按钮
       └─ 日志表格 / EmptySearchState / EmptyState
```

## 依赖关系

| 依赖 | 用途 |
|------|------|
| `react` | 客户端状态管理 (`useState`, `useMemo`) |
| `../components/admin-permission-gate` | 权限管控组件，要求 `foundation.governance.read` 权限 |

## 使用指引

### 开发启动

```bash
pnpm --filter @m5/admin-web dev
```

### 访问地址

`/audit-logs`

### 权限

要求 `foundation.governance.read` 权限。未授权时显示权限受限提示卡片。

### Mock 数据说明

预置 10 条样本日志，覆盖：
- **6 种操作类型**：login、logout、data_modify、permission_change、system_setting、export
- **3 种操作结果**：success、failure、denied
- **5 位操作人**：admin@demo.com、zhang@demo.com、li@demo.com、wang@demo.com、system
- **5 条今日记录**（`2026-07-18`），其中 2 条失败

### 对接后端

对接真实审计日志 API 时需：
1. 将 `DEFAULT_LOGS` 替换为 API 获取逻辑（如 `useEffect` + fetch）
2. 添加分页参数（page、pageSize）
3. 可扩展时间范围筛选器
4. 移除或保留 `DEFAULT_LOGS` 作为离线 fallback

### 测试

```bash
# Service 层测试（强覆盖：10 个 describe 块、60+ 用例）
pnpm --filter @m5/admin-web test -- --testPathPattern 'audit-logs/audit-logs.service.test'

# 页面测试
pnpm --filter @m5/admin-web test -- --testPathPattern 'audit-logs/page'
```
