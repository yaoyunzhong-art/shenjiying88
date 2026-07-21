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
- 已全量扫描 `apps/storefront-web/app/**/loading.tsx`，未发现其他缺少默认导出组件的 `loading.tsx` 文件。
- 仓库内显式端口证据表明 `storefront-web` 常见启动端口为 `3003`，而非 `3011`：
  - `scripts/performance-baseline.sh` 使用 `STOREFRONT_PORT=3003`
  - `Dockerfile` 中 `storefront-prod` 也固定 `PORT=3003`
- 浏览器对 `3003` 与 `3011` 的 `/`、`/cashier`、`/self-recharge` 复测均为 `ERR_CONNECTION_REFUSED`，说明当前两个端口都没有 storefront 服务监听。
- `apps/storefront-web` 根启动链已排查：
  - `app/layout.tsx` 无顶层副作用或异常抛出
  - `app/page.tsx` 无顶层 `throw` / 无非法 UI import
  - `@m5/ui` 中 `PageShell` / `Button` / `Card` / `Tag` 均存在有效导出

## Rejected Hypotheses
- 假设 3：Next 路由树里还有别的 `loading.tsx` 缺省导出炸点
  - 当前证据：已排除
- 假设 3 扩展：根布局/首页顶层代码启动即崩
  - 当前证据：已排除

## Leading Hypotheses
1. `storefront-web` dev server 根本没有被成功启动。
2. 启动命令在当前工具环境中被 `trae-sandbox` 包装失败，导致服务未真正执行。
3. `storefront-web` 可能由外部任务/脚本启动在不同端口，但当前 `3003/3011` 均未监听。

## Next Step
- 继续只做运行时取证：围绕 `storefront-web` 启动通道收证，确认是否存在外部任务拉起失败、启动命令被壳层拦截、或真实监听端口偏移。
