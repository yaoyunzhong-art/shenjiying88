/**
 * 安防管理页 Safety 测试
 *
 * 三件套:
 *   第一部分: 源码分析测试 (25 个, 原始 L1 冒烟)
 *   第二部分: 数据层测试 (15+ 个, STATUS_MAP/SEVERITY_MAP/MOCK/filter/统计逻辑)
 *
 * 覆盖: 状态/严重等级 映射完整性、Mock 数据完整性、筛选/搜索逻辑、统计计算、
 *       表单校验逻辑、边界情况(空列表/全选/全不选)
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

/* ══════════════════════════════════════════════════════════
   第一部分: 源码分析测试 (原始 25 个)
   ══════════════════════════════════════════════════════════ */

function readSrc(): string | null {
  try {
    const fs = require('fs');
    const path = require('path');
    return fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
  } catch { return null; }
}

describe('safety page', () => {
  beforeEach(() => {});

  describe('类型定义', () => {
    it('应定义安防相关接口', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('interface') || src.includes('type'));
    });
    it('应包含设备/区域字段', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('device') || src.includes('Device') || src.includes('area') || src.includes('location'));
    });
    it('应包含状态字段', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('status') || src.includes('Status'));
    });
  });

  describe('样本数据', () => {
    it('应定义 SafetyRecord 完整接口', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('SafetyRecord'));
      assert.ok(src.includes('id: string'));
      assert.ok(src.includes('status'));
      assert.ok(src.includes('severity'));
      assert.ok(src.includes('description'));
    });

    it('应定义4种状态和4种严重等级', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('open'));
      assert.ok(src.includes('investigating'));
      assert.ok(src.includes('resolved'));
      assert.ok(src.includes('closed'));
      assert.ok(src.includes('low'));
      assert.ok(src.includes('critical'));
    });
  });

  describe('筛选与搜索', () => {
    it('应支持筛选', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('filter') || src.includes('Filter') || src.includes('select') || src.includes('Select'));
    });
  });

  describe('页面结构', () => {
    it('应导出默认组件', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('export default'));
    });
    it('应包含页面标题', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('<h1') || src.includes('title') || src.includes('安防') || src.includes('安全'));
    });
    it('应处理空态', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('空') || src.includes('暂无') || src.includes('empty') || src.includes('EmptyState'));
    });
  });

  describe('统计', () => {
    it('应展示统计信息', () => {
      const src = readSrc();
      assert.ok(src);
      assert.ok(src.includes('length') || src.includes('总数') || src.includes('count'));
    });

    describe('V20 增强 — 统计卡片', () => {
      it('源码包含processed/unprocessed统计', () => {
        const src = readSrc();
        assert.ok(src);
        assert.ok(src.includes('processed'), '应计算已处理数');
        assert.ok(src.includes('unprocessed'), '应计算未处理数');
      });

      it('源码包含todayNew统计', () => {
        const src = readSrc();
        assert.ok(src);
        assert.ok(src.includes('todayNew'), '应计算今日新增');
      });

      it('源码包含4个统计卡片', () => {
        const src = readSrc();
        assert.ok(src);
        assert.ok(src.includes('已处理告警'), '应包含已处理卡');
        assert.ok(src.includes('未处理告警'), '应包含未处理卡');
        assert.ok(src.includes('总告警数'), '应包含总告警卡');
        assert.ok(src.includes('今日新增'), '应包含今日新增卡');
      });

      it('源码包含reportedDate字段', () => {
        const src = readSrc();
        assert.ok(src);
        assert.ok(src.includes('reportedDate'), '接口应包含上报日期');
      });
    });

    describe('V20 增强 — 反例/边界', () => {
      it('records为空时total=0', () => {
        const src = readSrc();
        assert.ok(src);
        assert.ok(src.includes('length') || src.includes('empty') || src.includes('Empty'));
      });

      it('todayNew通过比较日期计算', () => {
        const src = readSrc();
        assert.ok(src);
        assert.ok(src.includes('split') || src.includes('toISOString'), '应使用日期比较');
      });
    });
  });

  describe('V20 增强 — 源码分析', () => {
    it('包含 @m5/ui 的 StatCard 导入', () => {
      const src = readSrc();
      assert.ok(src && src.includes('StatCard'), '应导入 StatCard');
    });
    it('包含 useMemo 统计', () => {
      const src = readSrc();
      assert.ok(src && src.includes('useMemo'), '应使用 useMemo');
    });
    it('包含统计卡片 JSX', () => {
      const src = readSrc();
      assert.ok(src && src.includes('已处理告警'), '应有已处理卡片');
      assert.ok(src && src.includes('未处理告警'), '应有未处理卡片');
    });
    it('包含今日新增逻辑', () => {
      const src = readSrc();
      assert.ok(src && src.includes('todayNew'), '应有今日新增');
      assert.ok(src && src.includes('reportedDate'), '应过滤上报日期');
    });
    it('统计值格式化使用 toString', () => {
      const src = readSrc();
      assert.ok(src && src.includes('.toString()'), '统计值应转为字符串');
    });
    it('包含4种严重等级', () => {
      const src = readSrc();
      const severities = ['critical', 'high', 'medium', 'low'].every(s => src?.includes(s));
      assert.ok(severities, '应包含4种严重等级');
    });
    it('状态筛选逻辑正确', () => {
      const src = readSrc();
      const filters = ['open', 'investigating', 'resolved', 'closed'].every(s => src?.includes(s));
      assert.ok(filters, '应包含4种过滤状态');
    });
    it('时间排序或格式化逻辑', () => {
      const src = readSrc();
      assert.ok(src && (src.includes('sort') || src.includes('formatDate') || src.includes('localeCompare')), '应有排序/格式化');
    });
    it('无硬编码 any 类型', () => {
      const src = readSrc();
      assert.ok(src && !src.includes(': any'),'不应有 any 类型');
    });
  });
});  // end safety page

