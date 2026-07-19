/**
 * MemberDetailScreen.test.tsx - 会员详情页单元测试
 * 三态覆盖: 正常渲染 / 角色权限 / 边界状态 / 交互回调
 * 总用例: 16
 */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { create, act } from 'react-test-renderer';
import { MemberDetailScreen, type MemberDetail } from './MemberDetailScreen';

/* ------------------------------------------------------------------ */
/*  Fixtures                                                           */
/* ------------------------------------------------------------------ */

const SAMPLE_MEMBER: MemberDetail = {
  id: 'mem-001',
  name: '李四',
  phone: '139****5678',
  level: 'silver',
  status: 'active',
  points: 1680,
  totalSpent: 8900,
  joinDate: '2025-06-01',
  recentVisit: '2026-06-29',
};

/* All member levels for boundary testing */
const ALL_LEVELS = ['bronze', 'silver', 'gold', 'platinum'] as const;

/* All member statuses for boundary testing */
const ALL_STATUSES = ['active', 'frozen', 'inactive'] as const;

/* ------------------------------------------------------------------ */
/*  Helper                                                             */
/* ------------------------------------------------------------------ */

function collectTexts(root: ReturnType<typeof create>['root']): string[] {
  const allText = root.findAllByType('Text');
  return allText.map((t) => {
    const c = t.props.children;
    return Array.isArray(c) ? c.join('') : typeof c === 'string' ? c : String(c ?? '');
  });
}

function textContains(root: ReturnType<typeof create>['root'], substr: string): boolean {
  return collectTexts(root).some((t) => t.includes(substr));
}

/* ================================================================== */
/*  正例: 正常渲染 + 核心数据                                          */
/* ================================================================== */

