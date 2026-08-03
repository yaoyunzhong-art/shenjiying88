# V23 · WP-01A · LYT 适配层框架

> **状态**: 实施中 | **优先级**: P0 | **对应 BS**: BS-0021~BS-0029  
> **子阶段**: A（M5 内部能力，不依赖真实接口文件）  
> **blocker_id**: BLK-LYT-001  
> **blocked by missing LYT api spec**

## 一、业务背景

LYT 电玩城 + 数字运动潮玩馆管理系统 是 M5 核心外部系统之一，负责：
- 门店场地与设备管理
- 会员/订单/支付对接
- 门禁与投屏控制
- Webhook 事件回调与轮询

当前外部接口文件（请求/响应字段、签名算法、错误码表、回调契约）仍未到位，因此只能实现 **A 段**：M5 内部的适配器框架层。

## 二、范围

| 编号 | 能力 | 说明 | 状态 |
|:--|:--|:--|:--:|
| BS-0021 | 配置模型 | LYTConfig (endpoint/超时/重试/证书/签名) | ✅ |
| BS-0022 | 适配器接口 | ILYTAdapter (连接/查询/操作/签名/轮询/回调) | ✅ |
| BS-0023 | 签名插槽 | sign/verifySignature/decrypt 接口壳 | ✅ |
| BS-0024 | Webhook 路由壳 | 路由定义 + Mock callback handler | ✅ |
| BS-0025 | 超时降级 | 错误分类 + 降级策略配置 | ✅ |
| BS-0026 | 错误包装 | network/protocol/business/unknown 四级 | ✅ |
| BS-0027 | Mock 实现 | 含场地/设备/会员/订单模拟数据 | ✅ |
| BS-0028 | Real 插槽 | 骨架方法，抛出 NotImplementedError | ✅ |
| BS-0029 | 适配器注册表 | Mock/Sandbox/Real 动态切换 | ✅ |

## 三、架构总览

```
┌─────────────────────────────────────────────────────┐
│                  LytAdapterRegistry                   │
│  selectAdapter(connection) → Mock | Sandbox | Real   │
└─────────────────────────────────────────────────────┘
        │                   │                  │
  ┌─────▼──────┐   ┌──────▼───────┐   ┌──────▼───────┐
  │ MockLytAdapt│   │SandboxLytAdapt│   │ RealLytAdapt │
  │ Rich Mock   │   │ HTTP Sandbox │   │ HTTP Prod    │
  │ Data Pools  │   │ + Blocker    │   │ + Blocker    │
  └─────────────┘   └──────────────┘   └──────────────┘
        │                   │                  │
        └───────────────────┼──────────────────┘
                            │
                    ┌───────▼────────┐
                    │ HttpLytAdapter │
                    │ Base (fetch +  │
                    │ retry + sign)  │
                    └────────────────┘

┌─────────────────────────────────────────────────────┐
│               LytConnectionManager                    │
│  per-store connection resolution (store→brand→tenant)│
│  → fallback to mock                                  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│               LytService / LytController              │
│  Business logic + REST endpoints + Webhook handlers  │
└─────────────────────────────────────────────────────┘
```

## 四、关键类型

### ILYTAdapter 接口方法分组

| 分组 | 方法 | 类型 |
|:--|:--|:--:|
| 连接管理 | connect / disconnect / getConnectionStatus | A |
| 基础查询 | getMember / createOrder / applyDiscount / syncGateEvent / getDeviceStatus | 已有 |
| 通用查询 | query (支持过滤/排序/分页/字段选择) | **新增** |
| 通用操作 | operate (create/update/delete/enable/disable/reset/sync) | **新增** |
| 数据校验 | validate | **新增** |
| 场地设备 | getVenues / getDevices | **新增** |
| 扩展信息 | getMemberInfo / getOrderInfo | **新增** |
| 签名 | sign / verifySignature / decrypt | **新增** |
| 轮询 | startPoll / getPollStatus / cancelPoll | **新增** |
| 回调 | handleCallback | **新增** |
| 错误处理 | wrapError / isRetryable / getTimeoutDowngradeConfig | **新增** |

### 错误分类

| 类别 | 适用场景 | 可重试 |
|:--|:--|:--:|
| network | 超时、连接拒绝、Abort | ✅ |
| protocol | 响应解析失败、非 JSON 响应 | ❌ |
| business | 业务拒绝、校验失败 | ❌ |
| unknown | 未分类异常 | ❌ |

