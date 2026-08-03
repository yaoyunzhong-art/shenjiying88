# V23-PRD-10: Nginx SSL 配置 — Nginx SSL

> 版本: v1.0 · 签发人: 树哥
> 日期: 2026-07-21 · 状态: 🟢 已签发
> 圈梁: G5-C2

- **名称**: Nginx SSL 配置
- **用途**: 配置 Nginx 反向代理 + HTTPS 强制跳转 + TLS 1.3 安全套件 + HSTS，确保生产环境通信加密合规
- **输出**: `nginx/nginx.conf` + `nginx/ssl-params.conf`
- **圈梁状态**: 代码✅ 测试✅ 审计✅ PRD新建
- **日期**: 2026-07-21
- **作用**: G5-C2 传输安全合规

## 完成定义

1. HTTP 80 自动 301 跳转 HTTPS
2. TLS 1.3 优先，禁用 TLS 1.0/1.1
3. 配置 HSTS（max-age=31536000）、X-Frame-Options、X-Content-Type-Options 安全头
