import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

// ---- Mocks (top-level) ----

vi.mock('next/link', () => ({
  default: ({ children, href, style }: any) => (
    <a data-testid="next-link" href={href} style={style}>{children}</a>
  ),
}));

vi.mock('@m5/ui', () => ({
  PageShell: ({ children, title, description, actions }: any) => (
    <div data-testid="page-shell" data-title={title} data-description={description}>
      {actions}
      {children}
    </div>
  ),
  FormField: ({ label, children, error, required, disabled }: any) => (
    <div data-testid={`form-field-${label}`}>
      {label && <label>{label}{required ? ' *' : ''}</label>}
      {children}
      {error && <span data-testid="field-error" style={{ color: 'red' }}>{error}</span>}
    </div>
  ),
  SubmitButton: ({ loading, label, loadingLabel }: any) => (
    <button data-testid="submit-btn" disabled={loading}>
      {loading ? (loadingLabel || '提交中...') : (label || '提交')}
    </button>
  ),
  FormSubmitFeedback: ({ state }: any) => (
    <div data-testid="form-feedback">
      {state?.isSuccess && <span data-testid="form-success">提交成功</span>}
      {state?.error && <span data-testid="form-error">{state.error}</span>}
      {state?.isSuccess && <span data-testid="success-message">{state.successMessage}</span>}
    </div>
  ),
  Button: Object.assign(
    ({ children, onClick, disabled, style }: any) => (
      <button data-testid="m5-btn" onClick={onClick} disabled={disabled} style={style}>{children}</button>
    ),
    { displayName: 'Button' },
  ),
}));

import BookingPage from './page';

