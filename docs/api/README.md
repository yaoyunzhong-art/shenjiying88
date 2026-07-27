# 📡 API 文档目录

## 用途说明

本目录存放 M5 平台（数字运动潮玩平台 SPORTS ANTS）的 API 规范文档，是前后端联调、第三方集成与接口测试的核心依据。所有 API 定义遵循 OpenAPI 3.0.3 规范，涵盖多租户认证、Bearer Token / API Key 鉴权及完整路由定义。

## 内容说明

当前仅包含一个核心文件：

- **`openapi-spec.yml`** — 完整的 OpenAPI 3.0.3 规范文件，定义了 M5 平台全部 RESTful 接口（包括用户认证、场馆管理、订单、支付、活动等模块），包含请求/响应 Schema、参数约束、状态码及错误码说明。

## 如何使用

1. **本地预览**：使用 [Swagger Editor](https://editor.swagger.io/) 或 `swagger-cli` 导入 `openapi-spec.yml` 即可可视化浏览所有接口。
2. **代码生成**：通过 [OpenAPI Generator](https://openapi-generator.tech/) 可自动生成前后端 SDK（TypeScript / Java / Python 等）。
3. **测试驱动**：搭配 Postman / Insomnia 集成本规范，可一键导入并执行接口测试。
4. **维护约定**：API 端点的增删改必须在 `openapi-spec.yml` 中同步更新，保持规范与实现始终一致。
