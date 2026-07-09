# 📊 技术债跟踪 (2026-07-09)

## 一、P0 - 紧急

| ID | 债项 | 影响Phase | Champion | 状态 | 备注 |
|:--:|------|:---------:|:--------:|:----:|:----:|
| P0-001 | @m5/api 分包 | P-35/P-36 | E44周技术 | ⚠️ 持续 | ~18天+ |
| P0-002 | 子服务级 spec 覆盖率 52.4% | 全Phase | E44周技术 | 🔴 新发现 | 122 spec / 233 service |

## 二、P1 - 重要

| ID | 债项 | 影响Phase | Champion | 状态 |
|:--:|------|:---------:|:--------:|:----:|
| P1-001 | E2E测试覆盖不足 (33模块无E2E) | 全Phase | E44周技术 | 🟡 |
| P1-002 | P-44开放API 角色测试不全 | P-44 | E38沈监管 | 🟡 |
| P1-003 | P-25~34 前端页面缺失 | P-25~34 | E44周技术 | 🟡 |
| P1-004 | 知识库竞品数据周更新 | P-39/P-47 | E42+E43 | 🟡 |

## 三、Service.spec 逐清单 (2026-07-09 审计)

> 审计时间: 2026-07-09 08:00 · 审计人: 子代理 e323ef0a
> 分析: 115模块目录, 233个 .service.ts, 122个 .service.spec.ts
> 模块级覆盖率: 115/115 = 100% ✅ 子服务级覆盖率: 122/233 = 52.4% 🔶

### 3.1 完全达标模块 (1 service : 1 spec)
68 个模块完全对齐，无需操作 ✅

### 3.2 多服务缺独立 spec（需增补）

| 模块 | 服务数 | spec数 | 待补数 | 备注 |
|:----|:----:|:----:|:----:|:-----|
| reports | 15 | 1 | 14 | 库存周转/营收/退款/转化率等15服务仅1个spec |
| foundation | 10 | 1 | 9 | 治理/身份/配置/弹性等10服务仅1个spec |
| cashier | 6 | 1 | 5 | 收银+支付+退款+离线同步+订单共6服务仅1个spec |
| compliance | 6 | 1 | 5 | GDPR/审计日志/PII脱敏等6服务仅1个spec |
| ai-cs | 6 | 1 | 5 | AI客服/意图/会话/转接等6服务仅1个spec |
| ai-model-config | 5 | 1 | 4 | 模型配置/快照/热重载/保险库/推荐共5服务仅1个spec |
| analytics-v2 | 5 | 1 | 4 | 分析V2/群组/留存/漏斗/指标共5服务仅1个spec |
| finance | 5 | 1 | 4 | 财务+对账+AI记账+支付+看板共5服务仅1个spec |
| openapi | 5 | 1 | 4 | OpenAPI+API Key+沙箱+Webhook+用量共5服务仅1个spec |
| performance | 5 | 1 | 4 | 性能+缓存/DB优化/K8s伸缩/K6共5服务仅1个spec |
| recommend | 5 | 1 | 4 | 推荐+冷启动+缓存+多样化+评分共5服务仅1个spec |
| e2e-auto-gen | 4 | 1 | 3 | 自动运行器/解析器/生成器+主服务共4服务仅1个spec |
| inventory | 4 | 1 | 3 | 库存管理/物资/商品/项目共4服务仅1个spec |
| knowledge | 4 | 1 | 3 | 知识库+索引器+文档解析+多模态嵌入共4服务仅1个spec |
| recommender | 4 | 1 | 3 | 推荐器+上下文+个性化+RAG检索共4服务仅1个spec |
| tenant | 4 | 1 | 3 | 租户+生命周期/隔离/配额共4服务仅1个spec |
| agent | 3 | 1 | 2 | Agent+事件存储+事件缓冲共3服务仅1个spec |
| coupon | 3 | 1 | 2 | 优惠券+联盟/智能分发共3服务仅1个spec |
| permission | 3 | 1 | 2 | 权限+RBAC+数据范围共3服务仅1个spec |
| points | 3 | 1 | 2 | 积分+原子操作+风控共3服务仅1个spec |
| tournament | 3 | 1 | 2 | 赛事L1-L4/L5-L7+通用共3服务仅1个spec |
| i18n | 3 | 1 | 2 | i18n+区域路由+扩展共3服务仅1个spec |
| auth | 3 | 1 | 2 | 认证+会话+令牌共3服务仅1个spec |

### 3.3 需补1个独立spec的模块

| 模块 | 服务数 | spec数 | 待补 |
|:----|:----:|:----:|:----:|
| ai-marketing | 2 | 1 | 1 |
| ai-push | 2 | 1 | 1 |
| alliance | 2 | 1 | 1 |
| campaign | 2 | 1 | 1 |
| chain | 2 | 1 | 1 |
| edge | 2 | 1 | 1 |
| iot | 2 | 1 | 1 |
| lineage | 2 | 1 | 1 |
| lowcode | 2 | 1 | 1 |
| lyt | 2 | 1 | 1 |
| marketing | 2 | 1 | 1 |
| member | 2 | 1 | 1 |
| multi-region | 2 | 1 | 1 |
| realtime | 2 | 1 | 1 |
| sandbox | 2 | 1 | 1 |
| security | 2 | 1 | 1 |
| shared | 2 | 1 | 1 |
| tenant-llm | 2 | 1 | 1 |
| time-series | 2 | 1 | 1 |

**汇总**: 43个模块需增补合计 ~112 个独立 service.spec
**最大缺口**: reports(缺14), foundation(缺9), cashier(缺5), compliance(缺5), ai-cs(缺5)
