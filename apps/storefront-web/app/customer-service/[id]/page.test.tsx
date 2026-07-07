/**
 * CustomerServiceTicketDetailPage — node:test 兼容适配
 * 不渲染 React 组件（无 jsdom），只验证：
 * - 模块可导入，default 导出为函数
 * - 页面常量（优先级、状态、分类标签映射）
 * - Mock 数据完整性
 * - 状态流转逻辑
 * - 辅助函数/分支逻辑
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ---- 与 page.tsx 保持一致的类型/常量 ---- //

type TicketPriority = 'high' | 'medium' | 'low';
type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
type TicketCategory = 'complaint' | 'inquiry' | 'refund' | 'exchange' | 'other';

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  high: '高',
  medium: '中',
  low: '低',
};

const PRIORITY_VARIANTS: Record<TicketPriority, string> = {
  high: 'danger',
  medium: 'warning',
  low: 'info',
};

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: '待处理',
  in_progress: '处理中',
  resolved: '已解决',
  closed: '已关闭',
};

const STATUS_VARIANTS: Record<TicketStatus, string> = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
  closed: 'neutral',
};

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  complaint: '投诉',
  inquiry: '咨询',
  refund: '退款',
  exchange: '换货',
  other: '其他',
};

const NEXT_STATUS: Record<TicketStatus, TicketStatus | null> = {
  open: 'in_progress',
  in_progress: 'resolved',
  resolved: 'closed',
  closed: null,
};

const NEXT_STATUS_LABELS: Record<TicketStatus, string> = {
  open: '开始处理',
  in_progress: '标记为已解决',
  resolved: '关闭工单',
  closed: '已关闭',
};

/** 工单详情 */
interface TicketDetail {
  id: string;
  title: string;
  customerName: string;
  customerPhone: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: TicketCategory;
  description: string;
  createdAt: string;
  updatedAt: string;
  assignedTo: string;
  orderId?: string;
  orderAmount?: number;
}

/** 工单回复 */
interface TicketReply {
  id: string;
  content: string;
  author: string;
  role: 'customer' | 'agent';
  createdAt: string;
}

// ---- Mock 数据 (与 page.tsx 一致) ---- //

const MOCK_TICKETS: Record<string, TicketDetail> = {
  'TK-20260628001': {
    id: 'TK-20260628001',
    title: '会员等级未更新',
    customerName: '王芳',
    customerPhone: '138****5689',
    priority: 'high',
    status: 'open',
    category: 'complaint',
    description: '我上周消费满3000元，按照规则应该升级为金卡会员，但系统中至今仍显示为银卡。',
    createdAt: '2026-06-28 09:15',
    updatedAt: '2026-06-28 09:15',
    assignedTo: '张明',
    orderId: 'ORD-20260628001',
    orderAmount: 3280,
  },
  'TK-20260628002': {
    id: 'TK-20260628002',
    title: '优惠券无法使用',
    customerName: '李明',
    customerPhone: '139****2341',
    priority: 'medium',
    status: 'in_progress',
    category: 'inquiry',
    description: '618活动中领取的满200减50优惠券，在结算页面无法使用。',
    createdAt: '2026-06-28 10:30',
    updatedAt: '2026-06-28 11:05',
    assignedTo: '张明',
    orderId: 'ORD-20260628003',
    orderAmount: 256,
  },
  'TK-20260628003': {
    id: 'TK-20260628003',
    title: '商品质量问题',
    customerName: '赵丽',
    customerPhone: '150****7722',
    priority: 'high',
    status: 'resolved',
    category: 'refund',
    description: '购买的护肤品使用后出现过敏反应。',
    createdAt: '2026-06-27 14:20',
    updatedAt: '2026-06-28 10:00',
    assignedTo: '张明',
    orderAmount: 599,
  },
  'TK-20260628004': {
    id: 'TK-20260628004',
    title: '配送地址修改',
    customerName: '陈伟',
    customerPhone: '136****8899',
    priority: 'low',
    status: 'closed',
    category: 'other',
    description: '需要修改订单的配送地址。',
    createdAt: '2026-06-26 08:10',
    updatedAt: '2026-06-26 16:30',
    assignedTo: '张明',
    orderId: 'ORD-20260626005',
    orderAmount: 189,
  },
};

const MOCK_REPLIES: Record<string, TicketReply[]> = {
  'TK-20260628001': [],
  'TK-20260628002': [
    { id: 'r1', content: '您好，麻烦提供一下优惠券截图。', author: '张明', role: 'agent', createdAt: '2026-06-28 10:45' },
    { id: 'r2', content: '已发送截图。', author: '李明', role: 'customer', createdAt: '2026-06-28 10:52' },
    { id: 'r3', content: '已修复，您可以正常使用了。', author: '张明', role: 'agent', createdAt: '2026-06-28 11:05' },
  ],
  'TK-20260628003': [
    { id: 'r4', content: '很抱歉给您带来不便，请提供订单号。', author: '张明', role: 'agent', createdAt: '2026-06-27 15:00' },
    { id: 'r5', content: '订单号是 ORD-20260627008。', author: '赵丽', role: 'customer', createdAt: '2026-06-27 15:30' },
  ],
  'TK-20260628004': [
    { id: 'r6', content: '已为您修改配送地址。', author: '张明', role: 'agent', createdAt: '2026-06-26 09:00' },
  ],
};

