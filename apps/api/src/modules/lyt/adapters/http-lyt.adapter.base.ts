import { createHash, randomUUID } from 'node:crypto';
import type { ILytAdapter } from '../interfaces/lyt-adapter.interface';

interface HttpAdapterConfig {
  adapterName: string;
  adapterMode: ILytAdapter['adapterMode'];
  baseUrl: string;
  signingSecret: string;
  timeoutMs: number;
  maxRetries: number;
  errorCodeMap?: Record<string, string>;
}

interface JsonRequestInit extends Omit<RequestInit, 'body'> {
  body?: string;
}

export class LytAdapterHttpError extends Error {
  readonly adapterName: string;
  readonly adapterMode: ILytAdapter['adapterMode'];
  readonly path: string;
  readonly code: string;
  readonly status?: number;
  readonly requestId: string;
  readonly retryable: boolean;

  constructor(input: {
    adapterName: string;
    adapterMode: ILytAdapter['adapterMode'];
    path: string;
    code: string;
    requestId: string;
    retryable: boolean;
    status?: number;
    message: string;
    cause?: unknown;
  }) {
    super(input.message, input.cause ? { cause: input.cause } : undefined);
    this.name = 'LytAdapterHttpError';
    this.adapterName = input.adapterName;
    this.adapterMode = input.adapterMode;
    this.path = input.path;
    this.code = input.code;
    this.requestId = input.requestId;
    this.retryable = input.retryable;
    this.status = input.status;
  }
}

export abstract class HttpLytAdapterBase {
  readonly adapterName: string;
  readonly adapterMode: ILytAdapter['adapterMode'];
  private readonly baseUrl: string;
  private readonly signingSecret: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly errorCodeMap: Record<string, string>;

  protected constructor(config: HttpAdapterConfig) {
    this.adapterName = config.adapterName;
    this.adapterMode = config.adapterMode;
    this.baseUrl = config.baseUrl;
    this.signingSecret = config.signingSecret;
    this.timeoutMs = config.timeoutMs;
    this.maxRetries = config.maxRetries;
    this.errorCodeMap = config.errorCodeMap ?? {};
  }

  protected async request<T>(path: string, init?: JsonRequestInit): Promise<T> {
    const method = init?.method ?? 'GET';
    const body = init?.body;
    const requestId = randomUUID();
    let lastError: LytAdapterHttpError | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      const timestamp = new Date().toISOString();
      const signature = this.signRequest(method, path, timestamp, body);

      try {
        const response = await fetch(`${this.baseUrl}${path}`, {
          ...init,
          signal: AbortSignal.timeout(this.timeoutMs),
          headers: {
            'content-type': 'application/json',
            'x-lyt-mode': this.adapterMode,
            'x-lyt-request-id': requestId,
            'x-lyt-request-timestamp': timestamp,
            'x-lyt-signature': signature,
            'x-lyt-retry-attempt': String(attempt),
            ...(init?.headers ?? {})
          }
        });

        if (!response.ok) {
          const payload = await this.parseResponsePayload(response);
          const retryable = this.isRetryableStatus(response.status);
          lastError = new LytAdapterHttpError({
            adapterName: this.adapterName,
            adapterMode: this.adapterMode,
            path,
            code: this.extractErrorCode(payload, response.status),
            requestId,
            retryable,
            status: response.status,
            message: this.extractErrorMessage(payload, response.status)
          });

          if (retryable && attempt < this.maxRetries) {
            continue;
          }

          throw lastError;
        }

        return this.parseResponsePayload(response) as Promise<T>;
      } catch (error) {
        if (error instanceof LytAdapterHttpError) {
          throw error;
        }

        const mappedError = new LytAdapterHttpError({
          adapterName: this.adapterName,
          adapterMode: this.adapterMode,
          path,
          code: this.resolveTransportErrorCode(error),
          requestId,
          retryable: true,
          message: this.resolveTransportErrorMessage(error),
          cause: error
        });
        lastError = mappedError;

        if (attempt < this.maxRetries) {
          continue;
        }
      }
    }

    throw (
      lastError ??
      new LytAdapterHttpError({
        adapterName: this.adapterName,
        adapterMode: this.adapterMode,
        path,
        code: 'LYT_UNKNOWN',
        requestId: randomUUID(),
        retryable: false,
        message: `${this.adapterName} request exhausted without response`
      })
    );
  }

  private signRequest(method: string, path: string, timestamp: string, body?: string) {
    return createHash('sha256')
      .update([this.adapterMode, method.toUpperCase(), path, timestamp, body ?? '', this.signingSecret].join(':'))
      .digest('hex');
  }

  private isRetryableStatus(status: number) {
    return status === 408 || status === 429 || status >= 500;
  }

  private async parseResponsePayload(response: Response): Promise<unknown> {
    const text = await response.text();

    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  }

  private extractErrorCode(payload: unknown, status: number) {
    if (payload && typeof payload === 'object' && 'code' in payload && typeof payload.code === 'string') {
      return this.errorCodeMap[payload.code] ?? payload.code;
    }

    return `LYT_HTTP_${status}`;
  }

  private extractErrorMessage(payload: unknown, status: number) {
    if (payload && typeof payload === 'object') {
      if ('message' in payload && typeof payload.message === 'string') {
        return payload.message;
      }
      if ('error' in payload && typeof payload.error === 'string') {
        return payload.error;
      }
    }

    return `${this.adapterName} request failed with status ${status}`;
  }

  private resolveTransportErrorCode(error: unknown) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return 'LYT_TIMEOUT';
    }

    return 'LYT_TRANSPORT_ERROR';
  }

  private resolveTransportErrorMessage(error: unknown) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      return `${this.adapterName} request timed out`;
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return `${this.adapterName} request failed before receiving response`;
  }
}
