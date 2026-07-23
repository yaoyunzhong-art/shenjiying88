# Monitor Dashboard — 监控仪表盘

## 📋 模块概述

Monitor Dashboard 是 shenjiying88 平台的**实时监控与运维仪表盘**模块，提供后端服务状态监控、性能指标可视化、告警管理和日志审计等核心运维能力。该模块独立于主前端应用，以静态页面形式部署，可通过 Nginx 反向代理或直接浏览器访问。

## 📁 目录结构

```
monitor-dashboard/
├── index.html                    # 入口页 — 自动跳转至 pages/dashboard.html
├── css/
│   └── dashboard.css             # 仪表盘全局样式（暗色主题、响应式布局）
├── js/
│   ├── app.js                    # 主应用逻辑（路由、数据绑定、UI 交互）
│   └── mock-api.js               # Mock API 模拟数据层（开发调试用）
└── pages/
    ├── dashboard.html            # 概览仪表盘 — 核心监控视图
    ├── alerts.html               # 告警管理 — 告警规则配置与历史
    ├── logs.html                 # 日志审计 — 实时日志流与搜索
    ├── performance.html          # 性能监控 — 响应时间、吞吐量、错误率
    ├── team.html                 # 团队管理 — 成员与权限配置
    └── users.html                # 用户管理 — 用户列表与角色分配
```

## 🚀 功能说明

### 1. 概览仪表盘 (pages/dashboard.html)
- 实时展示后端服务健康状态（在线/离线/异常）
- CPU、内存、磁盘使用率可视化图表
- 近 24 小时 API 请求趋势与错误率统计
- 活跃告警汇总与一键跳转

### 2. 告警管理 (pages/alerts.html)
- 告警规则配置（阈值、通知方式、沉默时间）
- 告警历史记录查询与筛选
- 告警确认与处理状态追踪

### 3. 日志审计 (pages/logs.html)
- 实时日志流展示（WebSocket 模拟）
- 按级别（INFO/WARN/ERROR）、时间范围、关键字搜索过滤
- 日志导出与归档

### 4. 性能监控 (pages/performance.html)
- API 端点响应时间 P50/P95/P99 统计
- 每分钟请求吞吐量（RPM）趋势图
- 服务错误率与慢查询追踪

### 5. 团队与用户管理
- **团队管理** (pages/team.html): 成员列表、角色分配（Admin/Editor/Viewer）
- **用户管理** (pages/users.html): 用户账号管理、登录审计、权限配置

### 6. 数据模拟层 (js/mock-api.js)
- 提供完整的 Mock API 响应，用于前端开发与演示
- 支持响应延迟模拟、随机错误注入
- 数据集包括：服务状态、性能指标、告警事件、日志记录、用户/团队数据

## 🛠️ 使用方式

### 直接浏览器打开
```bash
# 使用浏览器直接打开入口页，自动跳转至 dashboard
open monitor-dashboard/index.html
```

### 通过 Nginx 反向代理
```nginx
# nginx/conf.d 中增加 server block：
server {
    listen 80;
    server_name monitor.shenjiying.localhost;

    location / {
        root /path/to/monitor-dashboard;
        index index.html;
    }
}
```

### 开发调试
- 修改 `js/mock-api.js` 中的数据集可调整模拟数据
- 各页面可直接在浏览器中独立打开进行调试
- 暗色主题 CSS 变量定义在 `dashboard.css` 头部

## 🔗 依赖与关联

| 模块 | 关系 | 说明 |
|------|------|------|
| nginx/ | 网关层 | 通过 Nginx 反向代理对外暴露监控页面 |
| apps/api | 数据源 | 生产环境中替换 Mock API，提供真实监控数据 |
| infra/ | 基础设施 | 与 Prometheus/Grafana 等监控工具配合使用 |

---

> **开发状态:** 静态原型阶段，各页面已完成 UI 结构与交互逻辑
> **维护者:** 树哥 (Trae Assistant)
