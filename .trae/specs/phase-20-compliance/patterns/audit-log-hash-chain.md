# Pattern · 审计日志 Hash Chain

## 场景
需要不可篡改的操作记录 (合规、审计、纠纷处理)。

## 实现
```typescript
class AuditLog {
  private entries: AuditEntry[] = [];
  private GENESIS = '0'.repeat(64);

  append(input: AuditAppendInput): AuditEntry {
    const seq = this.entries.length + 1;
    const prevHash = this.entries.at(-1)?.hash ?? this.GENESIS;
    const payload = { seq, ts: new Date().toISOString(), ...input };
    const hash = sha256(prevHash + canonicalJSON(payload));
    return { ...payload, prevHash, hash };
  }

  verify(): { valid: boolean; brokenAtSeq?: number } {
    let prev = this.GENESIS;
    for (const e of this.entries) {
      if (e.prevHash !== prev) return { valid: false, brokenAtSeq: e.seq };
      if (sha256(e.prevHash + canonicalJSON(payload(e))) !== e.hash) {
        return { valid: false, brokenAtSeq: e.seq };
      }
      prev = e.hash;
    }
    return { valid: true };
  }
}
```

## 关键点
- canonicalJSON: keys 排序,稳定 hash
- Genesis: 全 0 hash 作为链起点
- verify: O(n) 扫描,任何篡改立即检测
- 导出前必 verify,拒绝 tamper 数据流出

## 适用
- GDPR Art.30 活动记录
- 金融交易审计
- 医疗 HIPAA 操作日志
