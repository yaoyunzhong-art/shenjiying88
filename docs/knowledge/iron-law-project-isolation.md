# 🔴 铁律：项目隔离（2026-07-22 大飞哥指令）

> 神机营 SaaS（shenjiying88）与旧项目完全无关。
> 违者撤销全部产出，立即上报龙虾哥/大飞哥。

## 核心规则

| # | 规则 | 违反后果 |
|:-:|:-----|:---------|
| 1 | **只认 shenjiying88** — 所有开发、搜索、grep、fetch 必须在 `/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88` 下 | 撤销当轮产出 |
| 2 | **旧项目禁止访问** — 不得读取/编辑/引用/搜索 `shenjiying-saas` 或 `sports-ant-saas` 的任何文件 | 撤销当轮产出 + 上报龙虾哥 |
| 3 | **workspace 隔离** — `.openclaw/workspace/sports-ant-saas` 目录不可作为任何操作的根路径 | 撤销当轮产出 |
| 4 | **路径验证** — 每次 exec/cp/mv/grep/find 操作前，确认 cwd 或路径在 shenjiying88 下 | 违反一次警告，两次撤销 |

## 已归档项目列表

| 项目 | 路径 | 状态 | 用途 |
|:-----|:-----|:----:|:-----|
| ❌ shenjiying-saas | `/Users/yaoyunzhong/Desktop/shenjiying-saas` | 🔴 永久归档 | 旧版项目，无任何关系 |
| ❌ sports-ant-saas | `/Users/yaoyunzhong/.openclaw/workspace/sports-ant-saas` | 🔴 永久归档 | 旧版项目，无任何关系 |

## 正确路径

```
✅ 当前唯一活跃项目:
   /Users/yaoyunzhong/Desktop/shenjiying/shenjiying88
   别名: 神机营 SaaS · shenjiying88 · m5
```

## 工作区隔离

`.openclaw/workspace/` 下的 sports-ant-saas 目录仅保留作为历史参考快照，**不得**作为任何开发操作的依据。

---

> 铁律时间: 2026-07-22 10:07 GMT+8
> 签发人: 大飞哥
> 执行人: 龙虾哥 + 所有树哥
