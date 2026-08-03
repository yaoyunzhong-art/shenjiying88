# tax — 税务计算模块

## 端点
| 方法 | 路径 | 说明 |
|:-----|:-----|:-----|
| POST | `/tax/calculate` | 单笔税务计算 |
| POST | `/tax/calculate/batch` | 批量税务计算 |

## 实体
- TaxCalculationRequest/Result: 税务计算
- BatchTaxRequest/Result: 批量计算

## V23 完成
- ✅ 单笔 + 批量税务计算
- ✅ Entity + Service + Controller + Module
- ⏳ Prisma 持久化 (内存存储)
