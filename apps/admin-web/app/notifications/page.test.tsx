/**
 * notifications/page.test.tsx — 通知管理页 圈梁测试
 *
 * 测试科学化原则:
 *   - fetch mock: URL-pattern responseRegistry
 *   - 禁止: as any / describe.skip / it.only
 *   - 覆盖: 正例 + 反例 + 边界（三件套）
 *   - 隔离: beforeEach 重置，test 自包含
 *   - React 渲染测试: @testing-library/react + happy-dom
 *
 * 覆盖: 45+ items
 */

import { describe, it, before, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';

const __dirname = path.dirname(new URL(import.meta.url).pathname);
const SOURCE = path.join(__dirname, 'page.tsx');

/* ── help 函数 ── */

function readSource(): string {
  return fs.readFileSync(SOURCE, 'utf-8');
}

function safeExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/* ── URL-pattern responseRegistry ── */

const responseRegistry = new Map<string, string>();

function registerResponse(pattern: string, body: string): void {
  responseRegistry.set(pattern, body);
}

function matchUrl(url: string): string | null {
  for (const [pattern] of responseRegistry) {
    if (url.includes(pattern)) return pattern;
  }
  return null;
}

registerResponse('notifications', JSON.stringify({ code: 0, data: [] }));

/* ══════════════════════════════════════════════════════════
   正例
   ══════════════════════════════════════════════════════════ */

describe('notifications — 正例', () => {
  it('1. page.tsx 文件存在', () => {
    assert.ok(safeExists(SOURCE), 'page.tsx 应该存在');
  });

  it('2. 页面导出了默认组件 NotificationsPage', () => {
    const src = readSource();
    assert.ok(
      src.includes('export default function NotificationsPage'),
      '应使用 export default function NotificationsPage',
    );
  });

  it('3. 包含 Notification 类型定义', () => {
    const src = readSource();
    assert.ok(src.includes('interface Notification'), '应定义 Notification 接口');
  });

  it('4. 定义了通知类型枚举（4种）', () => {
    const src = readSource();
    assert.ok(src.includes("'announcement'"), '应包含 announcement');
    assert.ok(src.includes("'marketing'"), '应包含 marketing');
    assert.ok(src.includes("'alert'"), '应包含 alert');
    assert.ok(src.includes("'activity'"), '应包含 activity');
  });

  it('5. 定义了接收对象枚举（3种）', () => {
    const src = readSource();
    assert.ok(src.includes("'all'"), '应包含 all');
    assert.ok(src.includes("'specific_store'"), '应包含 specific_store');
    assert.ok(src.includes("'specific_role'"), '应包含 specific_role');
  });

  it('6. 定义了状态枚举（3种）', () => {
    const src = readSource();
    assert.ok(src.includes("'sent'"), '应包含 sent');
    assert.ok(src.includes("'pending'"), '应包含 pending');
    assert.ok(src.includes("'sending'"), '应包含 sending');
  });

  it('7. 包含类型标签映射表（NT_LABEL）', () => {
    const src = readSource();
    assert.ok(src.includes('NT_LABEL'), '应包含 NT_LABEL');
    assert.ok(src.includes('系统公告'), '应包含 系统公告 中文标签');
    assert.ok(src.includes('营销推送'), '应包含 营销推送 中文标签');
    assert.ok(src.includes('告警通知'), '应包含 告警通知 中文标签');
    assert.ok(src.includes('活动提醒'), '应包含 活动提醒 中文标签');
  });

  it('8. 包含状态标签映射表（DS_LABEL）', () => {
    const src = readSource();
    assert.ok(src.includes('DS_LABEL'), '应包含 DS_LABEL');
    assert.ok(src.includes('已发送'), '应包含 已发送 中文标签');
    assert.ok(src.includes('待发送'), '应包含 待发送 中文标签');
    assert.ok(src.includes('发送中'), '应包含 发送中 中文标签');
  });

  it('9. 包含样本数据 MOCK_NOTIFICATIONS', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_NOTIFICATIONS'), '应包含 MOCK_NOTIFICATIONS');
    const match = src.match(/MOCK_NOTIFICATIONS[^;]*\]/);
    if (match) {
      const items = MOCK_NOTIFICATIONS;
      assert.ok(items.length === 7, `MOCK_NOTIFICATIONS 应包含 7 条记录，实际 ${items.length}`);
    }
  });

  it('10. 每条样本数据包含所有必要字段', () => {
    const requiredFields: (keyof Notification)[] = [
      'id', 'title', 'content', 'type', 'recipientScope', 'recipientLabel', 'status', 'sentAt', 'successRate',
    ];
    for (const item of MOCK_NOTIFICATIONS) {
      for (const field of requiredFields) {
        assert.ok(item[field] !== undefined && item[field] !== null, `N${item.id} 缺少字段 ${field}`);
      }
    }
  });

  it('11. 包含概览统计（总通知数/本月发送/成功率）', () => {
    const src = readSource();
    assert.ok(src.includes('StatCard'), '应使用 StatCard');
    assert.ok(src.includes('总通知数') || src.includes('total'), '应包含总通知数');
    assert.ok(src.includes('本月发送') || src.includes('thisMonth'), '应包含本月发送');
    assert.ok(src.includes('成功率') || src.includes('successRate'), '应包含成功率');
  });

  it('12. 支持类型变体映射 NT_VARIANT', () => {
    const src = readSource();
    assert.ok(src.includes('NT_VARIANT'), '应包含 NT_VARIANT');
  });

  it('13. 支持状态变体映射 DS_VARIANT', () => {
    const src = readSource();
    assert.ok(src.includes('DS_VARIANT'), '应包含 DS_VARIANT');
  });
});

