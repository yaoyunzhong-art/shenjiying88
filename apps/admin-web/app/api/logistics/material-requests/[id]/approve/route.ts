import { proxyLogisticsRequest } from '../../../proxy'

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params
  return proxyLogisticsRequest(request, `logistics/material-requests/${id}/approve`, 'POST')
}
