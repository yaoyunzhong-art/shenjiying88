import type { Metadata } from 'next';
import { getRefunds } from './refund-data';
import { RefundListClient } from './refund-list-client';

export const metadata: Metadata = {
  title: '退款管理 - M5 指挥台',
  description:
    '管理门店退换货申请审批与处理流程，支持仅退款、换货、退货退款等多种类型',
};

export default function RefundsPage() {
  const refunds = getRefunds();
  return <RefundListClient refunds={refunds} />;
}