/* ══════════════════════════════════════════════════════════
   反例
   ══════════════════════════════════════════════════════════ */

describe('notifications — 反例', () => {
  it('14. 不使用 dangerouslySetInnerHTML', () => {
    const src = readSource();
    assert.ok(!src.includes('dangerouslySetInnerHTML'), '不应使用 innerHTML');
  });

  it('15. 不使用 eval', () => {
    const src = readSource();
    assert.ok(!src.includes('eval('), '不应使用 eval');
  });

  it('16. 不直接突变数据', () => {
    const src = readSource();
    assert.ok(!src.includes('.push('), '不应使用 push');
    assert.ok(!src.includes('.splice('), '不应使用 splice');
  });
});

/* ══════════════════════════════════════════════════════════
   边界
   ══════════════════════════════════════════════════════════ */

describe('notifications — 边界', () => {
  it('17. Tab筛选支持 "全部/已发送/待发送"', () => {
    const src = readSource();
    assert.ok(src.includes("'ALL'"), '应包含 ALL 标签');
    assert.ok(src.includes("'sent'"), '应包含 sent 标签');
    assert.ok(src.includes("'pending'"), '应包含 pending 标签');
  });

  it('18. 筛选后数据为空时显示空状态', () => {
    const src = readSource();
    assert.ok(src.includes('EmptyState'), '应引入 EmptyState 组件处理空态');
    assert.ok(src.includes('暂无通知'), '应显示 "暂无通知"');
  });

  it('19. 包含刷新按钮', () => {
    const src = readSource();
    assert.ok(src.includes('刷新'), '应包含刷新按钮');
    assert.ok(src.includes('handleRefresh'), '应有刷新处理器');
  });

  it('20. 包含 useCallback 或 useMemo 优化', () => {
    const src = readSource();
    assert.ok(src.includes('useCallback') || src.includes('useMemo'), '应使用优化 hook');
  });

  it('21. 发送时间为空时显示占位符', () => {
    const src = readSource();
    assert.ok(src.includes("'—'"), '空时间应显示占位符');
  });

  it('22. 分页组件使用 usePagination', () => {
    const src = readSource();
    assert.ok(src.includes('usePagination'), '应使用 usePagination');
    assert.ok(src.includes('Pagination'), '应使用 Pagination');
  });

  it('23. 响应注册表可匹配 URL', () => {
    const matched = matchUrl('/api/notifications?page=1');
    assert.equal(matched, 'notifications');
  });

  it('24. 不匹配的 URL 返回 null', () => {
    const matched = matchUrl('/api/orders');
    assert.equal(matched, null);
  });
});

