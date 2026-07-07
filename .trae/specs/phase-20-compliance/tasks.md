# Phase-20 Tasks · 合规 + 全球化

> 时间: Pulse-79 → Pulse-83

---

## Phase 1 · Pulse-79 · GDPR / 合规

### T39: PII 检测器
- [ ] phone (中国大陆手机号)
- [ ] email
- [ ] ID card (身份证)
- [ ] credit card (Luhn 校验)
- [ ] IP 地址

### T40: 数据脱敏
- [ ] maskPII phone (138****1234)
- [ ] maskPII email (a***@example.com)
- [ ] maskPII ID card (110101********1234)
- [ ] 自动脱敏中间件

### T41: 用户删除权
- [ ] softDelete + 30 天 grace period
- [ ] hardDelete after 30 days
- [ ] 跨模块级联删除
- [ ] 删除请求审计

---

## Phase 2 · Pulse-80 · 审计日志

### T42: AuditLog
- [ ] 不可篡改 (hash chain)
- [ ] 字段: actorId / action / resource / before / after / ip / ts
- [ ] append-only 存储

### T43: AuditQuery
- [ ] 按租户 / 时间 / actor 查询
- [ ] 导出 CSV / JSON
- [ ] 保留期配置 (默认 7 年)

---

## Phase 3 · Pulse-81 · i18n

### T44: I18n 框架
- [ ] Locale 上下文 (zh-CN / en-US / ja-JP)
- [ ] 翻译资源加载
- [ ] 参数化插值

### T45: Locale 路由
- [ ] /api/* 默认 zh-CN
- [ ] /en-US/api/* 切换
- [ ] Accept-Language header fallback

### T46: 翻译管理工具
- [ ] scripts/i18n-extract.ts (提取 key)
- [ ] scripts/i18n-validate.ts (校验完整性)
- [ ] CI 检查 missing translation

---

## Phase 4 · Pulse-82 · 多区域

### T47: MultiRegionRouter
- [ ] GeoIP 解析
- [ ] 区域映射 (cn / us / eu / jp)
- [ ] 就近路由

### T48: Failover
- [ ] 健康检查 (per region)
- [ ] 自动切换
- [ ] 数据一致性 (最终一致)

---

## Phase 5 · Pulse-83 · Retro

### T49: Phase-20 Retro
- [ ] lessons-learned/phase-20.md
- [ ] decision-records/DR-010-*.md
- [ ] patterns + anti-patterns

### T50: Phase-21 spec + roadmap
- [ ] Phase-21 spec.md
- [ ] dev-roadmap.md update

---

## 📊 任务统计

| 优先级 | 任务数 | Pulse |
|---|---|---|
| P0 合规 | 3 (T39-T41) | 79 |
| P0 审计 | 2 (T42-T43) | 80 |
| P0 i18n | 3 (T44-T46) | 81 |
| P1 多区域 | 2 (T47-T48) | 82 |
| P2 Retro | 2 (T49-T50) | 83 |
| **总计** | **12 任务** | **5 pulse** |

---

> 由 Pulse-78 Retro 生成 · Phase-20 启动