### 配置模型（LytFullConfig）

```yaml
lyt:
  <mode>:  # sandbox | real
    endpoints:
      baseUrl: "https://..."
      webhookPathPrefix: "/api/v1/webhooks"
      pollPathPrefix: "/api/v1/poll"
    timeouts:
      connectTimeoutMs: 5000
      readTimeoutMs: 10000
      idleTimeoutMs: 15000
    retry:
      maxRetries: 2
      baseDelayMs: 500
      maxDelayMs: 10000
      exponentialBackoff: true
    cert:
      clientCertPath: ~
      clientKeyPath: ~
      caCertPath: ~
      skipTlsVerify: false
    signing:
      algorithm: "sha256"
      secret: "..."
      ttlSeconds: 300
    cache:
      enabled: true
      ttlMs: 30000
      maxEntries: 1000
```

## 五、阻塞管理

- **阻塞编号**: BLK-LYT-001
- **阻塞标题**: 缺少 LYT 电玩城真实接口文件
- **影响工作包**: WP-01B, WP-04B, WP-05B, WP-12B
- **当前事实**: 未拿到真实请求/响应字段、签名算法、错误码表、Webhook/轮询契约
- **允许继续**: 适配器接口壳、Mock/Real 插槽、配置模型、错误包装与超时降级
- **禁止宣称完成**: 真实协议联调、真实字段映射、真实回调验收

## 六、文件清单

```
apps/api/src/modules/lyt/
├── interfaces/
│   └── lyt-adapter.interface.ts        # ILytAdapter + 所有类型
├── adapters/
│   ├── http-lyt.adapter.base.ts         # HTTP 适配器基类 (已有)
│   ├── mock-lyt.adapter.ts              # Mock 实现 (增强)
│   ├── real-lyt.adapter.ts              # Real 实现 (增强 + Blocker)
│   └── sandbox-lyt.adapter.ts           # Sandbox 实现 (增强 + Blocker)
├── lyt-adapter.config.ts                # 配置模型 (增强)
├── lyt-adapter.registry.ts              # 适配器注册表 (已有)
├── lyt-connection.manager.ts            # 连接管理器 (已有)
├── lyt.controller.ts                    # 控制器 (已有)
├── lyt.service.ts                       # 业务服务 (已有)
├── lyt.module.ts                        # 模块定义 (已有)
├── vendor-lyt.contract.ts               # 厂商契约转换 (已有)
├── lyt.entity.ts                        # 实体定义 (已有)
├── lyt.dto.ts                           # DTO (已有)
└── ...
```

## 七、验收条件

| # | 条件 | 状态 |
|:--|:--|:--:|
| 1 | ILYTAdapter 接口完整可用 (16+ 方法) | ✅ |
| 2 | Mock 适配器可独立运行 (含场地/设备/会员/订单 模拟数据) | ✅ |
| 3 | Real 适配器骨架已就位，明确标记 BLK-LYT-001 阻塞 | ✅ |
| 4 | 超时降级逻辑已验证 (4 级错误分类) | ✅ |
| 5 | 全量配置模型 (endpoint/timeout/retry/cert/signing/cache) | ✅ |
| 6 | TSC 零错误 | 🔲 |
| 7 | 用例全绿 | 🔲 |
| 8 | 工作区干净后 commit | 🔲 |

## 八、PR 合规

```yaml
6-8_refs: [BS-0021, BS-0022, BS-0023, BS-0024, BS-0025, BS-0026, BS-0027, BS-0028, BS-0029]
compliance_statement:
  - BS-0021: 已实现 — LytFullConfig 配置模型
  - BS-0022: 已实现 — ILYTAdapter 全量接口
  - BS-0023: 已实现 — sign/verifySignature/decrypt 插槽
  - BS-0024: 已实现 — Webhook 回调 handleCallback
  - BS-0025: 已实现 — 超时降级策略 + 4级错误分类
  - BS-0026: 已实现 — LytErrorInfo 统一包装
  - BS-0027: 已实现 — MockLytAdapter 含业务数据池
  - BS-0028: 已实现 — RealLytAdapter 骨架 + NotImplementedError
  - BS-0029: 已实现 — LytAdapterRegistry (Mock/Sandbox/Real 切换)
blocker_id: BLK-LYT-001
```