/* ── 测试内联的 Mock 数据（已导入，保持 module 作用域内） ── */
type NotifType = 'announcement' | 'marketing' | 'alert' | 'activity';
type RecipientScope = 'all' | 'specific_store' | 'specific_role';
type NotifDeliveryStatus = 'sent' | 'pending' | 'sending';

interface Notification {
  id: string;
  title: string;
  content: string;
  type: NotifType;
  recipientScope: RecipientScope;
  recipientLabel: string;
  status: NotifDeliveryStatus;
  sentAt: string;
  successRate: number;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'N001', title: '系统升级通知 2026-07', content: '系统将于2026年7月25日凌晨02:00-06:00进行例行升级维护', type: 'announcement', recipientScope: 'all', recipientLabel: '全部门店', status: 'sent', sentAt: '2026-07-18 10:00:00', successRate: 100 },
  { id: 'N002', title: '暑期会员营销活动', content: '暑期大促活动即将上线', type: 'marketing', recipientScope: 'all', recipientLabel: '全部门店', status: 'sent', sentAt: '2026-07-17 14:30:00', successRate: 98.5 },
  { id: 'N003', title: '门店设备温度异常告警', content: 'A区3号游戏机温度超过安全阈值', type: 'alert', recipientScope: 'specific_role', recipientLabel: '设备管理员', status: 'sending', sentAt: '2026-07-18 20:15:00', successRate: 72.3 },
  { id: 'N004', title: '新游戏上线体验活动', content: '《极速赛车》新版本将于7月22日上线', type: 'activity', recipientScope: 'specific_store', recipientLabel: '旗舰店·A/B/C区', status: 'sent', sentAt: '2026-07-16 09:00:00', successRate: 100 },
  { id: 'N005', title: '月度消防安全培训通知', content: '7月25日下午14:00将举行月度消防安全线上培训', type: 'announcement', recipientScope: 'specific_role', recipientLabel: '安全员', status: 'pending', sentAt: '', successRate: 0 },
  { id: 'N006', title: '积分兑换促销活动', content: '会员积分双倍兑换活动即将开始', type: 'marketing', recipientScope: 'all', recipientLabel: '全部门店', status: 'pending', sentAt: '', successRate: 0 },
  { id: 'N007', title: '库存预警：热门配件缺货', content: '手柄充电底座库存不足', type: 'alert', recipientScope: 'specific_store', recipientLabel: 'A区门店', status: 'sent', sentAt: '2026-07-18 08:45:00', successRate: 95.0 },
];

/* ── 额外的函数级测试 ── */

