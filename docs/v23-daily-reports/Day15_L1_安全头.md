# V23 Day15 L1: 三端安全头加固

**日期**: 2026-07-26
**龙虾哥 | V23 Day15 | L1 安全加固**
**时间**: 5分钟

---

## 背景

L3 渗透测试发现三端（admin-web / tob-web / storefront-web）缺失关键安全响应头：
- ❌ 无 CSP（内容安全策略）
- ❌ 无 X-Frame-Options（点击劫持防护）
- ❌ 无 Permissions-Policy（浏览器特性限制）

此外，发现 `apps/admin-web/next.config.performance.js` 虽然定义了 HSTS 等安全头，但该文件**未被任何入口引用**，属于死代码——安全头从未生效。

## 变更内容

### 1. `apps/admin-web/next.config.mjs` — 新增安全头
- 新增 `headers()` 异步函数，注入 7 类安全响应头
- 覆盖 CSP / X-Frame-Options: DENY / HSTS / X-Content-Type-Options / Referrer-Policy / Permissions-Policy

### 2. `apps/tob-web/next.config.mjs` — 新增安全头
- 与 admin-web 相同策略，新增 `headers()` 注入完整安全头

### 3. `apps/storefront-web/next.config.mjs` — 新增安全头
- 与 admin-web 相同策略，保留原有 experimental + webpack 配置

### 4. `apps/tob-web/middleware.ts` — 中间件安全头（双重防御）
- 在 middleware 层注入安全响应头，覆盖所有路由（排除静态资源）
- 作为 next.config headers 的补充防御层

## 安全头清单

| 头 | 值 | 作用 |
|---|---|---|
| `X-Frame-Options` | `DENY` | 禁止 iframe 嵌入，防点击劫持 |
| `X-Content-Type-Options` | `nosniff` | 禁止 MIME 嗅探 |
| `X-DNS-Prefetch-Control` | `on` | 允许 DNS 预取 |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | 强制 HTTPS（2年） |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | 跨域时仅发送 origin |
| `Content-Security-Policy` | `default-src 'self'; script-src ...; style-src ...; ...` | 内容安全策略 |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), ...` | 禁用敏感浏览器特性 |

### CSP 详情
```
default-src 'self'
script-src 'self' 'unsafe-inline' 'unsafe-eval'
style-src 'self' 'unsafe-inline'
img-src 'self' data: blob: https:
font-src 'self' data:
connect-src 'self' https:
frame-ancestors 'none'
base-uri 'self'
form-action 'self'
```

### Permissions-Policy 详情
```
camera=(), microphone=(), geolocation=(), interest-cohort=(),
autoplay=(self), payment=(), usb=()
```

## 验证

- ✅ `apps/admin-web` TSC: 0 errors
- ✅ `apps/tob-web` TSC: 0 errors
- ✅ `apps/storefront-web` TSC: 0 errors
- ⚠️ 未做生产构建验证（安全头变更不改变构建逻辑）
- ⚠️ CSP 使用 `unsafe-inline` + `unsafe-eval`，后续可收紧（需先 fix 内联脚本/样式）

## 文件变更

```
M  apps/admin-web/next.config.mjs          (新增 headers() + 安全头数组)
M  apps/tob-web/next.config.mjs            (新增 headers() + 安全头数组)
M  apps/storefront-web/next.config.mjs     (新增 headers() + 安全头数组)
M  apps/tob-web/middleware.ts              (middleware 注入安全响应头)
A  docs/v23-daily-reports/Day15_L1_安全头.md (本报告)
```

## 后续建议

1. **收紧 CSP**: 在确认无内联脚本/样式后，移除 `unsafe-inline` 和 `unsafe-eval`
2. **清理死代码**: 删除 `apps/admin-web/next.config.performance.js`（从未加载，混淆维护）
3. **L2 验证**: 下一层用 Playwright E2E 验证生产环境实际安全头是否存在
