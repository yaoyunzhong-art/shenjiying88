/**
 * BookshelfClient — 书架页面客户端组件
 */
'use client';

import type { BookshelfSnapshot } from './page';

interface BookshelfClientProps {
  data: BookshelfSnapshot;
}

export default function BookshelfClient({ data }: BookshelfClientProps) {
  return (
    <div data-testid="bookshelf-client">
      <div data-testid="total-articles">{data.totalArticles}</div>
      <div data-testid="total-views">{data.totalViews}</div>
    </div>
  );
}
