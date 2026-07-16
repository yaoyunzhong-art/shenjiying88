// P-48 营销券系统代理层 - 优惠券分发
import { NextRequest } from 'next/server';
import { API_BASE_URL, createProxyHandler } from '../../../_proxy/utils';

const getDistributeApi = (id: string) => `${API_BASE_URL}/coupons/${id}/distribute`;

// POST /api/coupons/:id/distribute - 分发优惠券
export const POST = async (req: NextRequest, { params }: { params: { id: string } }) => {
  const handler = createProxyHandler(getDistributeApi(params.id), 'POST');
  return handler(req);
};
