import { proxyLogisticsRequest } from '../proxy'

export async function GET(request: Request) {
  return proxyLogisticsRequest(request, 'logistics/material-requests', 'GET')
}

export async function POST(request: Request) {
  return proxyLogisticsRequest(request, 'logistics/material-requests', 'POST')
}
