# 📝 logs — 日志存放目录

## 模块简介

`logs/` 是神机营 SaaS 平台自动化体系的**日志存放目录**，用于记录后台守护进程、任务同步、资源检查等核心服务的运行日志。日志文件按模块和轮次分类归档，是日常运维排障和任务追溯的关键数据源。

## 目录结构

```
logs/
├── README.md                                  # 本文档
├── resource-check.log                         # 🔍 资源检查日志（机器资源、存储水位）
├── task-sync-alerts.log                       # ⚠️ 任务同步告警日志
├── task-sync-errors.log                       # ❌ 任务同步错误日志
├── task-sync-report.json                      # 📄 任务同步执行报告（JSON 结构）
├── task-sync.log                              # 🔄 任务同步运行日志
├── v6-nightly/                                # 🌙 V6 夜间定轮日志
│   ├── launchd-stderr.log                     #   launchd 守护进程标准错误
│   └── launchd-stdout.log                     #   launchd 守护进程标准输出
└── v6-rhythm/                                 # 🎵 V6 节奏脉冲日志
    ├── launchd-stderr.log                     #   launchd 守护进程标准错误
    ├── launchd-stdout.log                     #   launchd 守护进程标准输出
    └── v6-rhythm-10.log                       #   第10轮节奏日志
```

## 日志分类说明

| 分类 | 文件 | 用途 |
|------|------|------|
| **资源检查** | `resource-check.log` | 定时检查服务器资源使用情况（CPU、内存、磁盘），水位超限时触发告警 |
| **任务同步** | `task-sync-*.log` / `task-sync-report.json` | 记录 cron 调度的任务同步执行过程，包括同步报告 JSON 和错误/告警详情 |
| **V6 夜间定轮** | `v6-nightly/` | 后台 launchd 守护进程的 stdout/stderr，对应夜间批量作业 |
| **V6 节奏脉冲** | `v6-rhythm/` | 后台 launchd 守护进程的 stdout/stderr，对应节奏脉冲式作业 |

## 使用方式

```bash
# 查看最近的资源检查日志
tail -50 logs/resource-check.log

# 查看任务同步错误
cat logs/task-sync-errors.log

# 查看夜间定轮守护进程异常
tail -100 logs/v6-nightly/launchd-stderr.log

# 查看节奏脉冲守护进程异常
tail -100 logs/v6-rhythm/launchd-stderr.log

# 解析任务同步报告
cat logs/task-sync-report.json | jq .
```

## 注意事项

- 日志文件默认权限为 `600`（仅文件所有者可读写），敏感信息请勿明文写入
- launchd 日志由 macOS 系统守护进程自动管理，stdout 通常为空，异常信息出现在 stderr
- 日志文件大小超过阈值时应考虑轮转归档，避免磁盘空间耗尽
- 对于已归档的旧日志，优先移至 `archive/` 子目录或外部存储
