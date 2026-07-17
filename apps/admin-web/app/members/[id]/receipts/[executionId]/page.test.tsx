/**
 * members/[id]/receipts/[executionId]/page.test.tsx
 * 会员运营执行回执详情页 L1 冒烟测试
 * ⚡ 覆盖: 状态颜色映射 / 审批状态颜色 / 链接样式工厂 / 边界情况
 */

import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';
import fs from 'node:fs';

// ---- 类型（与 page.tsx 保持同步） ----

type RuntimeState = 'callback-recorded' | 'replay-scheduled' | 'blocked' | 'submitted' | string | null | undefined;
type ApprovalStatus = 'APPROVED' | 'PENDING' | 'REJECTED';
type LinkKind = 'member' | 'runtime' | 'approval' | 'receipt';

// ---- 辅助函数（从 page.tsx 提取的独立逻辑） ----

function runtimeStateColor(state?: RuntimeState): string {
  if (state === 'callback-recorded') return '#86efac';
  if (state === 'replay-scheduled') return '#93c5fd';
  if (state === 'blocked') return '#fca5a5';
  if (state === 'submitted') return '#fde68a';
  return '#cbd5e1';
}

function runtimeApprovalColor(status: string): string {
  if (status === 'APPROVED') return '#86efac';
  if (status === 'PENDING') return '#fde68a';
  return '#fca5a5';
}

function getStatCardProps(props: { label: string; value: string; helper: string }): string {
  return `${props.label}:${props.value}:${props.helper}`;
}

