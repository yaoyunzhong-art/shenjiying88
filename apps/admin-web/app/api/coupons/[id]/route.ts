// P-48 营销券系统代理层 - 优惠券详情/更新/删除
import { API_BASE_URL, createProxyHandler } from '../../../_proxy/utils';

const getCouponApi = (id: string) => `${API_BASE_URL}/coupons/${id}`;

// GET /api/coupons/:id - 获取优惠券详情
export const GET = async (req: Request, { params }: { params: { id: string } }) => {
  const handler = createProxyHandler(getCouponApi(params.id), 'GET');
  return handler(req);
};

// PATCH /api/coupons/:id - 更新优惠券
export const PATCH = async (req: Request, { params }: { params: { id: string } }) => {
  const handler = createProxyHandler(getCouponApi(params.id), 'PATCH');
  return handler(req);
};

// DELETE /api/coupons/:id - 删除优惠券
export const DELETE = async (req: Request, { params }: { params: { id: string } }) => {
  const handler = createProxyHandler(getCouponApi(params.id), 'DELETE');
  return handler(req);
};
