/**
 * crdt.ts - Phase-21 T57
 * 简化 CRDT - LWW (Last-Write-Wins) + 向量时钟
 *
 * 用于多设备同步: 同一文档在多个设备编辑时,自动合并
 *
 * 数据结构:
 * - 每个字段有 timestamp + deviceId
 * - 合并时: 取每个字段最新版本
 */
export interface LWWValue<T = unknown> {
  value: T;
  /** 写入时间戳 (毫秒) */
  timestamp: number;
  /** 写入设备 ID */
  deviceId: string;
}

export interface VectorClock {
  /** deviceId → 该设备最大时钟值 */
  [deviceId: string]: number;
}

/** 文档 - 字段集合 */
export interface CRDTDocument {
  id: string;
  fields: Record<string, LWWValue>;
  clock: VectorClock;
  updatedAt: number;
}

export class CRDTStore {
  private readonly docs = new Map<string, CRDTDocument>();

  // ── Local ops ──

  /** 本地写入字段 */
  setField<T>(
    docId: string,
    field: string,
    value: T,
    deviceId: string,
    timestamp: number = Date.now(),
  ): CRDTDocument {
    const doc = this.getOrCreate(docId, deviceId);
    // 仅当时戳更新时覆盖;同时间戳按 deviceId 字典序(确定性)
    const existing = doc.fields[field];
    if (
      !existing ||
      existing.timestamp < timestamp ||
      (existing.timestamp === timestamp && deviceId > existing.deviceId)
    ) {
      doc.fields[field] = { value, timestamp, deviceId };
      doc.clock[deviceId] = Math.max(doc.clock[deviceId] ?? 0, timestamp);
      doc.updatedAt = timestamp;
    }
    return doc;
  }

  /** 获取字段 */
  getField<T>(docId: string, field: string): T | undefined {
    const doc = this.docs.get(docId);
    return doc?.fields[field]?.value as T | undefined;
  }

  /** 获取整个文档快照 */
  getDoc(docId: string): CRDTDocument | undefined {
    const doc = this.docs.get(docId);
    return doc ? { ...doc, fields: { ...doc.fields }, clock: { ...doc.clock } } : undefined;
  }

  // ── Remote merge ──

  /**
   * 合并远端文档
   * 策略:逐字段比较,取最新版本
   */
  mergeRemote(remote: CRDTDocument): {
    merged: CRDTDocument;
    conflictsResolved: number;
    fieldsAdded: number;
  } {
    const local = this.getOrCreate(remote.id, Object.keys(remote.clock)[0] ?? 'remote');
    let conflictsResolved = 0;
    let fieldsAdded = 0;

    // 逐字段合并
    for (const [field, remoteVal] of Object.entries(remote.fields)) {
      const localVal = local.fields[field];
      if (!localVal) {
        local.fields[field] = remoteVal;
        fieldsAdded += 1;
      } else if (remoteVal.timestamp > localVal.timestamp) {
        local.fields[field] = remoteVal;
        conflictsResolved += 1;
      } else if (
        remoteVal.timestamp === localVal.timestamp &&
        remoteVal.deviceId !== localVal.deviceId
      ) {
        // 同时间戳冲突:按 deviceId 字典序胜出(确定性)
        if (remoteVal.deviceId > localVal.deviceId) {
          local.fields[field] = remoteVal;
          conflictsResolved += 1;
        }
      }
    }

    // 向量时钟合并:取每设备最大值
    for (const [devId, clock] of Object.entries(remote.clock)) {
      local.clock[devId] = Math.max(local.clock[devId] ?? 0, clock);
    }
    local.updatedAt = Math.max(local.updatedAt, remote.updatedAt);

    return { merged: local, conflictsResolved, fieldsAdded };
  }

  /** 比较两个时钟 */
  compareClocks(a: VectorClock, b: VectorClock): 'before' | 'after' | 'concurrent' {
    let aGreater = false;
    let bGreater = false;
    const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of allKeys) {
      const av = a[k] ?? 0;
      const bv = b[k] ?? 0;
      if (av > bv) aGreater = true;
      if (bv > av) bGreater = true;
    }
    if (aGreater && !bGreater) return 'after';
    if (!aGreater && bGreater) return 'before';
    return 'concurrent';
  }

  // ── Test helpers ──
  resetForTests(): void {
    this.docs.clear();
  }

  private getOrCreate(docId: string, deviceId: string): CRDTDocument {
    let doc = this.docs.get(docId);
    if (!doc) {
      doc = {
        id: docId,
        fields: {},
        clock: { [deviceId]: 0 },
        updatedAt: 0,
      };
      this.docs.set(docId, doc);
    }
    return doc;
  }
}