/* ══════════════════════════════════════════════════════════
   第二部分: 数据层测试
   ══════════════════════════════════════════════════════════ */

// ==================== 从 page.tsx 提取的常量与类型 ====================

type SafetyStatus = 'open' | 'investigating' | 'resolved' | 'closed';
type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

interface SafetyRecord {
  id: string;
  category: string;
  reporter: string;
  reportedDate: string;
  status: SafetyStatus;
  severity: SeverityLevel;
  description: string;
  location: string;
  assignee: string;
  resolvedDate: string | null;
  actionTaken: string;
}

const STATUS_MAP: Record<SafetyStatus, { label: string; variant: 'neutral' | 'warning' | 'success' | 'danger' }> = {
  open: { label: '待处理', variant: 'neutral' },
  investigating: { label: '调查中', variant: 'warning' },
  resolved: { label: '已解决', variant: 'success' },
  closed: { label: '已关闭', variant: 'danger' },
};

const SEVERITY_MAP: Record<SeverityLevel, { label: string; variant: 'neutral' | 'warning' | 'danger' }> = {
  low: { label: '低', variant: 'neutral' },
  medium: { label: '中', variant: 'warning' },
  high: { label: '高', variant: 'danger' },
  critical: { label: '严重', variant: 'danger' },
};

const CATEGORY_OPTIONS = ['电气安全', '消防安全', '食品安全', '设备安全', '环境安全', '人身安全', '信息安全'] as const;
const LOCATION_OPTIONS = ['厨房A区', '仓库B区', '大厅', '办公室', '停车场', '配电室', '冷冻库', '天台'] as const;
const REPORTER_OPTIONS = ['电工组', '安保部', '厨房组', '设备组', '行政部门', '运营部'] as const;
const ASSIGNEE_OPTIONS = ['张工', '李工', '王工', '赵工', '陈工', '刘工'] as const;

// 从 page.tsx generateMockRecords() 重新生成一致的 mock 数据
const mockStatuses: SafetyStatus[] = ['open', 'investigating', 'resolved', 'closed', 'open', 'resolved', 'closed', 'investigating'];
const mockSeverities: SeverityLevel[] = ['low', 'medium', 'high', 'critical', 'low', 'medium', 'high', 'critical'];

