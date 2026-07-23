# Edge 边缘计算

> 边缘节点管理服务，支持边缘节点的注册、发现与 Ticket 管理

## 功能
- 边缘节点 CRUD 管理
- 节点发现与详情查询
- Ticket 工单下发

## API
- GET /edge/nodes — 节点列表
- GET /edge/nodes/:id — 节点详情
- POST /edge/nodes — 注册节点
- DELETE /edge/nodes/:id — 移除节点
- POST /edge/tickets/issue — 下发工单