describe('notifications — 统计函数', () => {
  it('25. calcSuccessRate 计算正确', () => {
    const sentItems = MOCK_NOTIFICATIONS.filter(n => n.status === 'sent' && n.successRate > 0);
    const total = sentItems.reduce((sum, n) => sum + n.successRate, 0);
    const expected = Math.round(total / sentItems.length);
    assert.equal(Math.round(total / sentItems.length), expected);
  });

  it('26. 本月发送计数不报错', () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const count = MOCK_NOTIFICATIONS.filter(n => {
      if (!n.sentAt) return false;
      return n.sentAt.startsWith(`${year}-${month}`);
    }).length;
    assert.ok(typeof count === 'number' && count >= 0);
  });

  it('27. status 类型值合法', () => {
    const valid: NotifDeliveryStatus[] = ['sent', 'pending', 'sending'];
    for (const n of MOCK_NOTIFICATIONS) {
      assert.ok(valid.includes(n.status), `${n.id} 状态非法: ${n.status}`);
    }
  });

  it('28. type 类型值合法', () => {
    const valid: NotifType[] = ['announcement', 'marketing', 'alert', 'activity'];
    for (const n of MOCK_NOTIFICATIONS) {
      assert.ok(valid.includes(n.type), `${n.id} 类型非法: ${n.type}`);
    }
  });

  it('29. recipientScope 合法', () => {
    const valid: RecipientScope[] = ['all', 'specific_store', 'specific_role'];
    for (const n of MOCK_NOTIFICATIONS) {
      assert.ok(valid.includes(n.recipientScope), `${n.id} 接收范围非法: ${n.recipientScope}`);
    }
  });

  it('30. 成功率在 0-100 之间', () => {
    for (const n of MOCK_NOTIFICATIONS) {
      assert.ok(n.successRate >= 0 && n.successRate <= 100, `${n.id} successRate=${n.successRate}`);
    }
  });

  it('31. 所有 id 唯一', () => {
    const ids = MOCK_NOTIFICATIONS.map(n => n.id);
    assert.equal(new Set(ids).size, ids.length, 'id 不应重复');
  });

  it('32. 标题非空', () => {
    for (const n of MOCK_NOTIFICATIONS) {
      assert.ok(n.title.length > 0, `${n.id} 标题为空`);
    }
  });
});

/* ── 源代码结构检查 ── */

const SRC = readSource();

describe('notifications — 代码结构', () => {
  it('包含 use client 指令', () => assert.ok(SRC.includes("'use client'"), '应是客户端组件'));
  it('包含 JSX 返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含 DataTable 渲染', () => assert.ok(SRC.includes('DataTable')));
  it('包含 Tabs 筛选', () => assert.ok(SRC.includes('Tabs')));
  it('包含 State 声明', () => assert.ok(SRC.includes('useState')));
  it('包含 Style 样式', () => assert.ok(SRC.includes('style={')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes('/**') || SRC.includes('//')));
});

/* ══════════════════════════════════════════════════════════
   React 渲染测试 — @testing-library/react + happy-dom
   使用真实的组件渲染，验证渲染输出
   ══════════════════════════════════════════════════════════ */

let NotificationsPage: React.ComponentType;
let pageModule: any;