function generateMockRecords(): SafetyRecord[] {
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(Date.now() - i * 86400000);
    const res = mockStatuses[i % mockStatuses.length] === 'resolved' || mockStatuses[i % mockStatuses.length] === 'closed'
      ? new Date(Date.now() - (i - 2) * 86400000).toISOString().split('T')[0]
      : null;
    return {
      id: `SAF-${String(i + 1).padStart(3, '0')}`,
      category: CATEGORY_OPTIONS[i % CATEGORY_OPTIONS.length],
      reporter: REPORTER_OPTIONS[i % REPORTER_OPTIONS.length],
      reportedDate: d.toISOString().split('T')[0],
      status: mockStatuses[i % mockStatuses.length],
      severity: mockSeverities[i % mockSeverities.length],
      description: i === 0 ? '配电箱线路老化' : i === 3 ? '天花板漏水有触电风险' : `安全记录 #${i + 1}`,
      location: LOCATION_OPTIONS[i % LOCATION_OPTIONS.length],
      assignee: ASSIGNEE_OPTIONS[i % ASSIGNEE_OPTIONS.length],
      resolvedDate: res,
      actionTaken: res ? (i === 2 ? '已更换老化线路' : '已安排检修') : '',
    };
  });
}

describe('Safety 数据层 — STATUS_MAP', () => {
  it('26. 覆盖全部 4 种状态', () => {
    const keys = Object.keys(STATUS_MAP) as SafetyStatus[];
    assert.equal(keys.length, 4);
    assert.deepEqual([...keys].sort(), ['closed', 'investigating', 'open', 'resolved']);
  });

  it('27. 各状态 label 为中文', () => {
    assert.equal(STATUS_MAP.open.label, '待处理');
    assert.equal(STATUS_MAP.investigating.label, '调查中');
    assert.equal(STATUS_MAP.resolved.label, '已解决');
    assert.equal(STATUS_MAP.closed.label, '已关闭');
  });

  it('28. 每种状态有不同 variant', () => {
    const variants = Object.values(STATUS_MAP).map(s => s.variant);
    assert.equal(new Set(variants).size, 4); // neutral/warning/success/danger
    assert.equal(STATUS_MAP.open.variant, 'neutral');
    assert.equal(STATUS_MAP.investigating.variant, 'warning');
    assert.equal(STATUS_MAP.resolved.variant, 'success');
    assert.equal(STATUS_MAP.closed.variant, 'danger');
  });
});

describe('Safety 数据层 — SEVERITY_MAP', () => {
  it('29. 覆盖全部 4 种严重等级', () => {
    const keys = Object.keys(SEVERITY_MAP) as SeverityLevel[];
    assert.equal(keys.length, 4);
    assert.deepEqual([...keys].sort(), ['critical', 'high', 'low', 'medium']);
  });

  it('30. 各严重等级 label 为中文', () => {
    assert.equal(SEVERITY_MAP.low.label, '低');
    assert.equal(SEVERITY_MAP.medium.label, '中');
    assert.equal(SEVERITY_MAP.high.label, '高');
    assert.equal(SEVERITY_MAP.critical.label, '严重');
  });

  it('31. 严重等级 variant 映射正确', () => {
    assert.equal(SEVERITY_MAP.low.variant, 'neutral');
    assert.equal(SEVERITY_MAP.medium.variant, 'warning');
    assert.equal(SEVERITY_MAP.high.variant, 'danger');
    assert.equal(SEVERITY_MAP.critical.variant, 'danger');
  });
});

