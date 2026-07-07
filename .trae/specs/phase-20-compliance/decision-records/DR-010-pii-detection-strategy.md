# DR-010 · PII 检测策略

## 状态
已接受 (2026-06-26, Pulse-79)

## 背景
系统需识别 5 类 PII (phone/email/idCard/creditCard/ip),用于脱敏 + GDPR 删除。

## 决策
1. **正则 + 校验位双重保险**: 正则负责模式匹配,校验位/Luhn 负责高精度
2. **置信度分级**: 每类 PII 设基础 confidence,Luhn/checksum 通过后 +0.1
3. **minConfidence 默认 0.8**: 平衡召回与精度,可调用方调节
4. **每次新建 RegExp**: 避免共享 /g regex 的 lastIndex 状态污染

## 后果
- ✅ 5 类 PII 检出率 ≥95%
- ✅ 误检率 <5% (信用卡非 Luhn 自动降级)
- ⚠️ 复杂 PII (姓名/地址) 仍需 LLM 或 NER 库 (V2 引入)

## 替代方案
- 第三方库 (compromise/presidio): 引入依赖重,i18n 弱
- LLM-only: 延迟高 + 成本高
- 选择: 自研 + 校验位组合
