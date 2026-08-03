import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { LytMemberProfile, LytOrderPayload, LytOrderResult } from '@m5/domain';
import type {
  ILytAdapter,
  LytCallbackEvent,
  LytConnectionStatus,
  LytDecryptRequest,
  LytDecryptResult,
  LytDeviceInfo,
  LytErrorInfo,
  LytMemberInfo,
  LytOperationRequest,
  LytOperationResult,
  LytOrderInfo,
  LytPollTask,
  LytQueryRequest,
  LytQueryResult,
  LytSignResult,
  LytTimeoutDowngradeConfig,
  LytValidationResult,
  LytVenue,
} from '../interfaces/lyt-adapter.interface';
import {
  LYT_VENDOR_ERROR_CODE_MAP,
  toDeviceStatusFromVendor,
  toDiscountResultFromVendor,
  toGateEventResultFromVendor,
  toLytMemberProfileFromVendor,
  toLytOrderResultFromVendor,
  toVendorCreateOrderPayload,
  toVendorDiscountApplyPayload,
  toVendorGateEventRequestPayload,
} from '../vendor-lyt.contract';
import { resolveLytHttpAdapterConfig } from '../lyt-adapter.config';
import { HttpLytAdapterBase, LytAdapterHttpError } from './http-lyt.adapter.base';

/**
 * 尚未实现（NotImplemented）错误
 *
 * 当某个方法需要真实 LYT 接口文档才能实现时抛此错误。
 * blocker_id: BLK-LYT-001
 * blocked by missing LYT api spec
 */
export class LytNotImplementedError extends Error {
  readonly blockerId = 'BLK-LYT-001';
  readonly methodName: string;
  readonly adapterName: string;

  constructor(methodName: string, adapterName: string) {
    super(
      `${adapterName}.${methodName} is blocked — requires LYT real API spec. ` +
      `blocker_id: BLK-LYT-001 | blocked by missing LYT api spec`
    );
    this.name = 'LytNotImplementedError';
    this.methodName = methodName;
    this.adapterName = adapterName;
  }
}

@Injectable()
export class RealLytAdapter extends HttpLytAdapterBase implements ILytAdapter {
  constructor(configService: ConfigService) {
    const config = resolveLytHttpAdapterConfig('real', configService);
    super({
      adapterName: 'RealLytAdapter',
      adapterMode: 'real',
      baseUrl: config.baseUrl,
      signingSecret: config.signingSecret,
      timeoutMs: config.timeoutMs,
      maxRetries: config.maxRetries,
      errorCodeMap: LYT_VENDOR_ERROR_CODE_MAP,
    });
  }

  // ═══════════════════════════════════════════════
  // 已实现方法（基于 HTTP Adapter Base + Vendor Contract）
  // ═══════════════════════════════════════════════

  async getMember(memberId: string): Promise<LytMemberProfile> {
    const payload = await this.request<Parameters<typeof toLytMemberProfileFromVendor>[0]>(`/members/${memberId}`);
    return toLytMemberProfileFromVendor(payload);
  }

  async createOrder(payload: LytOrderPayload): Promise<LytOrderResult> {
    const result = await this.request<Parameters<typeof toLytOrderResultFromVendor>[0]>('/orders', {
      method: 'POST',
      body: JSON.stringify(toVendorCreateOrderPayload(payload)),
    });
    return toLytOrderResultFromVendor(result);
  }

  async applyDiscount(orderId: string, couponCode: string): Promise<{ orderId: string; couponCode: string }> {
    const result = await this.request<Parameters<typeof toDiscountResultFromVendor>[0]>(`/orders/${orderId}/discounts`, {
      method: 'POST',
      body: JSON.stringify(toVendorDiscountApplyPayload(couponCode)),
    });
    return toDiscountResultFromVendor(result);
  }

  async syncGateEvent(storeId: string, passCode: string): Promise<{ accepted: boolean; storeId: string }> {
    const result = await this.request<Parameters<typeof toGateEventResultFromVendor>[0]>(`/stores/${storeId}/gate-events`, {
      method: 'POST',
      body: JSON.stringify(toVendorGateEventRequestPayload(passCode)),
    });
    return toGateEventResultFromVendor(result);
  }

  async getDeviceStatus(deviceId: string): Promise<{ deviceId: string; status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE' | 'ERROR' }> {
    const payload = await this.request<Parameters<typeof toDeviceStatusFromVendor>[0]>(`/devices/${deviceId}/status`);
    return toDeviceStatusFromVendor(payload);
  }

  async updateMember(payload: {
    memberId: string;
    tier?: string;
    [k: string]: unknown;
  }): Promise<{ status: 'UPDATED' | 'NOOP'; memberId: string }> {
    const result = await this.request<Record<string, unknown>>(`/members/${payload.memberId}`, {
      method: 'PATCH',
      body: JSON.stringify({ tier: payload.tier }),
    });
    return { status: 'UPDATED' as const, memberId: payload.memberId };
  }

  // ═══════════════════════════════════════════════
  // 阻塞方法（需真实 LYT API 规范）
  // ═══════════════════════════════════════════════
  // blocker_id: BLK-LYT-001
  // blocked by missing LYT api spec
  // ═══════════════════════════════════════════════

