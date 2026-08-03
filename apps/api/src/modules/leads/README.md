# Leads 客户线索

> 客户线索管理与跟进服务，支持线索入库、跟进与规则配置

## 功能
- 线索 Webhook 接入
- 线索跟进管理
- 线索转化关闭
- 线索规则配置

## 依赖
- MarketingMetricsModule, AgentModule

## API
- POST /leads/webhook — Webhook 接入
- GET /leads/:leadId — 线索详情
- POST /leads/follow-up — 跟进
- POST /leads/close/:leadId — 关闭线索
- POST /leads/rules — 规则配置