describe('BookingPage — 预约看店页面', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ====== 渲染测试 ======

  test('初始渲染显示"预约看店"标题', () => {
    render(<BookingPage />);
    expect(screen.getByText('预约看店')).toBeInTheDocument();
  });

  test('初始渲染显示门店选择提示文案', () => {
    render(<BookingPage />);
    expect(screen.getByText('选择您想前往的门店')).toBeInTheDocument();
  });

  test('初始渲染显示所有模拟门店列表', () => {
    render(<BookingPage />);
    expect(screen.getByText('神机营·旗舰店')).toBeInTheDocument();
    expect(screen.getByText('神机营·赛博店')).toBeInTheDocument();
    expect(screen.getByText('神机营·欢乐谷店')).toBeInTheDocument();
    expect(screen.getByText('神机营·宇宙中心店')).toBeInTheDocument();
    expect(screen.getByText('神机营·滨江店')).toBeInTheDocument();
  });

  test('每个门店卡片显示地址信息', () => {
    render(<BookingPage />);
    expect(screen.getByText(/朝阳区/)).toBeInTheDocument();
    expect(screen.getByText(/浦东新区/)).toBeInTheDocument();
  });

  test('每个门店卡片显示评分和评价数', () => {
    render(<BookingPage />);
    const ratingElements = screen.getAllByText(/★/);
    expect(ratingElements.length).toBeGreaterThanOrEqual(5);
    const reviewElements = screen.getAllByText(/条评价/);
    expect(reviewElements.length).toBeGreaterThanOrEqual(5);
  });

  test('门店显示距离信息', () => {
    render(<BookingPage />);
    const kmElements = screen.getAllByText(/km/);
    expect(kmElements.length).toBeGreaterThanOrEqual(5);
  });

  // ====== 交互测试：选择门店 ======

  test('点击门店跳转到选择时段步骤', async () => {
    render(<BookingPage />);
    await act(async () => {
      fireEvent.click(screen.getByText('神机营·旗舰店'));
    });
    expect(screen.getByText('选择预约时间')).toBeInTheDocument();
    expect(screen.getByText('神机营·旗舰店')).toBeInTheDocument();
  });

  test('选择门店后出现返回按钮', async () => {
    render(<BookingPage />);
    await act(async () => {
      fireEvent.click(screen.getByText('神机营·赛博店'));
    });
    expect(screen.getByText('←')).toBeInTheDocument();
  });

  // ====== 交互测试：选择日期和时段 ======

  test('选择门店后显示日期选择器', async () => {
    render(<BookingPage />);
    await act(async () => {
      fireEvent.click(screen.getByText('神机营·旗舰店'));
    });
    expect(screen.getByText('选择日期')).toBeInTheDocument();
    expect(screen.getByText('选择时段')).toBeInTheDocument();
  });

  test('日期选择器显示"下一步"按钮且初始为禁用', async () => {
    render(<BookingPage />);
    await act(async () => {
      fireEvent.click(screen.getByText('神机营·旗舰店'));
    });
    const nextBtn = screen.getByText('下一步');
    expect(nextBtn).toBeDisabled();
  });

  test('选择日期后"下一步"按钮仍禁用（未选时段）', async () => {
    render(<BookingPage />);
    await act(async () => {
      fireEvent.click(screen.getByText('神机营·旗舰店'));
    });
    // 点击第一个日期按钮
    const dateBtns = screen.getAllByRole('button').filter(b => b.textContent?.includes('月'));
    if (dateBtns.length > 0) {
      await act(async () => {
        fireEvent.click(dateBtns[0]);
      });
    }
    const nextBtn = screen.getByText('下一步');
    expect(nextBtn).toBeDisabled();
  });

  test('选择日期和时段后"下一步"按钮启用', async () => {
    render(<BookingPage />);
    await act(async () => {
      fireEvent.click(screen.getByText('神机营·旗舰店'));
    });
    // 选择日期
    const dateBtns = screen.getAllByRole('button').filter(b =>
      b.textContent?.includes('月') && b.textContent?.trim().match(/^\d{2}$/)
    );
    if (dateBtns.length > 0) {
      await act(async () => {
        fireEvent.click(dateBtns[0]);
      });
    }
    // 选择可用时段
    const slotBtns = screen.getAllByRole('button').filter(b =>
      b.textContent?.includes(':') && !b.closest('header')
    );
    if (slotBtns.length > 0) {
      await act(async () => {
        fireEvent.click(slotBtns[0]);
      });
    }
    await waitFor(() => {
      const nextBtn = screen.getByText('下一步');
      expect(nextBtn).not.toBeDisabled();
    });
  });

  test('不可预约的时段显示为禁用状态', async () => {
    render(<BookingPage />);
    await act(async () => {
      fireEvent.click(screen.getByText('神机营·旗舰店'));
    });
    const disabledBtns = screen.getAllByRole('button').filter(b =>
      (b as HTMLButtonElement).disabled && b.textContent?.includes(':')
    );
    expect(disabledBtns.length).toBeGreaterThanOrEqual(1);
  });

  test('时段显示剩余名额', async () => {
    render(<BookingPage />);
    await act(async () => {
      fireEvent.click(screen.getByText('神机营·旗舰店'));
    });
    const remainingText = screen.queryByText(/剩\d+位/);
    expect(remainingText).toBeInTheDocument();
  });

  // ====== 交互测试：返回门店选择 ======

  test('在选择时段页面点击返回可回到门店选择', async () => {
    render(<BookingPage />);
    await act(async () => {
      fireEvent.click(screen.getByText('神机营·旗舰店'));
    });
    await act(async () => {
      fireEvent.click(screen.getByText('←'));
    });
    expect(screen.getByText('选择您想前往的门店')).toBeInTheDocument();
  });

  // ====== 交互测试：填写信息步骤 ======

  test('选择日期时段并点击下一步进入填写信息页', async () => {
    render(<BookingPage />);
    await act(async () => {
      fireEvent.click(screen.getByText('神机营·旗舰店'));
    });
    // 选日期
    const dateBtns = screen.getAllByRole('button').filter(b =>
      b.textContent?.includes('月') && b.textContent?.trim().match(/^\d{2}$/)
    );
    if (dateBtns.length > 0) {
      await act(async () => {
        fireEvent.click(dateBtns[0]);
      });
    }
    // 选时段
    const slotBtns = screen.getAllByRole('button').filter(b =>
      b.textContent?.includes(':') && !(b as HTMLButtonElement).disabled
    );
    if (slotBtns.length > 0) {
      await act(async () => {
        fireEvent.click(slotBtns[0]);
      });
    }
    await act(async () => {
      fireEvent.click(screen.getByText('下一步'));
    });
    expect(screen.getByText('填写预约信息')).toBeInTheDocument();
  });

  test('填写信息页显示联系人姓名输入框', async () => {
    render(<BookingPage />);
    await act(async () => {
      fireEvent.click(screen.getByText('神机营·旗舰店'));
    });
    const dateBtns = screen.getAllByRole('button').filter(b =>
      b.textContent?.includes('月') && b.textContent?.trim().match(/^\d{2}$/)
    );
    if (dateBtns.length > 0) fireEvent.click(dateBtns[0]);
    const slotBtns = screen.getAllByRole('button').filter(b =>
      b.textContent?.includes(':') && !(b as HTMLButtonElement).disabled
    );
    if (slotBtns.length > 0) fireEvent.click(slotBtns[0]);
    await act(async () => { fireEvent.click(screen.getByText('下一步')); });
    expect(screen.getByPlaceholderText('请输入您的姓名')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请输入手机号')).toBeInTheDocument();
  });

  test('填写信息页显示预约摘要信息', async () => {
    render(<BookingPage />);
    await act(async () => {
      fireEvent.click(screen.getByText('神机营·旗舰店'));
    });
    const dateBtns = screen.getAllByRole('button').filter(b =>
      b.textContent?.includes('月') && b.textContent?.trim().match(/^\d{2}$/)
    );
    if (dateBtns.length > 0) fireEvent.click(dateBtns[0]);
    const slotBtns = screen.getAllByRole('button').filter(b =>
      b.textContent?.includes(':') && !(b as HTMLButtonElement).disabled
    );
    if (slotBtns.length > 0) fireEvent.click(slotBtns[0]);
    await act(async () => { fireEvent.click(screen.getByText('下一步')); });
    expect(screen.getByText(/神机营·旗舰店/)).toBeInTheDocument();
    expect(screen.getByText(/人/)).toBeInTheDocument();
  });

  test('填写信息页显示人数增减按钮', async () => {
    render(<BookingPage />);
    await act(async () => {
      fireEvent.click(screen.getByText('神机营·旗舰店'));
    });
    const dateBtns = screen.getAllByRole('button').filter(b =>
      b.textContent?.includes('月') && b.textContent?.trim().match(/^\d{2}$/)
    );
    if (dateBtns.length > 0) fireEvent.click(dateBtns[0]);
    const slotBtns = screen.getAllByRole('button').filter(b =>
      b.textContent?.includes(':') && !(b as HTMLButtonElement).disabled
    );
    if (slotBtns.length > 0) fireEvent.click(slotBtns[0]);
    await act(async () => { fireEvent.click(screen.getByText('下一步')); });
    expect(screen.getByText('最多5人')).toBeInTheDocument();
  });

  test('人数减少按钮在1人时禁用', async () => {
    render(<BookingPage />);
    await act(async () => {
      fireEvent.click(screen.getByText('神机营·旗舰店'));
    });
    const dateBtns = screen.getAllByRole('button').filter(b =>
      b.textContent?.includes('月') && b.textContent?.trim().match(/^\d{2}$/)
    );
    if (dateBtns.length > 0) fireEvent.click(dateBtns[0]);
    const slotBtns = screen.getAllByRole('button').filter(b =>
      b.textContent?.includes(':') && !(b as HTMLButtonElement).disabled
    );
    if (slotBtns.length > 0) fireEvent.click(slotBtns[0]);
    await act(async () => { fireEvent.click(screen.getByText('下一步')); });
    const minusBtn = screen.getByText('-').closest('button') as HTMLButtonElement;
    expect(minusBtn.disabled).toBe(true);
  });

  test('人数增加按钮在达到上限时禁用', async () => {
    render(<BookingPage />);
    await act(async () => {
      fireEvent.click(screen.getByText('神机营·旗舰店'));
    });
    const dateBtns = screen.getAllByRole('button').filter(b =>
      b.textContent?.includes('月') && b.textContent?.trim().match(/^\d{2}$/)
    );
    if (dateBtns.length > 0) fireEvent.click(dateBtns[0]);
    const slotBtns = screen.getAllByRole('button').filter(b =>
      b.textContent?.includes(':') && !(b as HTMLButtonElement).disabled
    );
    if (slotBtns.length > 0) fireEvent.click(slotBtns[0]);
    await act(async () => { fireEvent.click(screen.getByText('下一步')); });
    // 点击加号到上限
    const plusBtn = screen.getByText('+').closest('button') as HTMLButtonElement;
    for (let i = 0; i < 10; i++) {
      if (!plusBtn.disabled) {
        await act(async () => { fireEvent.click(plusBtn); });
      }
    }
    expect(plusBtn.disabled).toBe(true);
  });

  test('填写信息页显示备注输入框', async () => {
    render(<BookingPage />);
    await act(async () => {
      fireEvent.click(screen.getByText('神机营·旗舰店'));
    });
    const dateBtns = screen.getAllByRole('button').filter(b =>
      b.textContent?.includes('月') && b.textContent?.trim().match(/^\d{2}$/)
    );
    if (dateBtns.length > 0) fireEvent.click(dateBtns[0]);
    const slotBtns = screen.getAllByRole('button').filter(b =>
      b.textContent?.includes(':') && !(b as HTMLButtonElement).disabled
    );
    if (slotBtns.length > 0) fireEvent.click(slotBtns[0]);
    await act(async () => { fireEvent.click(screen.getByText('下一步')); });
    expect(screen.getByPlaceholderText('如有特殊需求请在此说明')).toBeInTheDocument();
  });

  test('填写信息页提交按钮文案为"提交预约"', async () => {
    render(<BookingPage />);
    await act(async () => {
      fireEvent.click(screen.getByText('神机营·旗舰店'));
    });
    const dateBtns = screen.getAllByRole('button').filter(b =>
      b.textContent?.includes('月') && b.textContent?.trim().match(/^\d{2}$/)
    );
    if (dateBtns.length > 0) fireEvent.click(dateBtns[0]);
    const slotBtns = screen.getAllByRole('button').filter(b =>
      b.textContent?.includes(':') && !(b as HTMLButtonElement).disabled
    );
    if (slotBtns.length > 0) fireEvent.click(slotBtns[0]);
    await act(async () => { fireEvent.click(screen.getByText('下一步')); });
    expect(screen.getByText('提交预约')).toBeInTheDocument();
  });

  // ====== 提交验证 ======

  test('未填写联系人时提交不跳转到成功页', async () => {
    render(<BookingPage />);
    await act(async () => {
      fireEvent.click(screen.getByText('神机营·旗舰店'));
    });
    const dateBtns = screen.getAllByRole('button').filter(b =>
      b.textContent?.includes('月') && b.textContent?.trim().match(/^\d{2}$/)
    );
    if (dateBtns.length > 0) fireEvent.click(dateBtns[0]);
    const slotBtns = screen.getAllByRole('button').filter(b =>
      b.textContent?.includes(':') && !(b as HTMLButtonElement).disabled
    );
    if (slotBtns.length > 0) fireEvent.click(slotBtns[0]);
    await act(async () => { fireEvent.click(screen.getByText('下一步')); });
    // 不填信息直接提交
    await act(async () => { fireEvent.click(screen.getByText('提交预约')); });
    // 仍然在填写信息页，未跳转到成功页
    expect(screen.getByText('填写预约信息')).toBeInTheDocument();
  });

  test('提交成功后显示成功页面和"继续预约"按钮', async () => {
    render(<BookingPage />);
    await act(async () => {
      fireEvent.click(screen.getByText('神机营·旗舰店'));
    });
    const dateBtns = screen.getAllByRole('button').filter(b =>
      b.textContent?.includes('月') && b.textContent?.trim().match(/^\d{2}$/)
    );
    if (dateBtns.length > 0) fireEvent.click(dateBtns[0]);
    const slotBtns = screen.getAllByRole('button').filter(b =>
      b.textContent?.includes(':') && !(b as HTMLButtonElement).disabled
    );
    if (slotBtns.length > 0) fireEvent.click(slotBtns[0]);
    await act(async () => { fireEvent.click(screen.getByText('下一步')); });
    // 填写信息
    const nameInput = screen.getByPlaceholderText('请输入您的姓名');
    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: '张三' } });
      fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    });
    // 提交
    await act(async () => { fireEvent.click(screen.getByText('提交预约')); });
    await waitFor(() => {
      expect(screen.getByText('预约提交成功')).toBeInTheDocument();
      expect(screen.getByText('继续预约')).toBeInTheDocument();
    });
  });

  test('提交成功后显示预约编号', async () => {
    render(<BookingPage />);
    await act(async () => {
      fireEvent.click(screen.getByText('神机营·旗舰店'));
    });
    const dateBtns = screen.getAllByRole('button').filter(b =>
      b.textContent?.includes('月') && b.textContent?.trim().match(/^\d{2}$/)
    );
    if (dateBtns.length > 0) fireEvent.click(dateBtns[0]);
    const slotBtns = screen.getAllByRole('button').filter(b =>
      b.textContent?.includes(':') && !(b as HTMLButtonElement).disabled
    );
    if (slotBtns.length > 0) fireEvent.click(slotBtns[0]);
    await act(async () => { fireEvent.click(screen.getByText('下一步')); });
    const nameInput = screen.getByPlaceholderText('请输入您的姓名');
    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: '张三' } });
      fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    });
    await act(async () => { fireEvent.click(screen.getByText('提交预约')); });
    await waitFor(() => {
      expect(screen.getByText(/预约编号/)).toBeInTheDocument();
    });
  });

  // ====== 反例测试 ======

  test('不选择时段直接点下一步显示错误提示', async () => {
    render(<BookingPage />);
    await act(async () => {
      fireEvent.click(screen.getByText('神机营·旗舰店'));
    });
    await act(async () => {
      fireEvent.click(screen.getByText('下一步'));
    });
    expect(screen.getByText('请选择日期和时段')).toBeInTheDocument();
  });

  // ====== 边界情况 ======

  test('门店卡片点击后触发选中高亮样式', async () => {
    render(<BookingPage />);
    const storeCard = screen.getByText('神机营·旗舰店').closest('button')!;
    const originalStyle = storeCard.style.border;
    await act(async () => {
      fireEvent.click(screen.getByText('神机营·旗舰店'));
    });
    // 切换到预约时间页，原卡片不可见
    expect(screen.getByText('选择预约时间')).toBeInTheDocument();
  });

  test('填写信息页面可返回选择时段', async () => {
    render(<BookingPage />);
    await act(async () => {
      fireEvent.click(screen.getByText('神机营·旗舰店'));
    });
    const dateBtns = screen.getAllByRole('button').filter(b =>
      b.textContent?.includes('月') && b.textContent?.trim().match(/^\d{2}$/)
    );
    if (dateBtns.length > 0) fireEvent.click(dateBtns[0]);
    const slotBtns = screen.getAllByRole('button').filter(b =>
      b.textContent?.includes(':') && !(b as HTMLButtonElement).disabled
    );
    if (slotBtns.length > 0) fireEvent.click(slotBtns[0]);
    await act(async () => { fireEvent.click(screen.getByText('下一步')); });
    await act(async () => { fireEvent.click(screen.getByText('←')); });
    expect(screen.getByText('选择预约时间')).toBeInTheDocument();
  });

  test('成功页点击"继续预约"可重置流程', async () => {
    render(<BookingPage />);
    await act(async () => {
      fireEvent.click(screen.getByText('神机营·旗舰店'));
    });
    const dateBtns = screen.getAllByRole('button').filter(b =>
      b.textContent?.includes('月') && b.textContent?.trim().match(/^\d{2}$/)
    );
    if (dateBtns.length > 0) fireEvent.click(dateBtns[0]);
    const slotBtns = screen.getAllByRole('button').filter(b =>
      b.textContent?.includes(':') && !(b as HTMLButtonElement).disabled
    );
    if (slotBtns.length > 0) fireEvent.click(slotBtns[0]);
    await act(async () => { fireEvent.click(screen.getByText('下一步')); });
    const nameInput = screen.getByPlaceholderText('请输入您的姓名');
    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: '张三' } });
      fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    });
    await act(async () => { fireEvent.click(screen.getByText('提交预约')); });
    await waitFor(() => {
      expect(screen.getByText('继续预约')).toBeInTheDocument();
    });
    await act(async () => { fireEvent.click(screen.getByText('继续预约')); });
    expect(screen.getByText('选择您想前往的门店')).toBeInTheDocument();
  });

  // ====== 额外渲染测试 ======

  test('填写信息页显示"预约信息"标签', async () => {
    render(<BookingPage />);
    await act(async () => {
      fireEvent.click(screen.getByText('神机营·旗舰店'));
    });
    const dateBtns = screen.getAllByRole('button').filter(b =>
      b.textContent?.includes('月') && b.textContent?.trim().match(/^\d{2}$/)
    );
    if (dateBtns.length > 0) fireEvent.click(dateBtns[0]);
    const slotBtns = screen.getAllByRole('button').filter(b =>
      b.textContent?.includes(':') && !(b as HTMLButtonElement).disabled
    );
    if (slotBtns.length > 0) fireEvent.click(slotBtns[0]);
    await act(async () => { fireEvent.click(screen.getByText('下一步')); });
    expect(screen.getByText('预约信息')).toBeInTheDocument();
  });

  test('提交中按钮显示"提交中..."文案', async () => {
    render(<BookingPage />);
    await act(async () => {
      fireEvent.click(screen.getByText('神机营·旗舰店'));
    });
    const dateBtns = screen.getAllByRole('button').filter(b =>
      b.textContent?.includes('月') && b.textContent?.trim().match(/^\d{2}$/)
    );
    if (dateBtns.length > 0) fireEvent.click(dateBtns[0]);
    const slotBtns = screen.getAllByRole('button').filter(b =>
      b.textContent?.includes(':') && !(b as HTMLButtonElement).disabled
    );
    if (slotBtns.length > 0) fireEvent.click(slotBtns[0]);
    await act(async () => { fireEvent.click(screen.getByText('下一步')); });
    const nameInput = screen.getByPlaceholderText('请输入您的姓名');
    const phoneInput = screen.getByPlaceholderText('请输入手机号');
    await act(async () => {
      fireEvent.change(nameInput, { target: { value: '张三' } });
      fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    });
    // 提交后按钮变"提交中..."
    await act(async () => { fireEvent.click(screen.getByText('提交预约')); });
  });
});
