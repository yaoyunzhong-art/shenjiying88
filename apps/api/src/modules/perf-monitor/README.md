# Perf Monitor 性能监控

> 性能监控与 SLA 管理服务

## 功能
- 性能数据记录
- SLA 配置与管理
- 性能统计查询

## 依赖
- AgentModule

## API
- POST /perf-monitor/record — 记录数据
- POST /perf-monitor/sla — SLA 配置
- GET /perf-monitor/stats — 统计
- GET /perf-monitor/stats/all — 全部统计
- GET /perf-monitor/summary — 概览