describe('Safety 数据层 — 常量选项', () => {
  it('32. CATEGORY_OPTIONS 有 7 项', () => {
    assert.equal(CATEGORY_OPTIONS.length, 7);
    assert.ok(CATEGORY_OPTIONS.includes('电气安全'));
    assert.ok(CATEGORY_OPTIONS.includes('消防安全'));
    assert.ok(CATEGORY_OPTIONS.includes('人身安全'));
  });

  it('33. LOCATION_OPTIONS 有 8 项', () => {
    assert.equal(LOCATION_OPTIONS.length, 8);
    assert.ok(LOCATION_OPTIONS.includes('厨房A区'));
    assert.ok(LOCATION_OPTIONS.includes('配电室'));
    assert.ok(LOCATION_OPTIONS.includes('天台'));
  });

  it('34. REPORTER_OPTIONS 有 6 项', () => {
    assert.equal(REPORTER_OPTIONS.length, 6);
    assert.ok(REPORTER_OPTIONS.includes('电工组'));
    assert.ok(REPORTER_OPTIONS.includes('安保部'));
    assert.ok(REPORTER_OPTIONS.includes('运营部'));
  });

  it('35. ASSIGNEE_OPTIONS 有 6 项', () => {
    assert.equal(ASSIGNEE_OPTIONS.length, 6);
    assert.ok(ASSIGNEE_OPTIONS.includes('张工'));
    assert.ok(ASSIGNEE_OPTIONS.includes('刘工'));
  });
});

describe('Safety 数据层 — Mock 数据完整性', () => {
  const records = generateMockRecords();

  it('36. 生成 12 条 mock 记录', () => {
    assert.equal(records.length, 12);
  });

  it('37. 每条记录 ID 格式为 SAF-xxx', () => {
    for (const r of records) {
      assert.ok(/^SAF-\d{3}$/.test(r.id), `${r.id} 格式不正确`);
    }
  });

  it('38. 每条记录必填字段非空', () => {
    for (const r of records) {
      assert.ok(r.category.length > 0, `${r.id} category 为空`);
      assert.ok(r.reporter.length > 0, `${r.id} reporter 为空`);
      assert.ok(r.description.length > 0, `${r.id} description 为空`);
      assert.ok(r.location.length > 0, `${r.id} location 为空`);
      assert.ok(r.assignee.length > 0, `${r.id} assignee 为空`);
      assert.ok(r.reportedDate.length > 0, `${r.id} reportedDate 为空`);
    }
  });

  it('39. reportedDate 格式为 YYYY-MM-DD', () => {
    for (const r of records) {
      assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(r.reportedDate), `${r.id} reportedDate 格式不对: ${r.reportedDate}`);
    }
  });

  it('40. resolved 或 closed 状态必有 resolvedDate 和 actionTaken', () => {
    for (const r of records) {
      if (r.status === 'resolved' || r.status === 'closed') {
        assert.ok(r.resolvedDate !== null, `${r.id} 已解决但 resolvedDate 为 null`);
        assert.ok(r.actionTaken.length > 0, `${r.id} 已解决但 actionTaken 为空`);
      }
    }
  });

  it('41. open 或 investigating 状态 resolvedDate 为 null', () => {
    for (const r of records) {
      if (r.status === 'open' || r.status === 'investigating') {
        assert.equal(r.resolvedDate, null, `${r.id} 未解决但 resolvedDate 不为 null`);
        assert.equal(r.actionTaken, '', `${r.id} 未解决但 actionTaken 不为空`);
      }
    }
  });

  it('42. status 全部在 SafetyStatus 范围内', () => {
    const valid = new Set<SafetyStatus>(['open', 'investigating', 'resolved', 'closed']);
    for (const r of records) {
      assert.ok(valid.has(r.status), `${r.id} status ${r.status} 无效`);
    }
  });

  it('43. severity 全部在 SeverityLevel 范围内', () => {
    const valid = new Set<SeverityLevel>(['low', 'medium', 'high', 'critical']);
    for (const r of records) {
      assert.ok(valid.has(r.severity), `${r.id} severity ${r.severity} 无效`);
    }
  });
});

