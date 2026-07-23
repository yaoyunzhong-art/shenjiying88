# testing-system — 自动化测试系统

## 模块简介

`testing-system/` 是神机营 SaaS 的全自动化测试体系主控目录，提供 7×16 小时不间断的自动化测试运行与管理。以 `testing-master.sh` 为主控脚本，整合调度器、监控器、报告生成器、用例注册中心与健康检查模块，支持后台静默执行与定时轮询。

## 目录结构

```
testing-system/
├── testing-master.sh            # 主控脚本（启动/停止/状态/安装）
├── install.sh                   # 环境安装程序
├── scheduler/                   # 定时调度器与运行器
├── testcases/                   # 测试用例框架 + 用例注册中心
├── monitoring/                  # 实时监控采集模块
├── reporting/                   # 报告生成器（Markdown 日报/深度报告）
├── health/                      # 健康检查模块
├── scripts/                     # 测试工具（如全量深度测试入口）
├── logs/                        # 运行时日志（调度/健康）
├── reports/                     # 生成的测试报告
└── testing-system/              # 历史数据子目录
```

## 使用方式

```bash
# 启动测试体系
bash testing-system/testing-master.sh start

# 查看状态
bash testing-system/testing-master.sh status

# 一键全量深度测试
bash testing-system/scripts/run-full-deep-test.sh

# 查看最新报告
cat testing-system/reports/*.md | tail -50
```

## 注意事项

- 启动前确保 Node.js 环境正常，TypeScript 测试用例可编译通过
- 调度器窗口默认为早 8 点至晚 12 点，可在 `lib/shift-window.sh` 调整
- 监控指标采集频率 ≤ 30s，日志使用轮转策略避免磁盘占满
- `dump.rdb` 为测试状态持久化文件，勿提交至版本控制
