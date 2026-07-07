# DR-011 · 审计日志设计 (Append-Only Hash Chain)

## 状态
已接受 (2026-06-26, Pulse-80)

## 背景
GDPR/网络安全法/等保均要求关键操作可追溯、不可篡改。

## 决策
1. **Hash Chain**: 每条 hash = sha256(prevHash + canonicalJSON(payload))
2. **canonicalJSON**: keys 排序后序列化,确保 hash 稳定
3. **Genesis Hash**: `'0'.repeat(64)` 作为链起点
4. **默认保留期 7 年**: 满足 GDPR Art.5(1)(e) 和等保三级
5. **导出前 verify**: 任何篡改检测后立即拒绝导出

## 后果
- ✅ 任何中间条目篡改可检测 (O(n) verify)
- ✅ append-only: 无 update/delete API,根除误改
- ⚠️ 存储成本: 每条 ~500B,10 亿条 ≈ 500GB
- ⚠️ V2 需落 PostgreSQL append-only table + WAL

## 替代方案
- 区块链 (Ethereum/Hyperledger): 过度,合规审计无需去中心化
- 关系数据库 trigger: 可被 DBA 绕过
- 选择: in-memory hash chain + 未来落 DB