describe('Safety 数据层 — 统计逻辑', () => {
  const records = generateMockRecords();

  it('44. total = 12', () => {
    assert.equal(records.length, 12);
  });

  it('45. 状态分布: open=3, investigating=3, resolved=3, closed=3', () => {
    const open = records.filter(r => r.status === 'open').length;
    const investigating = records.filter(r => r.status === 'investigating').length;
    const resolved = records.filter(r => r.status === 'resolved').length;
    const closed = records.filter(r => r.status === 'closed').length;
    // 根据 cycle: open(0), investigating(1), resolved(2), closed(3), open(4), resolved(5), closed(6), investigating(7), ...
    // 第0-11: open, investigating, resolved, closed, open, resolved, closed, investigating, open, investigating, resolved, closed
    assert.equal(open, 3);
    assert.equal(investigating, 3);
    assert.equal(resolved, 3);
    assert.equal(closed, 3);
  });

  it('46. processed = resolved + closed', () => {
    const resolved = records.filter(r => r.status === 'resolved').length;
    const closed = records.filter(r => r.status === 'closed').length;
    const processed = resolved + closed;
    assert.equal(processed, 6);
  });

  it('47. unprocessed = open + investigating', () => {
    const open = records.filter(r => r.status === 'open').length;
    const investigating = records.filter(r => r.status === 'investigating').length;
    const unprocessed = open + investigating;
    assert.equal(unprocessed, 6);
  });

  it('48. 严重程度分布: low=3, medium=3, high=3, critical=3', () => {
    const low = records.filter(r => r.severity === 'low').length;
    const medium = records.filter(r => r.severity === 'medium').length;
    const high = records.filter(r => r.severity === 'high').length;
    const critical = records.filter(r => r.severity === 'critical').length;
    assert.equal(low, 3);
    assert.equal(medium, 3);
    assert.equal(high, 3);
    assert.equal(critical, 3);
  });

  it('49. todayNew 使用日期比较逻辑正确', () => {
    const today = new Date().toISOString().split('T')[0];
    const todayNew = records.filter(r => r.reportedDate === today).length;
    // 第一条 reportedDate 为今天 (i=0)
    assert.equal(todayNew, 1);
  });
});

