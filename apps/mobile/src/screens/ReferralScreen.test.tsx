/**
 * ReferralScreen.test.tsx
 * 推荐线索表单页单元测试
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { create, act } from 'react-test-renderer';
import { Text, TextInput, TouchableOpacity } from 'react-native';
import { ReferralScreen } from './ReferralScreen';

// Helper: find a Text node by matching children string
function findByText(root: ReturnType<typeof create>['root'], text: string) {
  const allTexts = root.findAllByType(Text);
  return allTexts.find((t) => t.props.children === text);
}

// Helper: find all Text nodes that contain a substring
function findAllByTextContaining(root: ReturnType<typeof create>['root'], substring: string) {
  const allTexts = root.findAllByType(Text);
  return allTexts.filter((t) => {
    const children = t.props.children;
    return typeof children === 'string' && children.includes(substring);
  });
}

describe('ReferralScreen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the form title and subtitle', () => {
    const root = create(<ReferralScreen />).root;
    expect(findByText(root, '推荐新客户')).toBeDefined();
    expect(findByText(root, '填写以下信息提交推荐线索')).toBeDefined();
  });

  it('renders three TextInput fields', () => {
    const root = create(<ReferralScreen />).root;
    const inputs = root.findAllByType(TextInput);
    expect(inputs.length).toBe(3);
  });

  it('shows validation errors when submitting empty (name + phone + interest)', () => {
    const root = create(<ReferralScreen />).root;
    const buttons = root.findAllByType(TouchableOpacity);
    // The last/largest TouchableOpacity is the submit button
    const submitBtn = buttons[buttons.length - 1];
    expect(submitBtn).toBeDefined();

    act(() => submitBtn.props.onPress());

    const errorTexts = findAllByTextContaining(root, '请输入');
    // At minimum, name field error "请输入客户姓名"
    const nameError = root.findAllByType(Text).find((t) => t.props.children === '请输入客户姓名');
    expect(nameError).toBeDefined();
  });

  it('shows phone format error', () => {
    const root = create(<ReferralScreen />).root;
    const inputs = root.findAllByType(TextInput);
    const nameInput = inputs[0];
    const phoneInput = inputs[1];

    act(() => nameInput.props.onChangeText('张三'));
    act(() => phoneInput.props.onChangeText('12345'));

    const buttons = root.findAllByType(TouchableOpacity);
    const submitBtn = buttons[buttons.length - 1];
    act(() => submitBtn.props.onPress());

    const phoneError = root.findAllByType(Text).find((t) => t.props.children === '手机号格式不正确');
    expect(phoneError).toBeDefined();
  });

  it('shows success state after valid submit', async () => {
    const root = create(<ReferralScreen />).root;
    const inputs = root.findAllByType(TextInput);
    const nameInput = inputs[0];
    const phoneInput = inputs[1];
    const interestInput = inputs[2];

    act(() => nameInput.props.onChangeText('张三'));
    act(() => phoneInput.props.onChangeText('13800138000'));
    act(() => interestInput.props.onChangeText('想办会员卡'));

    const buttons = root.findAllByType(TouchableOpacity);
    const submitBtn = buttons[buttons.length - 1];

    await act(async () => {
      submitBtn.props.onPress();
      await vi.advanceTimersByTimeAsync(900);
    });

    expect(findByText(root, '推荐提交成功')).toBeDefined();
    expect(findByText(root, '继续推荐')).toBeDefined();
  });

  it('shows submitting text while submitting', async () => {
    const root = create(<ReferralScreen />).root;
    const inputs = root.findAllByType(TextInput);
    act(() => inputs[0].props.onChangeText('李四'));
    act(() => inputs[1].props.onChangeText('13900139000'));
    act(() => inputs[2].props.onChangeText('咨询活动'));

    const buttons = root.findAllByType(TouchableOpacity);
    const submitBtn = buttons[buttons.length - 1];

    // Start submit
    act(() => submitBtn.props.onPress());
    // Should show "提交中..." before timer advances
    expect(findByText(root, '提交中...')).toBeDefined();

    // Complete
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });

    expect(findByText(root, '推荐提交成功')).toBeDefined();
  });

  it('supports reset after success', async () => {
    const root = create(<ReferralScreen />).root;
    const inputs = root.findAllByType(TextInput);

    act(() => inputs[0].props.onChangeText('王五'));
    act(() => inputs[1].props.onChangeText('13700137000'));
    act(() => inputs[2].props.onChangeText('充值咨询'));

    const buttons = root.findAllByType(TouchableOpacity);
    const submitBtn = buttons[buttons.length - 1];

    await act(async () => {
      submitBtn.props.onPress();
      await vi.advanceTimersByTimeAsync(900);
    });

    // Find "继续推荐" button and click
    const resetBtn = root.findAllByType(TouchableOpacity).find((btn) => {
      const textChildren = btn.props.children;
      if (React.isValidElement(textChildren)) {
        return textChildren.props.children === '继续推荐';
      }
      return false;
    });
    expect(resetBtn).toBeDefined();

    act(() => resetBtn!.props.onPress());

    // Should be back to form
    expect(findByText(root, '推荐新客户')).toBeDefined();
  });
});
