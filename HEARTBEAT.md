# 🦞 龙虾哥心跳 Checklist — V23持续轮转版

## 持续轮转任务 (Day12→DayN)
每30分钟自动切换一个任务，循环执行：

| 轮次 | 任务 | 命令 |
|:-----|:-----|:-----|
| A | 6道门全量审计 | TSC + P-38 + as any + 污染 + Git + 测试采样 |
| B | api模块测试补充 | 选1个零测试模块 + 写spec.ts |
| C | admin-web测试补充 | 选1个零测试页面 + 写test.tsx |
| D | 代码干净度扫描 | grep console.log/debugger/eval → 修复 |
| E | 安全审计 | audit + 漏洞修复 |
| F | 文档更新 | README / API文档 / ADR |

## 心跳检查要点
1. ✅ 项目健康: shenjiying88 TSC零错误
2. ✅ 工作区: 0 unstaged
3. ✅ commits: Git push成功
4. ✅ 阿里云: 跳过部署
5. ✅ 店A倒计时: ~4天 (7/31)
