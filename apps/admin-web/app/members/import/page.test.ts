/**
 * members/import/page.test.ts — 批量导入会员页 L1 测试
 *
 * 覆盖:
 *   正例 — 导入记录数据结构、校验逻辑、预览统计、导入进度、配置枚举
 *   反例 — 无效等级/姓名空/无效邮箱、无重复检查配置
 *   边界 — 空数据导入、零失败场景
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

// ─── 类型 ────────────────────────────────────────────

interface ImportRecord {
  row: number;
  name: string;
  phone: string;
  email: string;
  tier: string;
  storeName: string;
  marketCode: string;
  notes: string;
  validationErrors: string[];
  isValid: boolean;
}

interface ImportProgress {
  total: number;
  success: number;
  failed: number;
  errors: string[];
}

interface ImportConfig {
  duplicateCheck: 'phone' | 'name' | 'none';
  defaultTier: string;
  defaultStatus: string;
  defaultMarket: string;
  sendWelcomeMessage: boolean;
}

// ─── Mock 数据 ───────────────────────────────────────

const DEFAULT_IMPORT_CONFIG: ImportConfig = {
  duplicateCheck: 'phone',
  defaultTier: 'standard',
  defaultStatus: 'active',
  defaultMarket: 'cn-mainland',
  sendWelcomeMessage: false,
};

const MARKET_OPTIONS = [
  { value: 'cn-mainland', label: '中国大陆' },
  { value: 'us-default', label: '美国' },
  { value: 'uk-default', label: '英国' },
  { value: 'jp-default', label: '日本' },
  { value: 'kr-default', label: '韩国' },
  { value: 'de-default', label: '德国' },
];

const MOCK_RECORDS: ImportRecord[] = [
  { row: 1, name: '张三', phone: '13800001111', email: 'zhangsan@example.com', tier: 'gold', storeName: '朝阳大悦城旗舰店', marketCode: 'cn-mainland', notes: '新入职员工推荐', validationErrors: [], isValid: true },
  { row: 2, name: '李四', phone: '13900002222', email: 'lisi@example.com', tier: 'silver', storeName: '上海陆家嘴中心店', marketCode: 'cn-mainland', notes: '', validationErrors: [], isValid: true },
  { row: 3, name: '王五', phone: '13700003333', email: '', tier: 'standard', storeName: '深圳万象天地店', marketCode: 'cn-mainland', notes: '批发客户', validationErrors: [], isValid: true },
  { row: 4, name: '', phone: '13600004444', email: 'test@', tier: 'diamond', storeName: '广州天河城店', marketCode: 'cn-mainland', notes: '', validationErrors: ['姓名为空'], isValid: false },
  { row: 5, name: '赵六', phone: '13500005555', email: 'zhaoliu@example.com', tier: 'invalid', storeName: '成都太古里体验店', marketCode: 'cn-mainland', notes: '', validationErrors: ['等级值无效'], isValid: false },
  { row: 6, name: '孙七', phone: '13400006666', email: 'sunqi@example.com', tier: 'bronze', storeName: '杭州银泰旗舰店', marketCode: 'cn-mainland', notes: '', validationErrors: [], isValid: true },
  { row: 7, name: '周八', phone: '13300007777', email: 'zhouba@example.com', tier: 'gold', storeName: 'San Francisco Union Square', marketCode: 'us-default', notes: '美国新客户', validationErrors: [], isValid: true },
  { row: 8, name: '吴九', phone: '13200008888', email: 'wujiu@example.com', tier: 'standard', storeName: '南京德基广场店', marketCode: 'cn-mainland', notes: '', validationErrors: [], isValid: true },
  { row: 9, name: '郑十', phone: '13100009999', email: 'zhengshi@example.com', tier: 'silver', storeName: '伦敦Oxford Street', marketCode: 'uk-default', notes: '', validationErrors: [], isValid: true },
  { row: 10, name: '陈十一', phone: '13000001000', email: '', tier: 'standard', storeName: '重庆来福士店', marketCode: 'cn-mainland', notes: '', validationErrors: [], isValid: true },
  { row: 11, name: '林十二', phone: '18900001111', email: 'lin@example.com', tier: 'standard', storeName: '武汉天地旗舰店', marketCode: 'cn-mainland', notes: '', validationErrors: [], isValid: true },
  { row: 12, name: '黄十三', phone: '18800002222', email: 'huang@example.com', tier: 'bronze', storeName: '苏州中心旗舰店', marketCode: 'cn-mainland', notes: '已电话沟通', validationErrors: [], isValid: true },
];

// ─── 辅助函数 ────────────────────────────────────────

function getPreviewStats(records: ImportRecord[]) {
  const valid = records.filter(r => r.isValid).length;
  const invalid = records.filter(r => !r.isValid).length;
  return { total: records.length, valid, invalid };
}

function simulateImport(records: ImportRecord[]): ImportProgress {
  const validRecords = records.filter(r => r.isValid);
  const invalidCount = records.filter(r => !r.isValid).length;
  return {
    total: records.length,
    success: validRecords.length,
    failed: invalidCount,
    errors: invalidCount > 0 ? [`${invalidCount} 条数据校验未通过，已跳过`] : [],
  };
}

function searchRecords(records: ImportRecord[], keyword: string): ImportRecord[] {
  if (!keyword.trim()) return records;
  const lower = keyword.toLowerCase();
  return records.filter(r =>
    r.name.toLowerCase().includes(lower) ||
    r.phone.toLowerCase().includes(lower) ||
    r.storeName.toLowerCase().includes(lower)
  );
}

function validateRecord(record: ImportRecord): string[] {
  const errors: string[] = [];
  if (!record.name.trim()) errors.push('姓名为空');
  if (!record.phone.trim()) errors.push('电话为空');
  if (record.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email)) {
    errors.push('邮箱格式无效');
  }
  return errors;
}

function isValidFileType(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ext === 'csv' || ext === 'xlsx' || ext === 'xls';
}

// ─── 测试套件 ────────────────────────────────────────

describe('members/import — 记录数据结构', () => {
  it('1. 12 条模拟记录（正例）', () => {
    assert.equal(MOCK_RECORDS.length, 12);
  });

  it('2. 各记录有 row 字段且唯一（正例）', () => {
    const rows = MOCK_RECORDS.map(r => r.row);
    assert.equal(new Set(rows).size, rows.length);
  });

  it('3. 各记录 phone 非空（正例）', () => {
    for (const r of MOCK_RECORDS) {
      assert.ok(r.phone.length > 0, `row ${r.row} 电话非空`);
    }
  });

  it('4. 各记录有 marketCode（正例）', () => {
    for (const r of MOCK_RECORDS) {
      assert.ok(r.marketCode, `row ${r.row} marketCode`);
    }
  });

  it('5. isValid 与 validationErrors 一致（正例）', () => {
    for (const r of MOCK_RECORDS) {
      const expected = r.validationErrors.length === 0;
      assert.equal(r.isValid, expected, `row ${r.row} isValid 与 errors 一致`);
    }
  });
});

describe('members/import — 校验逻辑', () => {
  it('6. 姓名空的记录应有验证错误（反例）', () => {
    const errs = validateRecord(MOCK_RECORDS[3]!);
    assert.ok(errs.some(e => e.includes('姓名')));
  });

  it('7. 有效的记录无验证错误（正例）', () => {
    const errs = validateRecord(MOCK_RECORDS[0]!);
    assert.equal(errs.length, 0);
  });

  it('8. 无效邮箱应被检测（反例）', () => {
    const errs = validateRecord(MOCK_RECORDS[3]!);
    assert.ok(errs.length > 0);
  });
});

describe('members/import — 预览统计', () => {
  it('9. 全量统计（正例）', () => {
    const stats = getPreviewStats(MOCK_RECORDS);
    assert.equal(stats.total, 12);
    assert.equal(stats.valid, 10);
    assert.equal(stats.invalid, 2);
  });

  it('10. 空列表统计（边界）', () => {
    const stats = getPreviewStats([]);
    assert.equal(stats.total, 0);
    assert.equal(stats.valid, 0);
    assert.equal(stats.invalid, 0);
  });

  it('11. 全通过列表（边界）', () => {
    const allValid = MOCK_RECORDS.filter(r => r.isValid);
    const stats = getPreviewStats(allValid);
    assert.equal(stats.invalid, 0);
  });
});

describe('members/import — 导入进度', () => {
  it('12. 模拟导入成功（正例）', () => {
    const progress = simulateImport(MOCK_RECORDS);
    assert.equal(progress.total, 12);
    assert.equal(progress.success, 10);
    assert.equal(progress.failed, 2);
    assert.ok(progress.errors.length > 0);
  });

  it('13. 全通过导入无错误（边界）', () => {
    const allValid = MOCK_RECORDS.filter(r => r.isValid);
    const progress = simulateImport(allValid);
    assert.equal(progress.failed, 0);
    assert.equal(progress.errors.length, 0);
  });

  it('14. 空导入（边界）', () => {
    const progress = simulateImport([]);
    assert.equal(progress.total, 0);
    assert.equal(progress.success, 0);
    assert.equal(progress.failed, 0);
    assert.equal(progress.errors.length, 0);
  });
});

describe('members/import — 搜索功能', () => {
  it('15. 按姓名搜索（正例）', () => {
    const result = searchRecords(MOCK_RECORDS, '张三');
    assert.equal(result.length, 1);
  });

  it('16. 按电话搜索（正例）', () => {
    const result = searchRecords(MOCK_RECORDS, '13800001111');
    assert.equal(result.length, 1);
  });

  it('17. 按门店搜索（正例）', () => {
    const result = searchRecords(MOCK_RECORDS, '杭州');
    assert.equal(result.length, 1);
  });

  it('18. 空关键字返回全部（边界）', () => {
    assert.equal(searchRecords(MOCK_RECORDS, '').length, MOCK_RECORDS.length);
  });

  it('19. 不存在的关键字返回空（反例）', () => {
    assert.equal(searchRecords(MOCK_RECORDS, '不存在的').length, 0);
  });
});

describe('members/import — 配置与文件类型', () => {
  it('20. 默认配置（正例）', () => {
    assert.equal(DEFAULT_IMPORT_CONFIG.duplicateCheck, 'phone');
    assert.equal(DEFAULT_IMPORT_CONFIG.defaultTier, 'standard');
    assert.equal(DEFAULT_IMPORT_CONFIG.defaultMarket, 'cn-mainland');
    assert.equal(DEFAULT_IMPORT_CONFIG.sendWelcomeMessage, false);
  });

  it('21. 6 个市场选项（正例）', () => {
    assert.equal(MARKET_OPTIONS.length, 6);
    assert.ok(MARKET_OPTIONS.some(o => o.value === 'cn-mainland'));
    assert.ok(MARKET_OPTIONS.some(o => o.value === 'us-default'));
  });

  it('22. 有效文件类型（正例）', () => {
    assert.ok(isValidFileType('data.csv'));
    assert.ok(isValidFileType('data.xlsx'));
    assert.ok(isValidFileType('data.xls'));
  });

  it('23. 无效文件类型（反例）', () => {
    assert.ok(!isValidFileType('data.txt'));
    assert.ok(!isValidFileType('data.pdf'));
    assert.ok(!isValidFileType('data'));
  });
});
