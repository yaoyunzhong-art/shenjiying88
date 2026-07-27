# docs/quality — 质量体系文档

> **模块**: 文档体系 | **位置**: `docs/quality/`
>
> 神机营 SaaS 的质量保障体系文档目录，涵盖测试策略、验收标准、VRT（视觉回归测试）规范、质量报告等。是确保平台交付质量的核心参考。

## 文件清单

```
docs/quality/
├── README.md                            # 本文件 — 质量体系索引
└── VRT-ACCEPTANCE-PROTOTYPE.md          # VRT 验收原型规范
```

## 核心用途

| 文件 | 说明 |
|------|------|
| `VRT-ACCEPTANCE-PROTOTYPE.md` | 视觉回归测试（VRT）验收原型文档，定义 VRT 流程、阈值标准、截图对比策略 |

## 使用指南

- **查阅 VRT 规范**: `VRT-ACCEPTANCE-PROTOTYPE.md` — 视觉回归测试的验收标准与执行流程
- **新增质量文档**: 按类型新建文件，如 `test-strategy-<模块>.md`、`qa-checklist-<版本>.md`
- **质量报告**: 如需记录测试覆盖率、缺陷趋势，可在此目录新建 `qa-report-<YYYY-MM>.md`

## 命名规范

| 前缀 | 用途 |
|------|------|
| `VRT-*` | 视觉回归测试相关 |
| `test-strategy-*` | 测试策略文档 |
| `qa-checklist-*` | QA 检查清单 |
| `qa-report-*` | 质量报告 |

## 相关链接

- [docs/acceptance/](../acceptance/) — 验收测试用例
- [docs/README.md](../README.md) — 文档体系根索引
- [testing-system/](../../testing-system/) — 测试系统配置与框架
- [benchmark/](../../benchmark/) — 基准测试数据
