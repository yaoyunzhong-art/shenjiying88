# ai — AI 分析微服务

## 端点
| 方法 | 路径 | 说明 |
|:-----|:-----|:-----|
| POST | `/ai/analyze` | 文本综合分析 (类别+情感+关键词) |
| POST | `/ai/sentiment` | 情感打分 |
| POST | `/ai/keywords` | 关键词提取 |

## 实现
- 内存数据源模拟AI推理
- 可切换为真实LLM/ML服务
