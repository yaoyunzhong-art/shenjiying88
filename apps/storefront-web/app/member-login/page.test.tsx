import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Page from './page';
import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/member-login',
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockLogin = jest.fn();
const mockSendSms = jest.fn();
const mockUseFormSubmit = jest.fn();

jest.mock('../../lib/member-auth-service', () => ({
  memberAuthService: {
    login: (...args: unknown[]) => mockLogin(...args),
    sendSmsCode: (...args: unknown[]) => mockSendSms(...args),
  },
}));

jest.mock('@m5/ui', () => ({
  FormField: ({ label, children, error, required, disabled }: {
    label: string; children: React.ReactNode; error?: string; required?: boolean; disabled?: boolean;
  }) => (
    <div data-testid="form-field" data-label={label} data-error={error} data-required={required}>
      <label>{label}</label>
      {children}
      {error && <span data-testid="field-error">{error}</span>}
    </div>
  ),
  useFormSubmit: (config: { onSubmit: () => Promise<unknown>; successMessage?: unknown; defaultErrorMessage?: unknown }) => {
    mockUseFormSubmit(config);
    return {
      state: { isSubmitting: false, status: 'idle', error: null },
      submit: jest.fn(),
    };
  },
  FormSubmitFeedback: ({ state }: { state: unknown }) => null,
  SubmitButton: ({ label, loading, loadingLabel }: {
    label: string; loading?: boolean; loadingLabel?: string;
  }) => (
    <button type="submit" data-testid="submit-button" disabled={loading}>
      {loading ? loadingLabel : label}
    </button>
  ),
}));

describe('MemberLoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Page />);
    expect(screen.getByText('会员登录')).toBeInTheDocument();
  });

  it('renders logo area', () => {
    render(<Page />);
    expect(screen.getByText('神机营 SaaS 会员服务')).toBeInTheDocument();
  });

  it('renders mobile input field', () => {
    render(<Page />);
    const inputs = screen.getAllByPlaceholderText('13800138000');
    expect(inputs.length).toBeGreaterThanOrEqual(1);
  });

  it('renders verification code input', () => {
    render(<Page />);
    expect(screen.getByPlaceholderText('6位验证码')).toBeInTheDocument();
  });

  it('renders send code button', () => {
    render(<Page />);
    expect(screen.getByText('获取验证码')).toBeInTheDocument();
  });

  it('renders login submit button', () => {
    render(<Page />);
    expect(screen.getByTestId('submit-button')).toBeInTheDocument();
    expect(screen.getByTestId('submit-button')).toHaveTextContent('登录');
  });

  it('renders wechat login section', () => {
    render(<Page />);
    expect(screen.getByText('微信一键登录')).toBeInTheDocument();
    expect(screen.getByText('其他登录方式')).toBeInTheDocument();
  });
});

describe('MemberLoginPage - Links & Navigation', () => {
  it('renders registration link', () => {
    render(<Page />);
    expect(screen.getByText('立即注册')).toBeInTheDocument();
    const registerLink = screen.getByText('立即注册').closest('a');
    expect(registerLink).toHaveAttribute('href', '/member-register');
  });

  it('renders footer copyright', () => {
    render(<Page />);
    expect(screen.getByText(/2024 神机营 SaaS/)).toBeInTheDocument();
  });

  it('renders form fields for mobile and code', () => {
    render(<Page />);
    const fields = screen.getAllByTestId('form-field');
    expect(fields.length).toBeGreaterThanOrEqual(2);
  });

  it('renders the wechat button with correct styling elements', () => {
    render(<Page />);
    const wechatSection = screen.getByText('微信一键登录');
    expect(wechatSection).toBeInTheDocument();
    const wechatIcon = screen.getByText('微信');
    expect(wechatIcon).toBeInTheDocument();
  });

  it('renders the gradient background', () => {
    const { container } = render(<Page />);
    const main = container.querySelector('main');
    expect(main).toHaveStyle({ background: expect.stringContaining('linear-gradient') });
  });

  it('renders logo icon with character', () => {
    render(<Page />);
    expect(screen.getByText('会')).toBeInTheDocument();
  });
});

describe('MemberLoginPage - Input Interactions', () => {
  it('allows phone number input', () => {
    render(<Page />);
    const phoneInput = screen.getAllByPlaceholderText('13800138000')[0];
    fireEvent.change(phoneInput, { target: { value: '13800138000' } });
    expect(phoneInput).toHaveValue('13800138000');
  });

  it('allows verification code input with digit-only filtering', () => {
    render(<Page />);
    const codeInput = screen.getByPlaceholderText('6位验证码');
    fireEvent.change(codeInput, { target: { value: '123abc' } });
    expect(codeInput).toHaveValue('123');
  });

  it('limits verification code to 6 digits', () => {
    render(<Page />);
    const codeInput = screen.getByPlaceholderText('6位验证码');
    fireEvent.change(codeInput, { target: { value: '1234567' } });
    expect(codeInput).toHaveValue('123456');
  });
});
