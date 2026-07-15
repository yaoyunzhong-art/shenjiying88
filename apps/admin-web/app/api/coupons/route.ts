// P-48 营销券系统代理层 - 优惠券列表/创建
import { NextRequest } from 'next/server';
import { API_BASE_URL, createProxyHandler } from '../../_proxy/utils';

const COUPON_API = `${API_BASE_URL}/coupons`;

// GET /api/coupons - 获取优惠券列表
export const GET = createProxyHandler(
  COUPON_API,
  'GET',
  ['tenantId', 'storeId', 'status', 'type', 'scope', 'page', 'limit', 'search']
);

// POST /api/coupons - 创建优惠券
export const POST = createProxyHandler(COUPON_API, 'POST');
