/**
 * store-locator-style.test.ts — L1 合约测试
 *
 * 守护 helpers + 1 个数据:
 *   - filterStoreByKeyword (纯): 关键词过滤 + 大小写 + 空白 + 命中规则
 *   - getCityButtonStyle (纯): active/inactive 两态样式字段
 *   - getStoreCardStyle (纯): 4 个字段稳定
 *   - STATUS_INFO: 3 个 status 必须有 text/color/bg, 颜色与原 page 字节相同
 *   - getStatusBadgeStyle: sm/md 尺寸差异 + color/bg 来自 STATUS_INFO
 *   - getFeatureChipStyle: compact/comfortable 差异
 *   - getContactActionButtonStyle: 3 variant × 2 size
 *   - getActionButtonRowStyle: 固定字段
 *   - getBottomActionBarStyle: 固定字段
 *   - getBottomNavItemStyle: active/inactive 文字色差异
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  STATUS_INFO,
  getCityButtonStyle,
  getStoreCardStyle,
  getStatusBadgeStyle,
  getFeatureChipStyle,
  getContactActionButtonStyle,
  getActionButtonRowStyle,
  getBottomActionBarStyle,
  getBottomNavItemStyle,
  filterStoreByKeyword,
  type StoreStatus,
} from './store-locator-style.ts';
import type { StoreLocator } from './store-locator-service.ts';

// ─── STATUS_INFO ──────────────────────────────────────

describe('[store-locator-style] STATUS_INFO', () => {
  it('3 个 status 必须齐备 (open/closed/busy)', () => {
    const keys = Object.keys(STATUS_INFO).sort();
    assert.deepEqual(keys, ['busy', 'closed', 'open']);
  });

  it('每个 status 必须含 text/color/bg 3 字段', () => {
    const statuses: StoreStatus[] = ['open', 'closed', 'busy'];
    for (const s of statuses) {
      const info = STATUS_INFO[s];
      assert.ok(typeof info.text === 'string' && info.text.length > 0, `${s}.text 必填`)
      assert.ok(typeof info.color === 'string' && info.color.length > 0, `${s}.color 必填`)
      assert.ok(typeof info.bg === 'string' && info.bg.length > 0, `${s}.bg 必填`)
    }
  });

  it('open 文案与原 page 字节相同 (避免两页文案漂移)', () => {
    assert.equal(STATUS_INFO.open.text, '营业中');
    assert.equal(STATUS_INFO.open.color, '#4ade80');
    assert.equal(STATUS_INFO.open.bg, 'rgba(74, 222, 128, 0.15)');
    assert.equal(STATUS_INFO.closed.text, '已休息');
    assert.equal(STATUS_INFO.busy.text, '繁忙');
  });
});

// ─── getCityButtonStyle ───────────────────────────────

describe('[store-locator-style] getCityButtonStyle', () => {
  it('active 与 inactive 返回不同对象引用 (无 noop 共享)', () => {
    const a = getCityButtonStyle(true);
    const b = getCityButtonStyle(false);
    assert.notEqual(a, b);
  });

  it('active 背景 = rgba(102, 126, 234, 0.3)', () => {
    assert.equal(getCityButtonStyle(true).background, 'rgba(102, 126, 234, 0.3)');
  });

  it('inactive 背景 = rgba(30, 41, 59, 0.8)', () => {
    assert.equal(getCityButtonStyle(false).background, 'rgba(30, 41, 59, 0.8)');
  });

  it('active 边框 = rgba(102, 126, 234, 0.5)', () => {
    assert.equal(getCityButtonStyle(true).border, '1px solid rgba(102, 126, 234, 0.5)');
  });

  it('inactive 边框 = rgba(148, 163, 184, 0.2)', () => {
    assert.equal(getCityButtonStyle(false).border, '1px solid rgba(148, 163, 184, 0.2)');
  });

  it('active 文字色 = #a5b4fc, inactive = #94a3b8', () => {
    assert.equal(getCityButtonStyle(true).color, '#a5b4fc');
    assert.equal(getCityButtonStyle(false).color, '#94a3b8');
  });

  it('公共字段两态一致: padding / borderRadius / fontSize / cursor / whiteSpace', () => {
    const a = getCityButtonStyle(true);
    const b = getCityButtonStyle(false);
    assert.equal(a.padding, b.padding);
    assert.equal(a.borderRadius, b.borderRadius);
    assert.equal(a.fontSize, b.fontSize);
    assert.equal(a.cursor, b.cursor);
    assert.equal(a.whiteSpace, b.whiteSpace);
  });
});

// ─── getStoreCardStyle ────────────────────────────────

describe('[store-locator-style] getStoreCardStyle', () => {
  it('返回 4 字段: borderRadius / background / border (含必要 fallback)', () => {
    const s = getStoreCardStyle();
    assert.equal(s.borderRadius, 16);
    assert.equal(s.background, 'rgba(30, 41, 59, 0.6)');
    assert.equal(s.border, '1px solid rgba(148, 163, 184, 0.1)');
  });

  it('每次调用返回新对象 (避免共享引用被意外修改)', () => {
    const a = getStoreCardStyle();
    const b = getStoreCardStyle();
    assert.notEqual(a, b);
  });
});

// ─── filterStoreByKeyword ─────────────────────────────

function makeStore(overrides: Partial<StoreLocator> = {}): StoreLocator {
  return {
    id: 's1',
    storeName: '深圳南山旗舰店',
    storeCode: 'SZ-NS-001',
    city: '深圳',
    district: '南山区',
    address: '深圳市南山区科技园南区A栋1层',
    phone: '0755-88886666',
    status: 'open',
    businessHours: '09:00 - 22:00',
    features: ['WiFi'],
    ...overrides,
  };
}

describe('[store-locator-style] filterStoreByKeyword', () => {
  const s1 = makeStore({ id: '1', storeName: '深圳南山旗舰店', address: '深圳市南山区科技园南区A栋1层', district: '南山区' })
  const s2 = makeStore({ id: '2', storeName: '广州天河城店', address: '广州市天河区天河路208号', district: '天河区' })
  const s3 = makeStore({ id: '3', storeName: '上海浦东店', address: '上海市浦东新区世纪大道1000号', district: '浦东新区' })
  const all: StoreLocator[] = [s1, s2, s3]

  it('空字符串 → 原顺序全量返回 (新数组引用)', () => {
    const out = filterStoreByKeyword(all, '')
    assert.equal(out.length, 3)
    assert.notEqual(out, all) // 新数组, 但内容相同
    assert.deepEqual(out, all)
  })

  it('纯空格 → 原顺序全量返回 (trim 行为)', () => {
    const out = filterStoreByKeyword(all, '   ')
    assert.equal(out.length, 3)
  })

  it('命中 storeName → 返回该门店', () => {
    const out = filterStoreByKeyword(all, '深圳南山')
    assert.equal(out.length, 1)
    assert.equal(out[0].id, '1')
  })

  it('命中 address → 返回该门店', () => {
    const out = filterStoreByKeyword(all, '科技园')
    assert.equal(out.length, 1)
    assert.equal(out[0].id, '1')
  })

  it('命中 district → 返回该门店', () => {
    const out = filterStoreByKeyword(all, '天河区')
    assert.equal(out.length, 1)
    assert.equal(out[0].id, '2')
  })

  it('大小写不敏感 (大写关键词命中 lowercase 字段)', () => {
    const out = filterStoreByKeyword(all, 'SHANGHAI')
    // 'shanghai' 不在任何 storeName/address/district 中
    assert.equal(out.length, 0)
    // 但 '上海' / '浦东' 等中文不受大小写影响
    const out2 = filterStoreByKeyword(all, '上海')
    assert.equal(out2.length, 1)
    assert.equal(out2[0].id, '3')
  })

  it('小写关键词命中大写字段 (中文场景: 不区分大小写无关紧要, 钉死行为)', () => {
    const mixed = makeStore({ id: 'm', storeName: 'MIXED Case Store' })
    const out = filterStoreByKeyword([mixed], 'mixed case')
    assert.equal(out.length, 1)
    assert.equal(out[0].id, 'm')
  })

  it('无命中 → 空数组 (不是 null / undefined)', () => {
    const out = filterStoreByKeyword(all, '不存在的关键词XYZ')
    assert.deepEqual(out, [])
  })

  it('命中多条 → 全部返回 (filter 不截断)', () => {
    // '区' 同时命中 '南山区' 与 '天河区' 与 '浦东新区'
    const out = filterStoreByKeyword(all, '区')
    assert.equal(out.length, 3)
  })

  it('关键词前后空格不影响匹配 (trim 内部处理)', () => {
    const out = filterStoreByKeyword(all, '  深圳  ')
    assert.equal(out.length, 1)
    assert.equal(out[0].id, '1')
  })

  it('空数组输入 → 空数组输出', () => {
    const out = filterStoreByKeyword([], '任意')
    assert.deepEqual(out, [])
  })
})

// ─── getStatusBadgeStyle ──────────────────────────────

describe('[store-locator-style] getStatusBadgeStyle', () => {
  it('sm 默认尺寸: top/right 12, padding 4/10, radius 12, font 12', () => {
    const s = getStatusBadgeStyle('open')
    assert.equal(s.position, 'absolute')
    assert.equal(s.top, 12)
    assert.equal(s.right, 12)
    assert.equal(s.padding, '4px 10px')
    assert.equal(s.borderRadius, 12)
    assert.equal(s.fontSize, 12)
    assert.equal(s.fontWeight, 500)
  })

  it('md 尺寸: top/right 16, padding 6/14, radius 16, font 13', () => {
    const s = getStatusBadgeStyle('open', 'md')
    assert.equal(s.top, 16)
    assert.equal(s.right, 16)
    assert.equal(s.padding, '6px 14px')
    assert.equal(s.borderRadius, 16)
    assert.equal(s.fontSize, 13)
  })

  it('color/bg 直接取自 STATUS_INFO (钉死 open=绿)', () => {
    const s = getStatusBadgeStyle('open')
    assert.equal(s.color, STATUS_INFO.open.color)
    assert.equal(s.background, STATUS_INFO.open.bg)
    assert.equal(s.color, '#4ade80')
    assert.equal(s.background, 'rgba(74, 222, 128, 0.15)')
  })

  it('closed 状态 → 灰色 bg (钉死不变)', () => {
    const s = getStatusBadgeStyle('closed')
    assert.equal(s.color, '#94a3b8')
    assert.equal(s.background, 'rgba(148, 163, 184, 0.15)')
  })

  it('busy 状态 → 黄色 bg (钉死不变)', () => {
    const s = getStatusBadgeStyle('busy')
    assert.equal(s.color, '#fbbf24')
    assert.equal(s.background, 'rgba(251, 191, 36, 0.15)')
  })

  it('不同 size / status 各返回新对象 (避免共享引用)', () => {
    const a = getStatusBadgeStyle('open', 'sm')
    const b = getStatusBadgeStyle('open', 'md')
    const c = getStatusBadgeStyle('closed', 'sm')
    assert.notEqual(a, b)
    assert.notEqual(a, c)
  })
})

// ─── getFeatureChipStyle ──────────────────────────────

describe('[store-locator-style] getFeatureChipStyle', () => {
  it('compact: padding 4/8, radius 6, font 11', () => {
    const s = getFeatureChipStyle('compact')
    assert.equal(s.padding, '4px 8px')
    assert.equal(s.borderRadius, 6)
    assert.equal(s.fontSize, 11)
  })

  it('comfortable: padding 8/14, radius 20, font 13', () => {
    const s = getFeatureChipStyle('comfortable')
    assert.equal(s.padding, '8px 14px')
    assert.equal(s.borderRadius, 20)
    assert.equal(s.fontSize, 13)
  })

  it('两变体共享紫色调 (background + color 字节相同)', () => {
    const c = getFeatureChipStyle('compact')
    const co = getFeatureChipStyle('comfortable')
    assert.equal(c.background, co.background)
    assert.equal(c.color, co.color)
    assert.equal(c.background, 'rgba(102, 126, 234, 0.15)')
    assert.equal(c.color, '#a5b4fc')
  })
})

// ─── getContactActionButtonStyle ──────────────────────

describe('[store-locator-style] getContactActionButtonStyle', () => {
  it('call 变体: 绿色 (rgba 34,197,94)', () => {
    const s = getContactActionButtonStyle('call', 'sm')
    assert.equal(s.background, 'rgba(34, 197, 94, 0.15)')
    assert.equal(s.border, '1px solid rgba(34, 197, 94, 0.3)')
    assert.equal(s.color, '#4ade80')
  })

  it('navigate 变体: 蓝色 (rgba 59,130,246)', () => {
    const s = getContactActionButtonStyle('navigate', 'sm')
    assert.equal(s.background, 'rgba(59, 130, 246, 0.15)')
    assert.equal(s.border, '1px solid rgba(59, 130, 246, 0.3)')
    assert.equal(s.color, '#60a5fa')
  })

  it('navigate-primary 变体: 紫色渐变 + 白字 + fontWeight 500 + 无边框', () => {
    const s = getContactActionButtonStyle('navigate-primary', 'md')
    assert.equal(s.background, 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)')
    assert.equal(s.border, 'none')
    assert.equal(s.color, '#fff')
    assert.equal(s.fontWeight, 500)
  })

  it('sm 尺寸: padding 10, radius 8, font 13', () => {
    const s = getContactActionButtonStyle('call', 'sm')
    assert.equal(s.padding, 10)
    assert.equal(s.borderRadius, 8)
    assert.equal(s.fontSize, 13)
  })

  it('md 尺寸: padding 14, radius 12, font 15', () => {
    const s = getContactActionButtonStyle('call', 'md')
    assert.equal(s.padding, 14)
    assert.equal(s.borderRadius, 12)
    assert.equal(s.fontSize, 15)
  })

  it('3 变体共享 layout 字段: flex/textAlign/textDecoration (公共合约)', () => {
    const variants: Array<'call' | 'navigate' | 'navigate-primary'> = ['call', 'navigate', 'navigate-primary']
    for (const v of variants) {
      const s = getContactActionButtonStyle(v, 'sm')
      assert.equal(s.flex, 1)
      assert.equal(s.textAlign, 'center')
      assert.equal(s.textDecoration, 'none')
    }
  })

  it('navigate-primary 与 navigate 颜色不同 (避免退化合并)', () => {
    const nav = getContactActionButtonStyle('navigate', 'md')
    const primary = getContactActionButtonStyle('navigate-primary', 'md')
    assert.notEqual(nav.color, primary.color)
    assert.notEqual(nav.background, primary.background)
  })
})

// ─── getActionButtonRowStyle ───────────────────────────

describe('[store-locator-style] getActionButtonRowStyle', () => {
  it('返回固定布局: display flex + gap 8 + marginTop 12 + borderTop', () => {
    const s = getActionButtonRowStyle()
    assert.equal(s.display, 'flex')
    assert.equal(s.gap, 8)
    assert.equal(s.marginTop, 12)
    assert.equal(s.paddingTop, 12)
    assert.equal(s.borderTop, '1px solid rgba(148, 163, 184, 0.08)')
  })

  it('每次返回新对象 (避免共享)', () => {
    assert.notEqual(getActionButtonRowStyle(), getActionButtonRowStyle())
  })
})

// ─── getBottomActionBarStyle ───────────────────────────

describe('[store-locator-style] getBottomActionBarStyle', () => {
  it('返回 fixed 底部栏 + blur 背景 + 顶部分隔', () => {
    const s = getBottomActionBarStyle()
    assert.equal(s.position, 'fixed')
    assert.equal(s.bottom, 0)
    assert.equal(s.left, 0)
    assert.equal(s.right, 0)
    assert.equal(s.display, 'flex')
    assert.equal(s.gap, 12)
    assert.equal(s.padding, '16px')
    assert.equal(s.background, 'rgba(15, 23, 42, 0.95)')
    assert.equal(s.backdropFilter, 'blur(12px)')
    assert.equal(s.borderTop, '1px solid rgba(148, 163, 184, 0.1)')
  })
})

// ─── getBottomNavItemStyle ────────────────────────────

describe('[store-locator-style] getBottomNavItemStyle', () => {
  it('active → 紫色 #667eea', () => {
    const s = getBottomNavItemStyle(true)
    assert.equal(s.color, '#667eea')
  })

  it('inactive → 灰色 #64748b', () => {
    const s = getBottomNavItemStyle(false)
    assert.equal(s.color, '#64748b')
  })

  it('两态共享 layout: 垂直 flex 居中 + gap 4', () => {
    const a = getBottomNavItemStyle(true)
    const b = getBottomNavItemStyle(false)
    assert.equal(a.display, b.display)
    assert.equal(a.flexDirection, b.flexDirection)
    assert.equal(a.alignItems, b.alignItems)
    assert.equal(a.gap, b.gap)
    assert.equal(a.textDecoration, b.textDecoration)
    assert.equal(a.display, 'flex')
    assert.equal(a.flexDirection, 'column')
    assert.equal(a.alignItems, 'center')
    assert.equal(a.gap, 4)
    assert.equal(a.textDecoration, 'none')
  })
})