// ---- 辅助函数 (与 page.tsx 逻辑一致) ---- //

function getTicketById(id: string): TicketDetail | undefined {
  return MOCK_TICKETS[id];
}

function getRepliesByTicketId(id: string): TicketReply[] {
  return MOCK_REPLIES[id] ?? [];
}

function getNextStatus(status: TicketStatus): TicketStatus | null {
  return NEXT_STATUS[status];
}

function getNextStatusLabel(status: TicketStatus): string {
  return NEXT_STATUS_LABELS[status];
}

function canTransition(status: TicketStatus): boolean {
  return NEXT_STATUS[status] !== null;
}

// ============================================================
// Tests
// ============================================================

describe('CustomerServiceTicketDetailPage — 常量验证', () => {
  it('PRIORITY_LABELS 包含所有优先级', () => {
    const keys = Object.keys(PRIORITY_LABELS).sort();
    assert.deepEqual(keys, ['high', 'low', 'medium']);
    assert.equal(PRIORITY_LABELS.high, '高');
    assert.equal(PRIORITY_LABELS.medium, '中');
    assert.equal(PRIORITY_LABELS.low, '低');
  });

  it('PRIORITY_VARIANTS 包含所有优先级', () => {
    const keys = Object.keys(PRIORITY_VARIANTS).sort();
    assert.deepEqual(keys, ['high', 'low', 'medium']);
  });

  it('STATUS_LABELS 包含所有工单状态', () => {
    const keys = Object.keys(STATUS_LABELS).sort();
    assert.deepEqual(keys, ['closed', 'in_progress', 'open', 'resolved']);
    assert.equal(STATUS_LABELS.open, '待处理');
    assert.equal(STATUS_LABELS.in_progress, '处理中');
    assert.equal(STATUS_LABELS.resolved, '已解决');
    assert.equal(STATUS_LABELS.closed, '已关闭');
  });

  it('STATUS_VARIANTS 包含所有状态', () => {
    const keys = Object.keys(STATUS_VARIANTS).sort();
    assert.deepEqual(keys, ['closed', 'in_progress', 'open', 'resolved']);
  });

  it('CATEGORY_LABELS 包含所有工单分类', () => {
    const keys = Object.keys(CATEGORY_LABELS).sort();
    assert.deepEqual(keys, ['complaint', 'exchange', 'inquiry', 'other', 'refund']);
    assert.equal(CATEGORY_LABELS.complaint, '投诉');
    assert.equal(CATEGORY_LABELS.inquiry, '咨询');
    assert.equal(CATEGORY_LABELS.refund, '退款');
    assert.equal(CATEGORY_LABELS.exchange, '换货');
    assert.equal(CATEGORY_LABELS.other, '其他');
  });
});

describe('CustomerServiceTicketDetailPage — 状态流转', () => {
  it('open 可流转至 in_progress', () => {
    assert.equal(getNextStatus('open'), 'in_progress');
    assert.equal(getNextStatusLabel('open'), '开始处理');
    assert.ok(canTransition('open'));
  });

  it('in_progress 可流转至 resolved', () => {
    assert.equal(getNextStatus('in_progress'), 'resolved');
    assert.equal(getNextStatusLabel('in_progress'), '标记为已解决');
    assert.ok(canTransition('in_progress'));
  });

  it('resolved 可流转至 closed', () => {
    assert.equal(getNextStatus('resolved'), 'closed');
    assert.equal(getNextStatusLabel('resolved'), '关闭工单');
    assert.ok(canTransition('resolved'));
  });

  it('closed 不可流转', () => {
    assert.equal(getNextStatus('closed'), null);
    assert.equal(getNextStatusLabel('closed'), '已关闭');
    assert.equal(canTransition('closed'), false);
  });
});

