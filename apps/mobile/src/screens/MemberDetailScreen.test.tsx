/**
 * MemberDetailScreen.test.tsx - 会员详情页单元测试
 */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { create, act } from 'react-test-renderer';
import { MemberDetailScreen, type MemberDetail } from './MemberDetailScreen';

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

  it('renders stat values: points, totalSpent, joinDate, recentVisit', () => {
    const root = create(<MemberDetailScreen member={SAMPLE_MEMBER} />).root;
    // Points value is nested inside Text with unit child — use text content check
    const allText = root.findAllByType('Text');
    const textContents = allText.map((t) => {
      const c = t.props.children;
      return Array.isArray(c) ? c.join('') : typeof c === 'string' ? c : '';
    });
    expect(textContents.some((t) => t.includes('1,680'))).toBe(true);
    expect(textContents.some((t) => t.includes('¥8,900'))).toBe(true);
    expect(textContents.some((t) => t.includes('2025-06-01'))).toBe(true);
    expect(textContents.some((t) => t.includes('2026-06-29'))).toBe(true);
  });

  it('shows level change buttons for manager role', () => {
    const root = create(
      <MemberDetailScreen member={SAMPLE_MEMBER} userRole="manager" />,
    ).root;
    const buttons = root.findAllByProps({ accessibilityLabel: '升级到青铜' });
    expect(buttons.length).toBeGreaterThanOrEqual(1);
    // Silver is current level, should not show active-state button label in same way
    const goldLabel = root.findAllByProps({ accessibilityLabel: '升级到黄金' });
    expect(goldLabel.length).toBeGreaterThanOrEqual(1);
  });

  it('shows edit button for clerk role (canEdit=false)', () => {
    // clerk 不能编辑，所以没有编辑按钮
    const root = create(
      <MemberDetailScreen member={SAMPLE_MEMBER} userRole="clerk" />,
    ).root;
    const editBtns = root.findAllByProps({ accessibilityLabel: '编辑会员信息' });
    expect(editBtns.length).toBe(0);
  });

  it('shows edit button for manager role', () => {
    const root = create(
      <MemberDetailScreen member={SAMPLE_MEMBER} userRole="manager" />,
    ).root;
    const editBtn = root.findByProps({ accessibilityLabel: '编辑会员信息' });
    expect(editBtn).toBeDefined();
  });

  it('shows freeze button for admin role on active member', () => {
    const root = create(
      <MemberDetailScreen member={SAMPLE_MEMBER} userRole="admin" />,
    ).root;
    const freezeBtn = root.findByProps({ accessibilityLabel: '冻结会员' });
    expect(freezeBtn).toBeDefined();
  });

  it('shows unfreeze button for admin role on frozen member', () => {
    const frozenMember: MemberDetail = { ...SAMPLE_MEMBER, status: 'frozen' };
    const root = create(
      <MemberDetailScreen member={frozenMember} userRole="admin" />,
    ).root;
    const unfreezeBtn = root.findByProps({ accessibilityLabel: '解冻会员' });
    expect(unfreezeBtn).toBeDefined();
    // freeze button not shown for frozen
    const freezeBtns = root.findAllByProps({ accessibilityLabel: '冻结会员' });
    expect(freezeBtns.length).toBe(0);
  });

  it('shows delete button for admin role', () => {
    const root = create(
      <MemberDetailScreen member={SAMPLE_MEMBER} userRole="admin" />,
    ).root;
    const deleteBtn = root.findByProps({ accessibilityLabel: '注销会员' });
    expect(deleteBtn).toBeDefined();
  });

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

  it('disables current level button', () => {
    const root = create(
      <MemberDetailScreen member={SAMPLE_MEMBER} userRole="manager" />,
    ).root;
    // silver is current level → TouchableOpacity has disabled prop
    const silverBtns = root.findAllByType('TouchableOpacity');
    const disabledSilverBtn = silverBtns.find(
      (b) => b.props.disabled === true && b.props.accessibilityLabel === '升级到白银',
    );
    expect(disabledSilverBtn).toBeDefined();
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

  it('renders default member when no member prop', () => {
    const root = create(<MemberDetailScreen />).root;
    const nameEl = root.findByProps({ children: '张三' });
    expect(nameEl).toBeDefined();
  });

  it('hides level section when userRole is clerk', () => {
    const root = create(
      <MemberDetailScreen member={SAMPLE_MEMBER} userRole="clerk" />,
    ).root;
    const sectionTitles = root.findAllByProps({ children: '等级变更' });
    expect(sectionTitles.length).toBe(0);
  });
});
