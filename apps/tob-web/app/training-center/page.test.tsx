/**
 * training-center/page.test.tsx — 培训中心页面测试
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import TrainingCenterPage from './page';
import '@testing-library/jest-dom';

// Mock @m5/ui TrainingManagerDashboard
jest.mock('@m5/ui', () => {
  const original = jest.requireActual('@m5/ui');
  return {
    ...original,
    TrainingManagerDashboard: jest.fn((props: Record<string, unknown>) => (
      <div data-testid="training-dashboard">
        <div data-testid="training-dashboard-title">
          {props.brandName}
        </div>
        {props.dailyMetrics && (
          <div data-testid="metrics-loaded">
            {String(props.dailyMetrics.totalSessions)} 场
          </div>
        )}
        {props.todaySessions && (
          <div data-testid="sessions-loaded">
            共 {props.todaySessions.length} 场课程
          </div>
        )}
        {props.pendingCertifications && (
          <div data-testid="certifications-loaded">
            待认证 {props.pendingCertifications.length} 人
          </div>
        )}
        {props.trainingNeeds && (
          <div data-testid="needs-loaded">
            培训需求 {props.trainingNeeds.length} 项
          </div>
        )}
      </div>
    )),
  };
});

describe('TrainingCenterPage', () => {
  it('renders the training dashboard with brand name', () => {
    render(<TrainingCenterPage />);
    expect(screen.getByTestId('training-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('training-dashboard-title')).toHaveTextContent(
      '深竞技·朝阳旗舰店'
    );
  });

  it('passes daily metrics to the dashboard', () => {
    render(<TrainingCenterPage />);
    expect(screen.getByTestId('metrics-loaded')).toHaveTextContent('6 场');
  });

  it('passes today sessions list', () => {
    render(<TrainingCenterPage />);
    expect(screen.getByTestId('sessions-loaded')).toHaveTextContent('5 场课程');
  });

  it('passes pending certifications list', () => {
    render(<TrainingCenterPage />);
    expect(screen.getByTestId('certifications-loaded')).toHaveTextContent(
      '待认证 4 人'
    );
  });

  it('passes training needs list', () => {
    render(<TrainingCenterPage />);
    expect(screen.getByTestId('needs-loaded')).toHaveTextContent('培训需求 5 项');
  });

  it('renders without crashing', () => {
    const { container } = render(<TrainingCenterPage />);
    expect(container).toBeTruthy();
  });
});
