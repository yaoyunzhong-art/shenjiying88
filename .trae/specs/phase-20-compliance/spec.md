# Phase-20 Spec · 合规 + 全球化

> 创建: 2026-06-26 · Pulse-78 Phase-19 Retro 阶段
> 时间: Pulse-79 → Pulse-83 (5 pulse)
> 配合: dev-roadmap.md §Phase-20

---

## 🎯 目标

将 Phase-19 的"智能化引擎"升级为"合规全球化",重点 3 件事:
1. **GDPR / 数据合规** - 数据脱敏 + 用户删除权 + 审计日志
2. **多语言 / 国际化** - i18n 框架 + 区域化部署
3. **多区域容灾** - 跨区域复制 + 故障切换

## 📐 架构概览

```
[Phase-19 沉淀]
├── anomaly-detector (3 算法)
├── auto-rollback (状态机)
├── recommender (Champion + RAG)
└── health-dashboard (4 维评分)
       ↓
[Phase-20 升级]
├── compliance (GDPR / PII)
├── i18n (多语言 + 区域)
├── multi-region (跨区域复制)
├── audit-log (操作审计)
└── data-export (用户数据导出)
```

## 📋 Phase-20 任务 (12 任务,T39-T50,5 pulse)

### Phase 1 · Pulse-79 · GDPR / 合规 (T39-T41)
- **T39**: PII 检测器 (phone / email / ID card)
- **T40**: 数据脱敏 (maskPII)
- **T41**: 用户删除权 (right to be forgotten)

### Phase 2 · Pulse-80 · 审计日志 (T42-T43)
- **T42**: AuditLog (操作记录 + 不可篡改)
- **T43**: AuditQuery (合规查询接口)

### Phase 3 · Pulse-81 · 国际化 i18n (T44-T46)
- **T44**: I18n 框架 (zh-CN / en-US / ja-JP)
- **T45**: Locale 路由
- **T46**: 翻译管理工具

### Phase 4 · Pulse-82 · 多区域 (T47-T48)
- **T47**: MultiRegionRouter (地理路由)
- **T48**: Failover (故障切换)

### Phase 5 · Pulse-83 · Retro + Phase-21 (T49-T50)
- **T49**: Phase-20 Retro + lessons
- **T50**: Phase-21 spec + dev-roadmap

---

## 🎯 关键指标

| 指标 | 目标 |
|---|---|
| PII 检测召回率 | ≥ 99% |
| 数据脱敏覆盖率 | 100% (出口流量) |
| 用户删除 SLA | < 30 天 |
| 审计日志不可篡改 | 100% (哈希链) |
| i18n 语言覆盖 | ≥ 3 (zh/en/ja) |
| 区域故障切换 | < 30s |

---

## 🚧 技术风险

1. **PII 检测误报** - 电话号码正则 vs 业务订单号冲突
2. **审计日志性能** - 哈希链 append-only 写入开销
3. **跨区域一致性** - 强一致 vs 最终一致 trade-off

---

> 创建: 2026-06-26 04:55 CST · Pulse-78
> 状态: ⏳ 待启动
