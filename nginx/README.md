# Nginx — 反向代理配置

## 📋 模块概述

Nginx 模块是 shenjiying88 平台的**反向代理网关层**，负责统一入口管理、子域名路由、SSL/TLS 加密和负载均衡。该模块通过 Nginx 将前端三大 Web 应用（Admin / Storefront / ToB）和后端 API 服务映射到不同的子域名，实现多服务统一暴露。

## 📁 目录结构

```
nginx/
├── Dockerfile                    # Nginx Docker 构建文件
├── nginx.conf                    # 主配置文件 — 子域名映射与反向代理
├── ssl-setup.sh                  # SSL 自签名证书生成脚本
├── ssl/
│   └── .gitkeep                  # SSL 证书占位目录
├── certs/
│   ├── m5.local.crt              # 自签名 SSL 证书
│   └── m5.local.key              # 自签名 SSL 私钥
└── conf.d/
    ├── default.conf              # 默认 server block — 拒绝未知域名
    ├── health.conf               # 健康检查端点配置
    ├── m5.conf                   # M5 平台 SSL/TLS 配置（自签名 localhost）
    └── m5.ssl.conf               # M5 平台 SSL/TLS 配置（完整版本）
```

## 🚀 功能说明

### 1. 子域名反向代理
基于 `nginx.conf` 实现以下子域名路由映射：

| 子域名 | 目标服务 | 端口 | 说明 |
|--------|---------|------|------|
| `api.shenjiying.localhost` | API 服务 | 3001 | 后端 API 网关 |
| `admin.shenjiying.localhost` | Admin Web | 3002 | 管理后台前端 |
| `store.shenjiying.localhost` | Storefront Web | 3003 | 门店前端 |
| `tob.shenjiying.localhost` | ToB Web | 3004 | 企业版前端 |
| `localhost` (默认) | Admin Web | 3002 | 直接访问回退到管理后台 |

### 2. SSL/TLS 加密
- **ssl-setup.sh**: 一键生成自签名 SSL 证书脚本（适用于开发环境）
- **certs/**: 存放生成的 m5.local.crt 和 m5.local.key 证书文件
- **m5.conf/m5.ssl.conf**: HTTP → HTTPS 自动跳转与 4 个子域名 SSL 配置
- 支持 TLSv1.2 + TLSv1.3，加密套件使用 HIGH:!aNULL:!MD5

### 3. Docker 容器化
- **Dockerfile**: 基于 `nginx:1.27-alpine` 构建，体积小、启动快
- 自动删除默认配置，加载自定义 `nginx.conf`
- 暴露端口 80（HTTP）+ 443（HTTPS）
- SSL 证书通过 Docker volume 挂载（`docker-compose.yml` 中配置）

### 4. 健康检查
- **health.conf**: 为 Docker 容器健康检查提供 `/health` 端点
- 与 docker-compose 的 `healthcheck` 配置配合使用

### 5. 安全加固
- **default.conf**: 返回 444 拒绝未知域名访问，防止恶意扫描
- 所有代理请求传递真实客户端 IP（`X-Real-IP` / `X-Forwarded-For`）
- 代理协议标记（`X-Forwarded-Proto`）

## 🛠️ 使用方式

### Docker 构建与启动
```bash
# 构建 Nginx 镜像
docker build -t shenjiying-nginx ./nginx

# 使用 docker-compose 启动（推荐）
docker compose up -d nginx
```

### SSL 证书初始化
```bash
# 首次部署运行 SSL 证书生成脚本
bash nginx/ssl-setup.sh
```

### 本地调试
```bash
# 直接使用 nginx 命令（需要本地安装 nginx）
nginx -c /path/to/nginx/nginx.conf
nginx -s reload
```

### 配置文件验证
```bash
# 检查配置文件语法
nginx -t -c /path/to/nginx/nginx.conf
```

## 🔗 依赖与关联

| 模块 | 关系 | 说明 |
|------|------|------|
| apps/api | 上游服务 | Nginx 代理 API 服务 (:3001) |
| apps/admin-web | 上游服务 | Nginx 代理管理后台 (:3002) |
| apps/storefront-web | 上游服务 | Nginx 代理门店前端 (:3003) |
| apps/tob-web | 上游服务 | Nginx 代理企业版前端 (:3004) |
| docker-compose.yml | 编排 | 定义 nginx 服务与 SSL volume 挂载 |
| monitor-dashboard/ | 静态资源 | 可增加 server block 暴露监控仪表盘 |

---

> **开发状态:** 已就绪，配置完整，SSL 证书需在首次部署时生成
> **维护者:** 树哥 (Trae Assistant)
