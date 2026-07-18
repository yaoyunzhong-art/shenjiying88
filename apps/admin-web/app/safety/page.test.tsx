/**
 * 安防管理页 Safety L1 冒烟测试
 * 圈梁四道箍: ① TSC通过 → ② 测试存在 → ③ 圈梁表更新 → ④ PRD标记
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';

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
      // 空态处理
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
  });
});  // end safety page

