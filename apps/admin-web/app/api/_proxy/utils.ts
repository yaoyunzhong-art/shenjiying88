/**
 * _proxy/utils.ts — API 代理层共享工具
 *
 * 提供统一的后端 API 代理转发逻辑
 */

import { NextRequest, NextResponse } from 'next/server';

export const API_BASE_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_M5_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3001/api/v1';

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}

/**
 * 构建上游 URL（追加查询参数）
 */
function buildUpstreamUrl(base: string, request: NextRequest): string {
  const upstream = new URL(base, ensureTrailingSlash(API_BASE_URL));
  const search = request.nextUrl.searchParams.toString();
  if (search) upstream.search = search;
  return upstream.toString();
}

/**
 * 复制请求上下文头（认证、租户等）
 */
function copyContextHeaders(request: NextRequest): Headers {
  const headers = new Headers();
  const contextHeaders = [
    'authorization',
    'content-type',
    'x-tenant-id',
    'x-brand-id',
    'x-store-id',
    'x-market-code',
  ];
  for (const name of contextHeaders) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

/**
 * 创建代理处理器
 *
 * @param upstreamUrl - 上游 API URL
 * @param method - HTTP 方法
 * @param allowedParams - 允许透传的查询参数列表（可选）
 */
export function createProxyHandler(
  upstreamUrl: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  allowedParams?: string[],
) {
  return async (request: NextRequest, { params }: { params?: Promise<Record<string, string>> } = {}) => {
    const url = buildUpstreamUrl(upstreamUrl, request);
    const headers = copyContextHeaders(request);

    try {
      const upstream = await fetch(url, {
        method,
        headers,
        body: method === 'GET' ? undefined : await request.text(),
        cache: 'no-store',
      });

      const contentType = upstream.headers.get('content-type') ?? '';
      const isJson = contentType.includes('application/json');

      if (!upstream.ok) {
        if (isJson) return NextResponse.json(await upstream.json(), { status: upstream.status });
        return new NextResponse(await upstream.text(), {
          status: upstream.status,
          headers: contentType ? { 'content-type': contentType } : undefined,
        });
      }

      if (!isJson) {
        return new NextResponse(await upstream.text(), {
          status: upstream.status,
          headers: contentType ? { 'content-type': contentType } : undefined,
        });
      }

      const payload = await upstream.json();
      return NextResponse.json(payload, { status: upstream.status });
    } catch (error) {
      return NextResponse.json(
        { message: error instanceof Error ? error.message : 'proxy failed' },
        { status: 502 },
      );
    }
  };
}
