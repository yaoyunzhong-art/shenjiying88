# Debug Session: storefront-3011-down

## Status
- [OPEN]

## Symptom
- `apps/storefront-web` 对外页面 `http://127.0.0.1:3011/`、`/cashier`、`/self-recharge` 均显示“服务不可用”。
- 浏览器侧观测为 `chrome-error://chromewebdata/` 与 `net::ERR_CONNECTION_REFUSED`。
- `apps/api` 的 `3001` 已可响应，请求 `foundation/bootstrap` 时返回 `401 Missing x-tenant-id header`，说明后端在线。

## Expected
- `storefront-web` 能稳定监听 `3011`。
- `/cashier` 可打开并进入真实商品加载链。
- `/self-recharge` 可打开并进入真实下单/跳转 H5 payment 链。

## Hypotheses
1. `storefront-web` dev server 根本没有成功监听 `3011`。
2. `storefront-web` 启动后立即因运行时异常退出。
3. Next 路由树中仍存在新的非法页面导出或运行时炸点，导致服务启动失败。
4. 当前工具环境中的 `trae-sandbox` 包装导致启动命令未真正执行，属于启动通道问题而非业务代码问题。

## Evidence Collected
- 浏览器实测 `http://127.0.0.1:3001/api/v1/foundation/bootstrap` 可达，返回 `401`。
- 浏览器实测 `http://127.0.0.1:3011/`、`/cashier`、`/self-recharge` 不可达，均为 `ERR_CONNECTION_REFUSED`。
- 已修复 `app/[...storeScope]/loading.tsx` 缺少默认导出组件的问题，但 `3011` 仍未恢复。

## Next Step
- 只做运行时取证：确认 `3011` 是否被监听、前端服务是否存在启动后退出、以及是否还有新的 Next 启动错误。
