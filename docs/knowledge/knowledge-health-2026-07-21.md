# 知识仪表盘存活报告 — 2026-07-21

> 自动检测时间: 2026-07-21 08:54:41 CST
> 来源: scripts/knowledge-health-check.sh (V23 G11 条件#2)

## 探针结果

| 探针 | 端点 | 状态 |
|:-----|:-----|:-----|
| 知识仪表盘 | `http://127.0.0.1:8098` | ⚠️ WARN |
| 知识API健康 | `http://127.0.0.1:3000/api/v1/empower-cards/health` | ⚠️ WARN |

## 整体判定

- **结果**: **FAIL** (部分异常)
- **通过**: 0/2

## API 健康响应

```json
{"success":false,"message":"invalid input syntax for type uuid: \"health\"","data":null,"timestamp":"2026-07-21T00:54:41.491Z"}
```

## 备注

- 本报告由 `scripts/knowledge-health-check.sh` 自动生成
- 知识仪表盘端口 `8098` 由知识仪表盘服务监听
- 知识 API 健康端点挂载于 `/api/empower-cards/health`
- V23 G11 审计条件 #2: 知识API存活监控 (health check + 日采可观测性)