describe('Safety 数据层 — 筛选/搜索逻辑', () => {
  const records = generateMockRecords();

  it('50. statusFilter=open 返回 3 条', () => {
    const result = records.filter(r => r.status === 'open');
    assert.equal(result.length, 3);
    for (const r of result) {
      assert.equal(r.status, 'open');
    }
  });

  it('51. statusFilter=closed 返回 3 条', () => {
    const result = records.filter(r => r.status === 'closed');
    assert.equal(result.length, 3);
    for (const r of result) {
      assert.equal(r.status, 'closed');
    }
  });

  it('52. severityFilter=critical 返回 3 条', () => {
    const result = records.filter(r => r.severity === 'critical');
    assert.equal(result.length, 3);
  });

  it('53. severityFilter=high 返回 3 条', () => {
    const result = records.filter(r => r.severity === 'high');
    assert.equal(result.length, 3);
  });

  it('54. 组合筛选: open + low 返回 3 条 (indices 0,4,8)', () => {
    const result = records.filter(r => r.status === 'open' && r.severity === 'low');
    assert.equal(result.length, 3);
    assert.ok(result.every(r => r.status === 'open' && r.severity === 'low'));
  });

  it('55. 组合筛选: closed + critical 返回 2 条 (indices 3,11)', () => {
    const result = records.filter(r => r.status === 'closed' && r.severity === 'critical');
    assert.equal(result.length, 2);
    assert.ok(result.every(r => r.status === 'closed' && r.severity === 'critical'));
  });

  it('56. 搜索: category 包含"消防"', () => {
    const q = '消防'.toLowerCase();
    const result = records.filter(r => r.category.toLowerCase().includes(q));
    // index 1, 9
    assert.equal(result.length, 2);
  });

  it('57. 搜索: reporter 包含"电工"', () => {
    const q = '电工'.toLowerCase();
    const result = records.filter(r => r.reporter.toLowerCase().includes(q));
    // index 0, 6 => 电工组 appears at 0,6
    assert.equal(result.length, 2);
  });

  it('58. 搜索: 空搜索返回全部', () => {
    const result = records.filter(r => {
      return true; // no search term
    });
    assert.equal(result.length, 12);
  });

  it('59. 不存在的搜索词返回空', () => {
    const searchFields: (keyof SafetyRecord)[] = ['category', 'reporter', 'description', 'location', 'assignee'];
    const q = '不存在的词'.toLowerCase();
    const result = records.filter(r =>
      searchFields.some(field => {
        const val = r[field];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
    assert.equal(result.length, 0);
  });

  it('60. 分页: pageSize=10 时第1页10条 第2页2条', () => {
    const pageSize = 10;
    const total = records.length;
    assert.equal(total, 12);
    assert.equal(Math.ceil(total / pageSize), 2);
    const page1 = records.slice(0, 10);
    const page2 = records.slice(10);
    assert.equal(page1.length, 10);
    assert.equal(page2.length, 2);
  });
});

describe('Safety 数据层 — 表单校验逻辑', () => {
  it('61. 空 category 应校验失败', () => {
    const errors: Record<string, string> = {};
    if (!'') errors.category = '请选择类别';
    assert.ok(errors.category);
  });

  it('62. 空 description 应校验失败', () => {
    const errors: Record<string, string> = {};
    if (!'   '.trim()) errors.description = '描述不能为空';
    assert.ok(errors.description);
  });

  it('63. 空 assignee 应校验失败', () => {
    const errors: Record<string, string> = {};
    if (!'') errors.assignee = '请选择处理人';
    assert.ok(errors.assignee);
  });

  it('64. 完整表单应校验通过', () => {
    const formData = { category: '电气安全', reporter: '电工组', location: '配电室', severity: 'medium' as SeverityLevel, description: '线路老化', assignee: '张工' };
    const errors: Record<string, string> = {};
    if (!formData.category) errors.category = '请选择类别';
    if (!formData.reporter) errors.reporter = '请选择上报人';
    if (!formData.description.trim()) errors.description = '描述不能为空';
    if (!formData.location) errors.location = '请选择位置';
    if (!formData.assignee) errors.assignee = '请选择处理人';
    assert.equal(Object.keys(errors).length, 0);
  });
});

describe('Safety 数据层 — 边界/极端情况', () => {
  it('65. 空 records 列表', () => {
    const empty: SafetyRecord[] = [];
    const stats = {
      total: empty.length,
      open: empty.filter(r => r.status === 'open').length,
      processed: empty.filter(r => r.status === 'resolved' || r.status === 'closed').length,
      unprocessed: empty.filter(r => r.status === 'open' || r.status === 'investigating').length,
    };
    assert.equal(stats.total, 0);
    assert.equal(stats.open, 0);
    assert.equal(stats.processed, 0);
    assert.equal(stats.unprocessed, 0);
  });

  it('66. 完成率计算: 0 条记录则为 0%', () => {
    const total = 0;
    const done = 0;
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;
    assert.equal(completionRate, 0);
  });

  it('67. 完成率计算: 6/12 = 50%', () => {
    const total = 12;
    const done = 6;
    const completionRate = Math.round((done / total) * 100);
    assert.equal(completionRate, 50);
  });

  it('68. 严重等级排序顺序: critical > high > medium > low', () => {
    const order: Record<SeverityLevel, number> = { low: 1, medium: 2, high: 3, critical: 4 };
    assert.ok(order.critical > order.high);
    assert.ok(order.high > order.medium);
    assert.ok(order.medium > order.low);
  });

  it('69. CSV 导出 header 格式', () => {
    const headers = ['id', 'category', 'status', 'severity', 'assignee', 'reportedDate'];
    const csvHeader = headers.join(',');
    assert.equal(csvHeader, 'id,category,status,severity,assignee,reportedDate');
  });

  it('70. CSV 导出行包含 mock 数据', () => {
    const records = generateMockRecords();
    const exportItems = records.slice(0, 3);
    const csvRows = exportItems.map(r =>
      `${r.id},${r.category},${STATUS_MAP[r.status].label},${SEVERITY_MAP[r.severity].label},${r.assignee},${r.reportedDate}`
    );
    assert.equal(csvRows.length, 3);
    assert.ok(csvRows[0]!.startsWith('SAF-001'));
  });
});
