# 推送模块 (Push)

## 用途
多通道推送引擎，支持 APNs（iOS）推送、WebSocket 实时消息、定时推送调度。覆盖模板管理、高优先级紧急通知、设备 token 吊销、WS 重连 session 恢复等场景。

## 关键端点
- `POST /push/send` — 发送推送（iOS/Android/Web）
- `POST /push/send-high-priority` — 高优先级紧急推送
- `POST /push/schedule` — 创建定时推送
- `POST /push/ws/broadcast` — WebSocket 全频道广播
- `GET /push/stats` — 推送统计（发送/失败/活跃连接）

## 测试文件
- `push.controller.test.ts` — 控制器测试
- `push.service.test.ts` — 服务层测试
- `push.e2e.test.ts` — E2E 集成测试
- `push.contract.test.ts` — 合同测试
- `push.dto.test.ts` — DTO 校验测试
- `push.role.test.ts` / `push.role-extended.test.ts` — 角色权限测试
- `push.role-v3.test.ts` / `push.role-missing.test.ts` — 角色扩展测试
- `push.entity.test.ts` / `push.module.test.ts` — 实体/模块测试
- `push-ringbeam.test.ts` — 环形测试
