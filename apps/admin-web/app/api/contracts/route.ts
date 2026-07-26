'use server'

import { createProxyHandler } from '../_proxy/utils'

export const GET = createProxyHandler('contracts', 'GET')
export const POST = createProxyHandler('contracts', 'POST')