  async connect(_endpoint: string, _credentials: Record<string, unknown>): Promise<{
    sessionId: string;
    status: LytConnectionStatus;
    connectedAt: string;
    metadata?: Record<string, unknown>;
  }> {
    throw new LytNotImplementedError('connect', this.adapterName);
  }

  async disconnect(_sessionId: string): Promise<{
    success: boolean;
    sessionId: string;
    disconnectedAt: string;
  }> {
    throw new LytNotImplementedError('disconnect', this.adapterName);
  }

  async getConnectionStatus(_sessionId?: string): Promise<{
    status: LytConnectionStatus;
    sessionId?: string;
    connectedAt?: string;
    lastActivityAt?: string;
  }> {
    throw new LytNotImplementedError('getConnectionStatus', this.adapterName);
  }

  async query(_request: LytQueryRequest): Promise<LytQueryResult<Record<string, unknown>>> {
    throw new LytNotImplementedError('query', this.adapterName);
  }

  async operate(_request: LytOperationRequest): Promise<LytOperationResult> {
    throw new LytNotImplementedError('operate', this.adapterName);
  }

  async validate(_entityType: string, _data: Record<string, unknown>): Promise<LytValidationResult> {
    throw new LytNotImplementedError('validate', this.adapterName);
  }

  async getVenues(_storeId?: string): Promise<LytVenue[]> {
    throw new LytNotImplementedError('getVenues', this.adapterName);
  }

  async getDevices(_venueId?: string): Promise<LytDeviceInfo[]> {
    throw new LytNotImplementedError('getDevices', this.adapterName);
  }

  async getMemberInfo(_memberId: string): Promise<LytMemberInfo> {
    throw new LytNotImplementedError('getMemberInfo', this.adapterName);
  }

  async getOrderInfo(_orderId: string): Promise<LytOrderInfo> {
    throw new LytNotImplementedError('getOrderInfo', this.adapterName);
  }

  async sign(_method: string, _path: string, _body?: string, _timestamp?: string): Promise<LytSignResult> {
    throw new LytNotImplementedError('sign', this.adapterName);
  }

  async verifySignature(_signature: string, _payload: string, _timestamp: string): Promise<boolean> {
    throw new LytNotImplementedError('verifySignature', this.adapterName);
  }

  async decrypt(_request: LytDecryptRequest): Promise<LytDecryptResult> {
    throw new LytNotImplementedError('decrypt', this.adapterName);
  }

  async startPoll(_taskType: LytPollTask['taskType'], _entityId: string, _params?: Record<string, unknown>): Promise<LytPollTask> {
    throw new LytNotImplementedError('startPoll', this.adapterName);
  }

  async getPollStatus(_taskId: string): Promise<LytPollTask> {
    throw new LytNotImplementedError('getPollStatus', this.adapterName);
  }

  async cancelPoll(_taskId: string): Promise<{ success: boolean; taskId: string }> {
    throw new LytNotImplementedError('cancelPoll', this.adapterName);
  }

  async handleCallback(_event: LytCallbackEvent): Promise<{
    accepted: boolean;
    eventId: string;
    processedBy: string;
  }> {
    throw new LytNotImplementedError('handleCallback', this.adapterName);
  }

  // ═══════════════════════════════════════════════
  // 可实现的：错误包装与降级配置
  // ═══════════════════════════════════════════════

  wrapError(error: unknown, context?: { path?: string; requestId?: string }): LytErrorInfo {
    const requestId = context?.requestId ?? 'unknown';
    const path = context?.path ?? 'unknown';

    if (error instanceof LytAdapterHttpError) {
      return {
        code: error.code,
        category: this.resolveErrorCategory(error),
        message: error.message,
        retryable: error.retryable,
        statusCode: error.status,
        adapterName: error.adapterName,
        requestId: error.requestId,
        cause: error.cause instanceof Error ? error.cause : undefined,
      };
    }

    if (error instanceof Error) {
      if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        return {
          code: 'LYT_TIMEOUT',
          category: 'network',
          message: `${this.adapterName} request timed out on path ${path}`,
          retryable: true,
          adapterName: this.adapterName,
          requestId,
          cause: error,
        };
      }
      return {
        code: 'LYT_UNKNOWN',
        category: 'unknown',
        message: error.message,
        retryable: false,
        adapterName: this.adapterName,
        requestId,
        cause: error,
      };
    }

    return {
      code: 'LYT_UNKNOWN',
      category: 'unknown',
      message: String(error),
      retryable: false,
      adapterName: this.adapterName,
      requestId,
    };
  }

  isRetryable(error: LytErrorInfo): boolean {
    return error.retryable;
  }

  getTimeoutDowngradeConfig(): LytTimeoutDowngradeConfig {
    return {
      connectTimeoutMs: 5000,
      readTimeoutMs: 10000,
      useCacheOnTimeout: true,
      cacheTtlMs: 30000,
      useFallbackOnTimeout: true,
      downgradeLogLevel: 'warn',
    };
  }

  // ═══════════════════════════════════════════════
  // 私有辅助
  // ═══════════════════════════════════════════════

  private resolveErrorCategory(error: LytAdapterHttpError): LytErrorInfo['category'] {
    if (error.retryable && (error.status === 408 || error.status === 429 || error.status === 0)) {
      return 'network';
    }
    if (error.status && error.status >= 400 && error.status < 500) {
      return 'business';
    }
    if (error.status && error.status >= 500) {
      return 'protocol';
    }
    return 'unknown';
  }
}
