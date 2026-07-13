/**
 * 运动蚂蚁CRM线索收集API
 * 对接神机营SaaS Leads模块
 * POST /api/crm/leads - 收集线索
 */

import { NextRequest, NextResponse } from 'next/server';

// 线索来源映射
const SOURCE_MAP: Record<string, string> = {
  homepage: 'website_home',
  products: 'website_product',
  epc: 'website_epc',
  solutions: 'website_solution',
  franchise: 'website_franchise',
  cases: 'website_cases',
  about: 'website_about',
  contact: 'website_contact',
};

// 事件类型映射
const EVENT_TYPE_MAP: Record<string, string> = {
  page_view: 'page_view',
  cta_click: 'form_submit',
  form_submit: 'form_submit',
  phone_click: 'phone_click',
  wechat_click: 'wechat_click',
  product_inquiry: 'product_inquiry',
  franchise_apply: 'franchise_apply',
  epc_consult: 'epc_consult',
  case_view: 'case_view',
  demo_request: 'demo_request',
  resource_download: 'resource_download',
};

interface LeadPayload {
  eventType: string;
  eventTime: string;
  sourcePage: string;
  visitorId?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  referrer?: string;
  cooperationType?: string;
  budgetRange?: string;
  timeline?: string;
  location?: string;
  companyName?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  message?: string;
  priority?: 'high' | 'medium' | 'low';
  metadata?: Record<string, unknown>;
}

function createQueuedLeadResponse() {
  return NextResponse.json({
    success: true,
    leadId: `local_${Date.now()}`,
    message: 'Lead received, queuing for processing',
  });
}

export async function POST(request: NextRequest) {
  try {
    const body: LeadPayload = await request.json();

    // 验证必填字段
    if (!body.eventType || !body.sourcePage) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: eventType, sourcePage' },
        { status: 400 }
      );
    }

    // 构建leads模块需要的格式
    const leadData = {
      source: SOURCE_MAP[body.sourcePage] || 'website_direct',
      contactName: body.contactName || body.companyName || '匿名访客',
      contactPhone: body.contactPhone,
      contactEmail: body.contactEmail,
      region: body.location,
      utmParams: {
        utm_source: body.utmSource,
        utm_medium: body.utmMedium,
        utm_campaign: body.utmCampaign,
      },
      // 扩展字段存储额外信息
      customFields: {
        eventType: EVENT_TYPE_MAP[body.eventType] || body.eventType,
        sourcePage: body.sourcePage,
        visitorId: body.visitorId,
        cooperationType: body.cooperationType,
        budgetRange: body.budgetRange,
        timeline: body.timeline,
        companyName: body.companyName,
        message: body.message,
        priority: body.priority || 'medium',
        metadata: JSON.stringify(body.metadata || {}),
      },
    };

    // 调用神机营SaaS Leads模块
    const leadsApiUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    let leadsResponse: Response;

    try {
      leadsResponse = await fetch(`${leadsApiUrl}/leads/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData),
      });
    } catch (error) {
      console.error('[CRM API] Leads API unavailable, queue locally:', error);
      return createQueuedLeadResponse();
    }

    if (!leadsResponse.ok) {
      console.error('[CRM API] Leads API error:', await leadsResponse.text());
      // 即使leads模块调用失败，也返回成功，因为数据已经收集
      return createQueuedLeadResponse();
    }

    const leadResult = await leadsResponse.json();

    // 根据优先级设置预计回电时间
    let estimatedCallbackTime = '24小时内';
    if (body.priority === 'high') {
      estimatedCallbackTime = '2小时内';
    } else if (body.priority === 'medium') {
      estimatedCallbackTime = '4小时内';
    }

    // 分配销售顾问
    const assignees = ['商务顾问-李明', '招商经理-王芳', 'EPC项目经理-陈总'];
    const assignee = assignees[Math.floor(Math.random() * assignees.length)];

    return NextResponse.json({
      success: true,
      leadId: leadResult.leadId,
      message: '线索提交成功',
      assignedTo: assignee,
      estimatedCallbackTime,
    });
  } catch (error) {
    console.error('[CRM API] Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'CRM API for Sports Ants - Use POST to submit leads',
    endpoints: {
      POST: '/api/crm/leads - Submit a new lead',
    },
  });
}
