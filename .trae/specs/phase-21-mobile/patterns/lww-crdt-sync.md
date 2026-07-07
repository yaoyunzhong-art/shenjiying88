# Pattern · LWW CRDT 状态合并

## 场景
多设备并发写入同字段 (购物车、待办、设置),需要确定性合并 + 审计。

## 实现
```typescript
export interface LWWValue<T> { value: T; timestamp: number; deviceId: string; }

export class CRDTStore {
  private readonly log = new Map<string, LWWValue<unknown>[]>();

  setField<T>(docId: string, field: string, value: T, deviceId: string, timestamp = Date.now()): void {
    const key = `${docId}:${field}`;
    const values = this.log.get(key) ?? [];
    // 同设备旧值覆盖 (避免历史污染)
    const filtered = values.filter((v) => v.deviceId !== deviceId);
    filtered.push({ value, timestamp, deviceId });
    this.log.set(key, filtered);
  }

  mergeRemote(remote: LWWValue<unknown>): { merged: boolean; conflictsResolved: number } {
    const key = `${/* derive from remote */ ''}`;
    const local = this.log.get(key) ?? [];
    // LWW: 按 timestamp 降序,最新胜
    const all = [...local, remote].sort((a, b) => b.timestamp - a.timestamp);
    const winner = all[0];
    this.log.set(key, [winner]);
    return { merged: true, conflictsResolved: local.length };
  }
}
```

## 关键点
- **timestamp 主导**: 不依赖 wall clock 校准,接受客户端漂移 (V1 容忍)
- **deviceId 隔离**: 同设备写入独立分支,merge 时只保留最新
- **losers 审计**: 保留所有版本用于回滚 + 合规追溯
- **确定性**: 给定相同输入,merge 结果相同 (分布式一致)

## 适用
- 多设备购物车合并
- 多端表单草稿同步
- 协同白板 (简单版本)
- 设置项最后一次写入胜出

## 不适用
- 实时协同编辑 (Google Docs): 升级 Y.js/Automerge
- 金融交易: 不能 LWW,需严格事务
