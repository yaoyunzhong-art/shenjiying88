# AI 模块 (Artificial Intelligence)

## 用途
AI 智能分析引擎与推荐系统。提供文本分析（情感评分、类别分类、关键词提取）、D3 智能推荐（发现/决策/推送）、用户反馈管理。覆盖 AI 推理核心能力与门店体验优化场景。

## 关键端点
| 路由 | 说明 |
|------|------|
| `POST /ai/analyze` | 综合分析（类别+情感+关键词） |
| `POST /ai/classify` | 文本分类 |
| `POST /ai/sentiment` | 情感评分 |
| `GET/POST /ai/d3/recommendations` | D3 智能推荐（上下文感知） |
| `GET /ai/d3/trending` | 热门内容推荐 |
| `GET/POST /ai/d3/personal-picks` | 个性化选品 |
| `POST /ai/d3/filters` | 规则过滤决策 |
| `POST /ai/d3/score` | 评分排序 |
| `GET /ai/d3/collaborate` | 协同过滤 |
| `POST/GET /ai/feedback` | 用户反馈提交与查询 |

## 测试位置
`apps/api/src/modules/ai/` — **3** 个测试文件：E2E (`.e2e.test.ts`)、角色扩展测试（`.role-extended.test.ts`），以及 `d3/` 子目录下控制器+服务测试 2 个。