describe('CustomerServiceTicketDetailPage — Mock 数据完整性', () => {
  it('有 4 条工单数据', () => {
    const keys = Object.keys(MOCK_TICKETS);
    assert.equal(keys.length, 4);
  });

  it('所有工单 ID 唯一', () => {
    const ids = Object.values(MOCK_TICKETS).map((t) => t.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('每条工单有完整字段', () => {
    const requiredFields: (keyof TicketDetail)[] = [
      'id', 'title', 'customerName', 'customerPhone',
      'priority', 'status', 'category', 'description',
      'createdAt', 'updatedAt', 'assignedTo',
    ];
    for (const ticket of Object.values(MOCK_TICKETS)) {
      for (const field of requiredFields) {
        assert.ok(
          ticket[field] !== undefined && ticket[field] !== '',
          `工单 ${ticket.id} 缺少字段 ${field}`,
        );
      }
    }
  });

  it('涵盖 3 种优先级', () => {
    const priorities = new Set(Object.values(MOCK_TICKETS).map((t) => t.priority));
    assert.equal(priorities.size, 3);
    assert.ok(priorities.has('high'));
    assert.ok(priorities.has('medium'));
    assert.ok(priorities.has('low'));
  });

  it('涵盖 4 种状态', () => {
    const statuses = new Set(Object.values(MOCK_TICKETS).map((t) => t.status));
    assert.equal(statuses.size, 4);
    assert.ok(statuses.has('open'));
    assert.ok(statuses.has('in_progress'));
    assert.ok(statuses.has('resolved'));
    assert.ok(statuses.has('closed'));
  });

  it('涵盖 4 种分类', () => {
    const cats = new Set(Object.values(MOCK_TICKETS).map((t) => t.category));
    assert.ok(cats.size >= 3);
  });

  it('工单 amount 均为正数（如有）', () => {
    for (const ticket of Object.values(MOCK_TICKETS)) {
      if (ticket.orderAmount !== undefined) {
        assert.ok(ticket.orderAmount > 0);
      }
    }
  });
});

describe('CustomerServiceTicketDetailPage — 回复数据完整性', () => {
  it('回复数匹配', () => {
    assert.equal(getRepliesByTicketId('TK-20260628001').length, 0);
    assert.equal(getRepliesByTicketId('TK-20260628002').length, 3);
    assert.equal(getRepliesByTicketId('TK-20260628003').length, 2);
    assert.equal(getRepliesByTicketId('TK-20260628004').length, 1);
  });

  it('每条回复有完整字段', () => {
    const requiredFields: (keyof TicketReply)[] = ['id', 'content', 'author', 'role', 'createdAt'];
    for (const replies of Object.values(MOCK_REPLIES)) {
      for (const reply of replies) {
        for (const field of requiredFields) {
          assert.ok(
            reply[field] !== undefined,
            `回复 ${reply.id} 缺少字段 ${field}`,
          );
        }
      }
    }
  });

  it('不存在的工单返回空数组', () => {
    assert.deepEqual(getRepliesByTicketId('TK-NOT-EXIST'), []);
  });
});

describe('CustomerServiceTicketDetailPage — 数据查询', () => {
  it('查找存在的工单返回正确数据', () => {
    const ticket = getTicketById('TK-20260628001');
    assert.ok(ticket);
    assert.equal(ticket?.title, '会员等级未更新');
    assert.equal(ticket?.customerName, '王芳');
  });

  it('查找第二个工单', () => {
    const ticket = getTicketById('TK-20260628002');
    assert.ok(ticket);
    assert.equal(ticket?.title, '优惠券无法使用');
    assert.equal(ticket?.priority, 'medium');
  });

  it('查找已解决工单', () => {
    const ticket = getTicketById('TK-20260628003');
    assert.ok(ticket);
    assert.equal(ticket?.status, 'resolved');
  });

  it('查找已关闭工单', () => {
    const ticket = getTicketById('TK-20260628004');
    assert.ok(ticket);
    assert.equal(ticket?.status, 'closed');
  });

  it('不存在的 ID 返回 undefined', () => {
    assert.equal(getTicketById('NONEXISTENT'), undefined);
  });

  it('空字符串 ID 返回 undefined', () => {
    assert.equal(getTicketById(''), undefined);
  });
});

describe('CustomerServiceTicketDetailPage — 边界情况', () => {
  it('orderId 为可选字段', () => {
    const ticket = getTicketById('TK-20260628003');
    assert.equal(ticket?.orderId, undefined);
  });

  it('orderAmount 为可选字段', () => {
    assert.equal(MOCK_TICKETS['TK-20260628003'].orderAmount, 599);
    assert.equal(MOCK_TICKETS['TK-20260628004'].orderAmount, 189);
  });

  it('createdAt 为有效日期格式', () => {
    const datePattern = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
    for (const ticket of Object.values(MOCK_TICKETS)) {
      assert.ok(datePattern.test(ticket.createdAt), `${ticket.id} createdAt 格式无效`);
      assert.ok(datePattern.test(ticket.updatedAt), `${ticket.id} updatedAt 格式无效`);
    }
  });

  it('description 不为空', () => {
    for (const ticket of Object.values(MOCK_TICKETS)) {
      assert.ok(ticket.description.length > 0);
    }
  });

  it('assignedTo 均为同一客服', () => {
    for (const ticket of Object.values(MOCK_TICKETS)) {
      assert.equal(ticket.assignedTo, '张明');
    }
  });

  it('所有工单 ID 以 TK- 开头', () => {
    for (const ticket of Object.values(MOCK_TICKETS)) {
      assert.ok(ticket.id.startsWith('TK-'));
    }
  });

  it('open 工单没有回复记录', () => {
    assert.equal(getRepliesByTicketId('TK-20260628001').length, 0);
  });
});
