# V23 WP-07 PRD: 开放平台与ISV

> P2 · 前置：WP-02A ✅ WP-02B ✅ WP-03A ✅

## 概述
ISV生态底座：应用注册审核、API密钥(HMAC-SHA256)、频控、SDK、版本、计费、SLA、开发者、应用市场。

## 需求 (BS-0100~BS-0113)
- API网关：应用全生命周期+密钥管理+签名校验+频控
- SDK：版本管理+文档
- 版本：v1/v2+废弃提醒
- 计费：调用计费+SLA违约+开发者结算
- 生态：开发者后台+应用市场

## 数据结构
IsvApp/IsvDeveloper/ApiKeyRecord/ApiCallRecord/SlaContract/BillingRecord/ApiVersion/SdkVersion/MarketplaceItem

## 测试
51/51 ✅
