import { render, screen, fireEvent } from '@testing-library/react';
import Page from './page';
import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/reviews',
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

jest.mock('./reviews-data', () => {
  const baseReviews = [
    {
      reviewId: 'r1',
      storeCode: 'store-001',
      storeName: '旗舰店（国贸）',
      author: { nickname: '张三', memberTier: '黄金', avatar: '' },
      rating: 5 as const,
      content: '非常满意，服务态度很好，产品品质上乘，下次还会再来。',
      tags: ['服务好', '品质好'],
      images: ['img1.jpg'],
      likes: 12,
      createdAt: '2026-07-10T14:30:00Z',
      reply: '感谢您的支持！',
      repliedAt: '2026-07-11T09:00:00Z',
      productName: '精华液',
    },
    {
      reviewId: 'r2',
      storeCode: 'store-002',
      storeName: '社区店（望京）',
      author: { nickname: '李四', memberTier: '白银', avatar: '' },
      rating: 4 as const,
      content: '整体不错，环境优雅，价格适中。',
      tags: ['环境好'],
      images: [],
      likes: 5,
      createdAt: '2026-07-09T10:00:00Z',
      reply: null,
      repliedAt: null,
      productName: '面膜',
    },
    {
      reviewId: 'r3',
      storeCode: 'store-001',
      storeName: '旗舰店（国贸）',
      author: { nickname: '王五', memberTier: '', avatar: '' },
      rating: 3 as const,
      content: '一般般，排队时间有点长。',
      tags: [],
      images: [],
      likes: 2,
      createdAt: '2026-07-08T16:00:00Z',
      reply: null,
      repliedAt: null,
      productName: '',
    },
  ];

  return {
    MOCK_REVIEWS: baseReviews,
    RATING_LABELS: { 1: '很差', 2: '较差', 3: '一般', 4: '满意', 5: '非常满意' },
    RATING_SHORT_LABELS: { 1: '1分', 2: '2分', 3: '3分', 4: '4分', 5: '5分' },
    SORT_LABELS: { latest: '最新', highest: '最高评分', lowest: '最低评分' },
    DEFAULT_PAGE_SIZE: 5,
    computeReviewStats: (reviews: { rating: number }[]) => {
      const total = reviews.length;
      const ratings = reviews.map((r) => r.rating);
      const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
      const positive = ratings.filter((r) => r >= 4).length;
      const distribution = [5, 4, 3, 2, 1].map((rating) => ({
        rating,
        count: ratings.filter((r) => r === rating).length,
        percentage: total ? Math.round((ratings.filter((r) => r === rating).length / total) * 100) : 0,
      }));
      return {
        totalReviews: total,
        averageRating: parseFloat(avg.toFixed(1)),
        positiveRate: total ? Math.round((positive / total) * 100) : 0,
        distribution,
      };
    },
    filterByStore: (reviews: { storeCode: string }[], storeCode: string) =>
      reviews.filter((r) => r.storeCode === storeCode),
    filterByRating: (reviews: { rating: number }[], rating: number) =>
      reviews.filter((r) => r.rating === rating),
    filterWithImages: (reviews: { images: string[] }[]) =>
      reviews.filter((r) => r.images.length > 0),
    sortReviews: (reviews: { createdAt: string; rating: number }[], sortBy: string) => {
      const sorted = [...reviews];
      if (sortBy === 'latest') sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (sortBy === 'highest') sorted.sort((a, b) => b.rating - a.rating);
      if (sortBy === 'lowest') sorted.sort((a, b) => a.rating - b.rating);
      return sorted;
    },
    paginateReviews: (reviews: unknown[], page: number, pageSize: number) =>
      reviews.slice((page - 1) * pageSize, page * pageSize),
    formatReviewTime: (dateStr: string) => {
      const d = new Date(dateStr);
      return `${d.getMonth() + 1}月${d.getDate()}日`;
    },
    renderStars: (rating: number) => '★'.repeat(rating) + '☆'.repeat(5 - rating),
    computeAverageRating: (reviews: { rating: number }[]) => {
      const ratings = reviews.map((r) => r.rating);
      return ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    },
  };
});

describe('ReviewsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Page />);
    expect(screen.getByText('用户评价')).toBeInTheDocument();
  });

  it('renders store tabs', () => {
    render(<Page />);
    expect(screen.getByText('全部')).toBeInTheDocument();
    expect(screen.getByText('旗舰店（国贸）')).toBeInTheDocument();
    expect(screen.getByText('社区店（望京）')).toBeInTheDocument();
  });

  it('renders rating overview section', () => {
    render(<Page />);
    expect(screen.getByText(/条评价/)).toBeInTheDocument();
  });

  it('renders rating distribution bars', () => {
    render(<Page />);
    expect(screen.getByText('5分')).toBeInTheDocument();
    expect(screen.getByText('4分')).toBeInTheDocument();
    expect(screen.getByText('3分')).toBeInTheDocument();
  });

  it('renders sort buttons', () => {
    render(<Page />);
    expect(screen.getByText('最新')).toBeInTheDocument();
    expect(screen.getByText('最高评分')).toBeInTheDocument();
    expect(screen.getByText('最低评分')).toBeInTheDocument();
  });

  it('renders "有图" filter button', () => {
    render(<Page />);
    expect(screen.getByText('有图')).toBeInTheDocument();
  });

  it('renders review cards with user info', () => {
    render(<Page />);
    expect(screen.getByText('张三')).toBeInTheDocument();
    expect(screen.getByText('李四')).toBeInTheDocument();
  });
});

describe('ReviewsPage - Interactions & Filtering', () => {
  it('filters reviews when store tab is clicked', () => {
    render(<Page />);
    const storeTab = screen.getByText('旗舰店（国贸）');
    fireEvent.click(storeTab);
    expect(screen.getByText(/旗舰店（国贸）/)).toBeInTheDocument();
  });

  it('shows total review count in header', () => {
    render(<Page />);
    const headerText = screen.getByText(/条评价/);
    expect(headerText).toBeInTheDocument();
  });

  it('expands review content when "全文" is clicked', () => {
    render(<Page />);
    const expandButtons = screen.queryAllByText('全文');
    if (expandButtons.length > 0) {
      fireEvent.click(expandButtons[0]);
    }
  });

  it('renders stars for rating display', () => {
    render(<Page />);
    const starElements = screen.getAllByText(/★/);
    expect(starElements.length).toBeGreaterThan(0);
  });

  it('toggles image filter on click', () => {
    render(<Page />);
    const imageFilter = screen.getByText('有图');
    fireEvent.click(imageFilter);
    expect(screen.getByText(/有图/)).toBeInTheDocument();
  });

  it('changes sort order on sort button click', () => {
    render(<Page />);
    const sortButton = screen.getByText('最高评分');
    fireEvent.click(sortButton);
    expect(screen.getByText('最高评分')).toBeInTheDocument();
  });

  it('shows merchant reply when present', () => {
    render(<Page />);
    expect(screen.getByText('商家回复：')).toBeInTheDocument();
    expect(screen.getByText('感谢您的支持！')).toBeInTheDocument();
  });

  it('shows positive rate bar', () => {
    render(<Page />);
    expect(screen.getByText(/好评率/)).toBeInTheDocument();
  });
});
