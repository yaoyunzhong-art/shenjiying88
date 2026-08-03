# Debug Session: g7-browser-capture

## Status
- [OPEN] 2026-07-19 初始化调试会话

## User Request
- 诊断 `scripts/g7-browser-capture.ts`
- 确认 `Playwright` / `tsx` / 浏览器是否可运行
- 尽量产出三张 PNG
- 返回阻塞点、命令结果、文件路径

## Falsifiable Hypotheses
1. `tsx` 依赖缺失、未安装或入口脚本解析失败，导致脚本无法启动。
2. `playwright` 或其浏览器二进制未安装完整，导致浏览器无法启动。
3. 脚本依赖的目标 URL、本地服务或环境变量缺失，导致页面无法打开或截图失败。
4. 脚本本身存在参数、路径、权限或输出目录问题，导致运行成功但 PNG 未落盘。
5. macOS 当前运行环境可启动 `tsx` 与 `playwright`，但脚本内部选择的浏览器通道或启动参数与本机不兼容。

## Planned Evidence
- 阅读脚本与根 `package.json`
- 检查 `node_modules`、`tsx`、`playwright` 解析结果
- 执行脚本并记录 stdout/stderr、退出码
- 搜索生成的 `.png` 文件与输出目录

## Notes
- 当前阶段不修改业务逻辑，仅收集运行证据。
