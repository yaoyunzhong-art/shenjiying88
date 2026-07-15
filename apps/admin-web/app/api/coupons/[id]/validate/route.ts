// P-48 营销券系统代理层 - 优惠券验证
import { API_BASE_URL, createProxyHandler } from '../../../../_proxy/utils';

const getValidateApi = (id: string) => `${API_BASE_URL}/coupons/${id}/validate`;

// POST /api/coupons/:id/validate - 验证优惠券
export const POST = async (req: Request, { params }: { params: { id: string } }) => {
  const handler = createProxyHandler(getValidateApi(params.id), 'POST');
  return handler(req);
};
