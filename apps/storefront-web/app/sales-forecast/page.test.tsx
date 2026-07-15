import { render, screen } from '@testing-library/react';
import Page from './page';
import '@testing-library/jest-dom';

jest.mock('@m5/ui', () => ({
  SalesForecastPanel: ({ title, description, confidence, showChart }: {
    title: string; description: string; confidence: number; showChart: boolean;
  }) => (
    <div data-testid="sales-forecast-panel">
      <div data-testid="panel-title">{title}</div>
      <div data-testid="panel-desc">{description}</div>
      <div data-testid="panel-confidence">{confidence}%</div>
    </div>
  ),
}));

describe('SalesForecastPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Page />);
    expect(screen.getByText('📈 销售预测')).toBeInTheDocument();
  });

  it('renders page title', () => {
    render(<Page />);
    expect(screen.getByText('📈 销售预测')).toBeInTheDocument();
  });

  it('renders subtitle with AI description', () => {
    render(<Page />);
    expect(screen.getByText(/AI 驱动的门店销售趋势分析与预测/)).toBeInTheDocument();
  });

  it('renders the sales forecast panel', () => {
    render(<Page />);
    expect(screen.getByTestId('sales-forecast-panel')).toBeInTheDocument();
  });

  it('renders panel with correct title', () => {
    render(<Page />);
    const panelTitle = screen.getByTestId('panel-title');
    expect(panelTitle).toHaveTextContent('Shenjiying 旗舰店');
    expect(panelTitle).toHaveTextContent('7 日销售预测');
  });

  it('renders panel description', () => {
    render(<Page />);
    const panelDesc = screen.getByTestId('panel-desc');
    expect(panelDesc).toHaveTextContent(/历史交易/);
  });

  it('renders confidence value', () => {
    render(<Page />);
    expect(screen.getByTestId('panel-confidence')).toHaveTextContent('88%');
  });

  it('renders forecast stats metrics', () => {
    render(<Page />);
    expect(screen.getByText('明日预测')).toBeInTheDocument();
    expect(screen.getByText('周同比')).toBeInTheDocument();
    expect(screen.getByText('预测置信度')).toBeInTheDocument();
    expect(screen.getByText('库存建议')).toBeInTheDocument();
  });
});

describe('SalesForecastPage - Metrics & Footer', () => {
  it('renders forecast values', () => {
    render(<Page />);
    expect(screen.getByText(/¥52,380/)).toBeInTheDocument();
  });

  it('renders stock suggestion', () => {
    render(<Page />);
    expect(screen.getByText(/补货 3,200 件/)).toBeInTheDocument();
  });

  it('renders footer disclaimer', () => {
    render(<Page />);
    expect(screen.getByText(/预测数据仅供决策参考/)).toBeInTheDocument();
  });

  it('renders last updated timestamp', () => {
    render(<Page />);
    expect(screen.getByText(/最后更新/)).toBeInTheDocument();
  });

  it('renders subtitle with store info', () => {
    render(<Page />);
    const subtitle = screen.getByText(/AI 驱动的门店销售趋势分析与预测/);
    expect(subtitle).toBeInTheDocument();
  });
});
