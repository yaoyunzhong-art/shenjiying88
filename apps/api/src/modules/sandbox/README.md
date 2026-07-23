# Sandbox 沙箱

> 安全沙箱服务，提供隔离环境用于执行与测试

## 功能
- 沙箱创建与销毁
- 沙箱内代码执行
- 沙箱重置

## 依赖
- AgentModule

## API
- POST /sandbox — 创建沙箱
- POST /sandbox/:id/destroy — 销毁
- GET /sandbox/:id/status — 状态
- POST /sandbox/:id/execute — 执行
- POST /sandbox/:id/reset — 重置