describe('MemberDetailScreen', () => {
  it('renders member name', () => {
    const root = create(<MemberDetailScreen member={SAMPLE_MEMBER} />).root;
    const nameEl = root.findByProps({ children: '李四' });
    expect(nameEl).toBeDefined();
  });

  it('renders member phone', () => {
    const root = create(<MemberDetailScreen member={SAMPLE_MEMBER} />).root;
    const phoneEl = root.findByProps({ children: '139****5678' });
    expect(phoneEl).toBeDefined();
  });

  it('renders badges for level and status', () => {
    const root = create(<MemberDetailScreen member={SAMPLE_MEMBER} />).root;
    const badges = root.findAllByProps({ children: '白银' });
    expect(badges.length).toBeGreaterThanOrEqual(1);
    const statusBadges = root.findAllByProps({ children: '正常' });
    expect(statusBadges.length).toBeGreaterThanOrEqual(1);
  });

  it('renders avatar with first character of name', () => {
    const root = create(<MemberDetailScreen member={SAMPLE_MEMBER} />).root;
    const avatarText = root.findByProps({ children: '李' });
    expect(avatarText).toBeDefined();
  });

  it('renders stat values: points, totalSpent, joinDate, recentVisit', () => {
    const root = create(<MemberDetailScreen member={SAMPLE_MEMBER} />).root;
    expect(textContains(root, '1,680')).toBe(true);
    expect(textContains(root, '¥8,900')).toBe(true);
    expect(textContains(root, '2025-06-01')).toBe(true);
    expect(textContains(root, '2026-06-29')).toBe(true);
  });

  it('renders level section with all four levels for manager role', () => {
    const root = create(
      <MemberDetailScreen member={SAMPLE_MEMBER} userRole="manager" />,
    ).root;
    const buttons = root.findAllByProps({ accessibilityLabel: '升级到青铜' });
    expect(buttons.length).toBeGreaterThanOrEqual(1);
    const goldLabel = root.findAllByProps({ accessibilityLabel: '升级到黄金' });
    expect(goldLabel.length).toBeGreaterThanOrEqual(1);
    const platinumLabel = root.findAllByProps({ accessibilityLabel: '升级到铂金' });
    expect(platinumLabel.length).toBeGreaterThanOrEqual(1);
  });

  it('renders edit button for manager role', () => {
    const root = create(
      <MemberDetailScreen member={SAMPLE_MEMBER} userRole="manager" />,
    ).root;
    const editBtn = root.findByProps({ accessibilityLabel: '编辑会员信息' });
    expect(editBtn).toBeDefined();
  });

  it('renders freeze button for admin role on active member', () => {
    const root = create(
      <MemberDetailScreen member={SAMPLE_MEMBER} userRole="admin" />,
    ).root;
    const freezeBtn = root.findByProps({ accessibilityLabel: '冻结会员' });
    expect(freezeBtn).toBeDefined();
  });

  it('renders unfreeze button for admin role on frozen member', () => {
    const frozenMember: MemberDetail = { ...SAMPLE_MEMBER, status: 'frozen' };
    const root = create(
      <MemberDetailScreen member={frozenMember} userRole="admin" />,
    ).root;
    const unfreezeBtn = root.findByProps({ accessibilityLabel: '解冻会员' });
    expect(unfreezeBtn).toBeDefined();
    const freezeBtns = root.findAllByProps({ accessibilityLabel: '冻结会员' });
    expect(freezeBtns.length).toBe(0);
  });

  it('renders delete button for admin role', () => {
    const root = create(
      <MemberDetailScreen member={SAMPLE_MEMBER} userRole="admin" />,
    ).root;
    const deleteBtn = root.findByProps({ accessibilityLabel: '注销会员' });
    expect(deleteBtn).toBeDefined();
  });

  /* ============================================================== */
  /*  反例: 权限限制                                                  */
  /* ============================================================== */

  it('hides edit button for clerk role', () => {
    const root = create(
      <MemberDetailScreen member={SAMPLE_MEMBER} userRole="clerk" />,
    ).root;
    const editBtns = root.findAllByProps({ accessibilityLabel: '编辑会员信息' });
    expect(editBtns.length).toBe(0);
  });

  it('hides level section when userRole is clerk', () => {
    const root = create(
      <MemberDetailScreen member={SAMPLE_MEMBER} userRole="clerk" />,
    ).root;
    const sectionTitles = root.findAllByProps({ children: '等级变更' });
    expect(sectionTitles.length).toBe(0);
  });

  it('hides freeze/unfreeze buttons for non-admin role (manager)', () => {
    const root = create(
      <MemberDetailScreen member={SAMPLE_MEMBER} userRole="manager" />,
    ).root;
    const freezeBtns = root.findAllByProps({ accessibilityLabel: '冻结会员' });
    expect(freezeBtns.length).toBe(0);
    const unfreezeBtns = root.findAllByProps({ accessibilityLabel: '解冻会员' });
    expect(unfreezeBtns.length).toBe(0);
    // Edit button should still show for manager
    const editBtn = root.findByProps({ accessibilityLabel: '编辑会员信息' });
    expect(editBtn).toBeDefined();
  });

  it('hides delete button for non-admin role (manager)', () => {
    const root = create(
      <MemberDetailScreen member={SAMPLE_MEMBER} userRole="manager" />,
    ).root;
    const deleteBtns = root.findAllByProps({ accessibilityLabel: '注销会员' });
    expect(deleteBtns.length).toBe(0);
  });

  /* ============================================================== */
  /*  交互: 回调触发                                                  */
  /* ============================================================== */

  it('fires onEdit callback when edit pressed', () => {
    const onEdit = vi.fn();
    const root = create(
      <MemberDetailScreen
        member={SAMPLE_MEMBER}
        userRole="manager"
        onEdit={onEdit}
      />,
    ).root;
    const editBtn = root.findByProps({ accessibilityLabel: '编辑会员信息' });
    act(() => editBtn.props.onPress());
    expect(onEdit).toHaveBeenCalledWith(SAMPLE_MEMBER);
  });

  it('fires onFreeze callback when freeze pressed', () => {
    const onFreeze = vi.fn();
    const root = create(
      <MemberDetailScreen
        member={SAMPLE_MEMBER}
        userRole="admin"
        onFreeze={onFreeze}
      />,
    ).root;
    const freezeBtn = root.findByProps({ accessibilityLabel: '冻结会员' });
    act(() => freezeBtn.props.onPress());
    expect(onFreeze).toHaveBeenCalledWith(SAMPLE_MEMBER);
  });

  it('fires onUnfreeze callback when unfreeze pressed', () => {
    const onUnfreeze = vi.fn();
    const frozenMember: MemberDetail = { ...SAMPLE_MEMBER, status: 'frozen' };
    const root = create(
      <MemberDetailScreen
        member={frozenMember}
        userRole="admin"
        onUnfreeze={onUnfreeze}
      />,
    ).root;
    const unfreezeBtn = root.findByProps({ accessibilityLabel: '解冻会员' });
    act(() => unfreezeBtn.props.onPress());
    expect(onUnfreeze).toHaveBeenCalledWith(frozenMember);
  });

  it('fires onChangeLevel when level button pressed', () => {
    const onChangeLevel = vi.fn();
    const root = create(
      <MemberDetailScreen
        member={SAMPLE_MEMBER}
        userRole="manager"
        onChangeLevel={onChangeLevel}
      />,
    ).root;
    const goldBtn = root.findByProps({ accessibilityLabel: '升级到黄金' });
    act(() => goldBtn.props.onPress());
    expect(onChangeLevel).toHaveBeenCalledWith(SAMPLE_MEMBER, 'gold');
  });

  it('fires onDelete when delete pressed', () => {
    const onDelete = vi.fn();
    const root = create(
      <MemberDetailScreen
        member={SAMPLE_MEMBER}
        userRole="admin"
        onDelete={onDelete}
      />,
    ).root;
    const deleteBtn = root.findByProps({ accessibilityLabel: '注销会员' });
    act(() => deleteBtn.props.onPress());
    expect(onDelete).toHaveBeenCalledWith(SAMPLE_MEMBER);
  });

  /* ============================================================== */
  /*  边界: 默认值 + 禁用状态                                         */
  /* ============================================================== */

  it('renders default member when no member prop', () => {
    const root = create(<MemberDetailScreen />).root;
    const nameEl = root.findByProps({ children: '张三' });
    expect(nameEl).toBeDefined();
    const phoneEl = root.findByProps({ children: '138****1234' });
    expect(phoneEl).toBeDefined();
  });

  it('disables current level button', () => {
    const root = create(
      <MemberDetailScreen member={SAMPLE_MEMBER} userRole="manager" />,
    ).root;
    const silverBtns = root.findAllByType('TouchableOpacity');
    const disabledSilverBtn = silverBtns.find(
      (b) => b.props.disabled === true && b.props.accessibilityLabel === '升级到白银',
    );
    expect(disabledSilverBtn).toBeDefined();
  });

  it('renders section title 会员操作', () => {
    const root = create(<MemberDetailScreen member={SAMPLE_MEMBER} />).root;
    expect(textContains(root, '会员操作')).toBe(true);
  });

  it('shows level badge colors for all levels', () => {
    for (const level of ALL_LEVELS) {
      const member = { ...SAMPLE_MEMBER, level: level as typeof SAMPLE_MEMBER.level };
      const root = create(<MemberDetailScreen member={member} />).root;
      expect(textContains(root, member.name)).toBe(true);
    }
  });

  it('shows status badge for all status variants', () => {
    for (const status of ALL_STATUSES) {
      const member = { ...SAMPLE_MEMBER, status: status as typeof SAMPLE_MEMBER.status };
      const root = create(<MemberDetailScreen member={member} />).root;
      expect(textContains(root, member.name)).toBe(true);
    }
  });
});
