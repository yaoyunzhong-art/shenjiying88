# docs/experts — 专家目录 & 模板

> **模块**: 文档体系 | **位置**: `docs/experts/`
>
> 神机营 SaaS 的业务专家档案与评审模板仓库。对应 V5.1 "业务专家团"体系（E1-E40），记录各领域专家的背景、职责、决策记录与反馈日志。同时存放评审模板、月审报告等专家活动产出物。

## 文件清单

```
docs/experts/
├── README.md                           # 本文件 — 专家目录索引
└── monthly-review-2026-06.md           # 2026年6月专家月审报告
```

## 核心用途

| 文件 | 说明 |
|------|------|
| `monthly-review-2026-06.md` | E 级专家月审报告，汇总当月专家评审结果、分歧决策、关键意见 |

## 使用指南

- **查阅专家月审**: `monthly-review-*.md` — 每月的专家评审汇总与关键决策记录
- **新增专家档案**: 新建 `E<编号>-<角色>.md` 文件，参考 `docs/expertise/` 的专家知识结构
- **评审模板**: 如需新增评审模板，在本目录创建 `review-template-*.md` 文件

## 注意事项

- 专家档案命名约定：`E<编号>-<领域英文名>.md`（如 `E1-architect.md`）
- 月审文件命名约定：`monthly-review-<YYYY-MM>.md`
- 专家档案的详细知识积累存放于 `docs/expertise/`，此目录仅存放索引与评审活动记录

## 相关链接

- [docs/expertise/](../expertise/) — 领域专家知识体系
- [docs/README.md](../README.md) — 文档体系根索引
- [.trae/specs/expert-council-empowerment/](../../.trae/specs/expert-council-empowerment/) — 专家委员会赋能规格
