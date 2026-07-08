import type { Metadata } from 'next';
import { getReturns } from './return-data';
import { ReturnListClient } from './return-list-client';

export const metadata: Metadata = {
  title: '退换货管理 - M5 指挥台',
  description:
    '管理门店退换货申请审批与处理流程，支持仅退款、换货、维修等多种退换类型',
};

export default function ReturnsPage() {
  const returns = getReturns();
  return <ReturnListClient returns={returns} />;
}