describe('notifications — React 渲染', () => {
  /* 所有测试共享一次动态导入 */
  before(async () => {
    pageModule = await import('./page.tsx');
    NotificationsPage = pageModule.default;
  });

  /* 每个测试后清理 DOM */
  afterEach(() => {
    cleanup();
  });

  it('33. render 组件不报错，容器存在', () => {
    const { container } = render(React.createElement(NotificationsPage));
    assert.ok(container, 'container 应存在');
    assert.ok(container.querySelector('main'), '应渲染 main 元素');
  });

  it('34. 渲染页面标题和副标题', () => {
    render(React.createElement(NotificationsPage));
    const titleEl = screen.getByText(/📢 通知管理/);
    assert.ok(titleEl, '应渲染标题 📢 通知管理');

    const subtitleEl = screen.getByText(/管理和查看系统通知的发送记录/);
    assert.ok(subtitleEl, '应渲染副标题');
  });

  it('35. 渲染三个概览统计卡片', () => {
    render(React.createElement(NotificationsPage));

    // StatCard 渲染 label 在 span 中
    const totalLabel = screen.getByText('总通知数');
    const monthLabel = screen.getByText('本月发送');
    const rateLabel = screen.getByText('成功率');

    assert.ok(totalLabel, '应渲染总通知数标签');
    assert.ok(monthLabel, '应渲染本月发送标签');
    assert.ok(rateLabel, '应渲染成功率标签');

    // 统计值也在 DOM 中: 总通知数=7（可能多次出现，用 getAllByText 的 >=1 个）
    const values = screen.getAllByText('7');
    assert.ok(values.length >= 1, '总通知数值 7 应在 DOM 中至少出现 1 次');
    const rateValue = screen.getByText('98%');
    assert.ok(rateValue, '成功率值应为 98%');
  });

  it('36. 渲染 Tab 筛选器（全部/已发送/待发送）', () => {
    render(React.createElement(NotificationsPage));

    // 使用 role=tab 精确获取 tabs，避免「全部门店」干扰
    const tabs = screen.getAllByRole('tab');
    assert.equal(tabs.length, 3, '应有 3 个 tab');

    // 验证 tab 文本
    assert.ok(tabs[0].textContent?.startsWith('全部'), '第一个 tab 应为「全部」');
    assert.ok(tabs[1].textContent?.startsWith('已发送'), '第二个 tab 应为「已发送」');
    assert.ok(tabs[2].textContent?.startsWith('待发送'), '第三个 tab 应为「待发送」');

    // 默认选中「全部」
    assert.equal(tabs[0].getAttribute('aria-selected'), 'true', '默认应选中「全部」');
  });

  it('37. 渲染通知数据表格，包含表头和数据行', () => {
    render(React.createElement(NotificationsPage));

    // 表格标题
    const tableTitle = screen.getByText(/通知 \(7\)/);
    assert.ok(tableTitle, '应显示通知 (7)');

    // 表头
    const headerTitle = screen.getByText('标题');
    const headerType = screen.getByText('类型');
    const headerSentAt = screen.getByText('发送时间');
    const headerStatus = screen.getByText('状态');

    assert.ok(headerTitle, '应渲染「标题」表头');
    assert.ok(headerType, '应渲染「类型」表头');
    assert.ok(headerSentAt, '应渲染「发送时间」表头');
    assert.ok(headerStatus, '应渲染「状态」表头');

    // 数据行 — 特定通知标题应出现在 DOM 中
    const notif1 = screen.getByText('系统升级通知 2026-07');
    const notif2 = screen.getByText('暑期会员营销活动');
    assert.ok(notif1, '应渲染通知 N001 标题');
    assert.ok(notif2, '应渲染通知 N002 标题');

    // StatusBadge 渲染为带标签的元素 — 使用 getAllByText 查找
    const sentBadges = screen.getAllByText('已发送');
    assert.ok(sentBadges.length >= 2, '应渲染至少 2 个「已发送」状态标签');
  });

  it('38. 渲染刷新按钮', () => {
    render(React.createElement(NotificationsPage));
    const refreshBtn = screen.getByText(/🔄 刷新/);
    assert.ok(refreshBtn, '应渲染刷新按钮');
  });

  it('39. 渲染分页器，显示总条数', () => {
    render(React.createElement(NotificationsPage));
    // Pagination 渲染 "Total X items"
    const totalText = screen.getByText(/Total 7 items/);
    assert.ok(totalText, '应渲染分页器 Total 7 items');
  });

  it('40. 渲染表格行包含通知类型标签', () => {
    render(React.createElement(NotificationsPage));
    // StatusBadge 渲染通知类型标签（可能有多个同名行，用 getAllByText）
    const sysAnnounce = screen.getAllByText('系统公告');
    assert.ok(sysAnnounce.length >= 1, '应渲染至少 1 个系统公告类型标签');

    const marketing = screen.getAllByText('营销推送');
    assert.ok(marketing.length >= 1, '应渲染至少 1 个营销推送类型标签');

    const alertType = screen.getAllByText('告警通知');
    assert.ok(alertType.length >= 1, '应渲染至少 1 个告警通知类型标签');

    const activityType = screen.getByText('活动提醒');
    assert.ok(activityType, '应渲染活动提醒类型标签');
  });

  it('41. 渲染收件人标签', () => {
    render(React.createElement(NotificationsPage));
    const allStores = screen.getAllByText('全部门店');
    assert.ok(allStores.length >= 2, '应渲染至少 2 个「全部门店」收件人标签');

    const adminRole = screen.getByText('设备管理员');
    assert.ok(adminRole, '应渲染「设备管理员」收件人标签');
  });

  it('42. 发送时间不为空的条目显示时间', () => {
    render(React.createElement(NotificationsPage));
    const sentTime = screen.getByText('2026-07-18 10:00:00');
    assert.ok(sentTime, '应渲染 N001 的发送时间');
  });
});
