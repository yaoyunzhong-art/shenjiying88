# testing-system — 自动化测试系统

## 模块概述

`testing-system` 是神机营 SaaS **全自动化的测试体系主目录**，提供 7×16 小时不间断的自动化测试运行与管理能力。该体系以 `testing-master.sh` 为主控脚本，整合了调度器、监控器、报告生成器、用例注册中心与健康检查模块，支持后台静默执行、定时轮询与深度测试。

核心能力：
- **调度引擎**：`testing-system/scheduler/` 支持定时任务、24 小时 shift 窗口管理与测试运行器，通过 `.scheduler.pid` 实现进程级守护
- **测试用例框架**：`testcases/testing-framework.ts` + `test-case-registry.ts` 提供 TypeScript 驱动的结构化测试用例定义与注册
- **监控告警**：`monitoring/monitoring.ts` 实时采集测试指标，`health/` 子模块定期执行健康检查并记录日志
- **报告生成**：`reporting/report-generator.ts` 自动汇总测试结果，输出 Markdown 格式日报/深度测试报告/问题清单
- **CI 集成**：通过 `scripts/run-full-deep-test.sh` 一键触发全量深度测试，支持与 pnpm 流水线对接

## 技术栈

| 组件 | 用途 |
|------|------|
| Bash 4+ | 主控脚本与调度器 |
| TypeScript | 测试用例框架、监控器、报告生成器 |
| Node.js | 运行时环境 |
| pnpm | 包依赖管理 (如接入 API 测试) |
| PM2 / 后台进程 | 进程守护与日志管理 |
| Cron | 定时触发测试轮次 |
| Markdown | 测试报告输出格式 |

## 快速开始

```bash
# 1. 安装测试体系
bash testing-system/install.sh

# 2. 启动测试体系 (带调度器)
bash testing-system/testing-master.sh start

# 3. 查看运行状态
bash testing-system/testing-master.sh status

# 4. 停止测试体系
bash testing-system/testing-master.sh stop

# 5. 一键全量深度测试
bash testing-system/scripts/run-full-deep-test.sh

# 6. 查看最新测试报告
cat testing-system/reports/*.md | tail -50
```

## 目录结构

```
testing-system/
├── testing-master.sh            # 主控脚本 (启动/停止/状态/安装/卸载)
├── install.sh                   # 环境检查与安装程序
├── .heartbeat                   # 心跳文件
├── .scheduler.pid              # 调度器 PID 文件
├── scheduler/
│   ├── testing-scheduler.sh     # 定时调度器
│   └── lib/
│       ├── lib-test.sh          # 测试辅助库
│       ├── shift-window.sh      # 24 小时 shift 窗口管理
│       └── test-runner.sh       # 测试运行器
├── testcases/
│   ├── testing-framework.ts     # 测试框架核心
│   └── test-case-registry.ts    # 用例注册中心
├── monitoring/
│   └── monitoring.ts            # 实时监控采集
├── reporting/
│   └── report-generator.ts      # 报告生成器
├── health/
│   └── run-health-check.sh      # 健康检查脚本
├── scripts/
│   └── run-full-deep-test.sh    # 全量深度测试入口
├── logs/                        # 运行日志
│   ├── scheduler/               # 调度日志
│   └── health/                  # 健康检查日志
├── reports/                     # 测试报告
│   ├── daily-*.md               # 日报
│   ├── deep-test-report-*.md    # 深度测试报告
│   ├── full-system-test-report-*.md  # 全量系统测试报告
│   ├── test-summary-*.md        # 测试摘要
│   └── issues-*.md              # 问题清单
├── testing-system/              # 历史数据 (独立子目录)
│   ├── logs/
│   └── reports/
└── .pids/                       # 进程文件
```

## 圈梁检查点清单

- [ ] `testing-master.sh start` 成功后，确认 `.scheduler.pid` 存在且进程存活
- [ ] 调度器日志 (`logs/scheduler/`) 显示每轮调度正常执行无超时
- [ ] 健康检查模块 (`health/run-health-check.sh`) 能通过所有预检项
- [ ] TypeScript 测试用例文件可通过 `npx ts-node` 编译运行，无类型错误
- [ ] 报告生成器输出的 Markdown 文件包含完整的 case pass/fail/skip 统计数据
- [ ] shift-window 配置的窗口期与团队值班排班一致 (默认为早 8 点至晚 12 点)
- [ ] Cron 定时任务已注册并可正常触发 (`crontab -l` 查看)
- [ ] `install.sh` 执行后目录结构完整，脚本执行权限正确
- [ ] `dump.rdb` 为测试状态持久化文件，不应被 git commit 误包含
- [ ] 监控模块的指标采集频率 ≤ 30s，日志轮转策略已配置
