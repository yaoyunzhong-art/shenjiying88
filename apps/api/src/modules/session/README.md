# Session 会话

> 用户会话管理服务，支持会话创建、验证与吊销

## 功能
- 会话创建
- 会话验证
- 单/全部会话吊销

## 依赖
- AgentModule

## API
- POST /session — 创建会话
- POST /session/validate — 验证
- POST /session/revoke — 吊销
- POST /session/revoke-all — 全部吊销
- GET /session/user/:userId — 用户会话
