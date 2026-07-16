[OPEN] api-bootstrap-hang

## Symptoms
- `pnpm exec ts-node --project apps/api/tsconfig.json apps/api/src/main.ts` 进程常驻不退出。
- `[bootstrap] creating Nest app` 已打印，但 `[bootstrap] Nest app created` 未出现。
- 大量模块 `dependencies initialized` 已完成，但 `3001` 端口未监听。
- `DbKnowledgeService` 迁移已成功，不再是当前主阻塞。

## Hypotheses
1. 某个 `OnModuleInit` 的异步初始化 Promise 没有返回，导致 `NestFactory.create()` 一直等待。
2. 某个 Prisma 驱动查询在启动阶段发起，但因为仓库/表/事务状态异常而悬挂未完成。
3. 某个动态模块或 provider 在初始化时等待外部资源，事件循环处于 idle，但顶层 Promise 未 resolve。
4. 启动链中存在少数本地开发不必要的初始化逻辑，需要开发态降级才能完成 bootstrap。

## Evidence
- `bootstrap` 过滤日志仅看到 `creating Nest app`，未见 `Nest app created`。
- `sample` 结果显示主线程停在 `uv__io_poll -> kevent`，说明不是 CPU 死循环，而是在等待异步结果。
- 采样中出现多个 `libquery_engine-darwin-arm64` 线程，说明 Prisma 相关工作线程已参与启动流程。

## Next
- 给最可疑的异步 `onModuleInit()` 打 `begin/end` 标记。
- 复现后确认最后一个成功返回的初始化点。
- 对命中的模块做最小开发态降级或超时兜底。