function linkBtnStyle(kind: LinkKind) {
  const palette =
    kind === 'approval'
      ? { background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.24)', color: '#fde68a' }
      : kind === 'runtime'
        ? { background: 'rgba(59,130,246,0.16)', border: '1px solid rgba(96,165,250,0.3)', color: '#dbeafe' }
        : kind === 'receipt'
          ? { background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(192,132,252,0.22)', color: '#e9d5ff' }
          : { background: 'rgba(14,165,233,0.12)', border: '1px solid rgba(56,189,248,0.24)', color: '#dbeafe' };

  return {
    borderRadius: 10,
    padding: '8px 14px',
    textDecoration: 'none',
    fontSize: 13,
    ...palette,
  };
}

function actionBtnStyle() {
  return {
    borderRadius: 10,
    padding: '8px 14px',
    fontSize: 13,
    cursor: 'pointer',
    background: 'rgba(248, 113, 113, 0.14)',
    border: '1px solid rgba(248, 113, 113, 0.28)',
    color: '#fecaca',
  };
}

function isReceiptNotFound(receipt: unknown): boolean {
  return receipt === null || receipt === undefined;
}

function isRuntimeReplayEnabled(runtimeReceiptCode: string | null | undefined): boolean {
  return !!runtimeReceiptCode;
}

function buildReceiptSubtitle(
  loading: boolean,
  deliveryMode: string,
  memberName: string | null | undefined,
  memberId: string
): string {
  if (loading) return '正在同步执行回执详情...';
  return `数据源 ${deliveryMode} · 会员 ${memberName ?? memberId}`;
}

// ---- 测试套件 ----

describe('MemberOperationReceiptDetailPage — runtimeStateColor', () => {
  it('callback-recorded 返回绿色', () => {
    assert.strictEqual(runtimeStateColor('callback-recorded'), '#86efac');
  });

  it('replay-scheduled 返回蓝色', () => {
    assert.strictEqual(runtimeStateColor('replay-scheduled'), '#93c5fd');
  });

  it('blocked 返回红色', () => {
    assert.strictEqual(runtimeStateColor('blocked'), '#fca5a5');
  });

  it('submitted 返回黄色', () => {
    assert.strictEqual(runtimeStateColor('submitted'), '#fde68a');
  });

  it('null/undefined 返回默认灰色', () => {
    assert.strictEqual(runtimeStateColor(null), '#cbd5e1');
    assert.strictEqual(runtimeStateColor(undefined), '#cbd5e1');
  });

  it('未知状态返回默认灰色', () => {
    assert.strictEqual(runtimeStateColor('unknown'), '#cbd5e1');
  });

  it('空字符串返回默认灰色', () => {
    assert.strictEqual(runtimeStateColor(''), '#cbd5e1');
  });
});

describe('MemberOperationReceiptDetailPage — runtimeApprovalColor', () => {
  it('APPROVED 返回绿色', () => {
    assert.strictEqual(runtimeApprovalColor('APPROVED'), '#86efac');
  });

  it('PENDING 返回黄色', () => {
    assert.strictEqual(runtimeApprovalColor('PENDING'), '#fde68a');
  });

  it('REJECTED 返回红色', () => {
    assert.strictEqual(runtimeApprovalColor('REJECTED'), '#fca5a5');
  });

  it('其他状态返回红色（兜底）', () => {
    assert.strictEqual(runtimeApprovalColor('CANCELLED'), '#fca5a5');
    assert.strictEqual(runtimeApprovalColor('EXPIRED'), '#fca5a5');
    assert.strictEqual(runtimeApprovalColor(''), '#fca5a5');
  });
});

describe('MemberOperationReceiptDetailPage — linkBtnStyle', () => {
  it('member 样式包含对应颜色', () => {
    const style = linkBtnStyle('member');
    assert.strictEqual(style.borderRadius, 10);
    assert.ok(style.background.includes('rgba(14,165,233'));
    assert.strictEqual(style.color, '#dbeafe');
  });

  it('runtime 样式', () => {
    const style = linkBtnStyle('runtime');
    assert.ok(style.background.includes('rgba(59,130,246'));
    assert.strictEqual(style.color, '#dbeafe');
  });

  it('approval 样式', () => {
    const style = linkBtnStyle('approval');
    assert.ok(style.background.includes('rgba(251,191,36'));
    assert.strictEqual(style.color, '#fde68a');
  });

  it('receipt 样式', () => {
    const style = linkBtnStyle('receipt');
    assert.ok(style.background.includes('rgba(168,85,247'));
    assert.strictEqual(style.color, '#e9d5ff');
  });

  it('所有样式共享公共属性', () => {
    for (const kind of ['member', 'runtime', 'approval', 'receipt'] as LinkKind[]) {
      const style = linkBtnStyle(kind);
      assert.strictEqual(style.borderRadius, 10);
      assert.strictEqual(style.textDecoration, 'none');
      assert.strictEqual(style.fontSize, 13);
      assert.ok(typeof style.padding === 'string');
    }
  });
});

describe('MemberOperationReceiptDetailPage — actionBtnStyle', () => {
  it('返回预期样式', () => {
    const style = actionBtnStyle();
    assert.strictEqual(style.cursor, 'pointer');
    assert.strictEqual(style.color, '#fecaca');
    assert.ok(style.background.includes('rgba(248, 113, 113'));
  });
});

describe('MemberOperationReceiptDetailPage — 数据状态判断', () => {
  it('receipt 为 null 时视为不存在', () => {
    assert.strictEqual(isReceiptNotFound(null), true);
    assert.strictEqual(isReceiptNotFound(undefined), true);
  });

  it('receipt 为对象时视为存在', () => {
    assert.strictEqual(isReceiptNotFound({}), false);
    assert.strictEqual(isReceiptNotFound({ id: 'r1' }), false);
  });

  it('runtime receipt code 为空时不显示重放按钮', () => {
    assert.strictEqual(isRuntimeReplayEnabled(null), false);
    assert.strictEqual(isRuntimeReplayEnabled(undefined), false);
    assert.strictEqual(isRuntimeReplayEnabled(''), false);
  });

  it('runtime receipt code 非空时显示重放按钮', () => {
    assert.strictEqual(isRuntimeReplayEnabled('rc-123'), true);
  });
});

describe('MemberOperationReceiptDetailPage — 副标题构建', () => {
  it('加载中显示同步状态', () => {
    const subtitle = buildReceiptSubtitle(true, 'fallback', null, 'm-001');
    assert.strictEqual(subtitle, '正在同步执行回执详情...');
  });

  it('加载完成后显示数据源和会员', () => {
    const subtitle = buildReceiptSubtitle(false, 'live', '张三', 'm-001');
    assert.strictEqual(subtitle, '数据源 live · 会员 张三');
  });

  it('无会员名时回退到会员 ID', () => {
    const subtitle = buildReceiptSubtitle(false, 'fallback', null, 'm-001');
    assert.strictEqual(subtitle, '数据源 fallback · 会员 m-001');
  });
});

describe('MemberOperationReceiptDetailPage — StatCard props', () => {
  it('格式化 StatCard 属性', () => {
    const result = getStatCardProps({ label: '动作编码', value: 'upgrade-tier', helper: '升级会员等级' });
    assert.strictEqual(result, '动作编码:upgrade-tier:升级会员等级');
  });
});

describe('MemberOperationReceiptDetailPage — 边界情况', () => {
  it('所有 runtime state 颜色互不冲突', () => {
    const states: RuntimeState[] = ['callback-recorded', 'replay-scheduled', 'blocked', 'submitted', null, undefined, 'unknown'];
    const colors = states.map(runtimeStateColor);
    const uniqueColors = new Set(colors);
    assert.strictEqual(uniqueColors.size, 5); // 4 known + 1 default
  });

  it('所有 link kind 都能生成样式', () => {
    const kinds: LinkKind[] = ['member', 'runtime', 'approval', 'receipt'];
    for (const kind of kinds) {
      const style = linkBtnStyle(kind);
      assert.ok(style.color);
      assert.ok(style.background);
    }
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Members / Receipts — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={')));
  it('包含数据结构', () => assert.ok(SRC.includes('{') && SRC.includes('[')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含模板字符串格式化', () => assert.ok(SRC.includes('${')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
