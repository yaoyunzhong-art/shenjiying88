import { Injectable } from '@nestjs/common';
import { MockLytAdapter } from './adapters/mock-lyt.adapter';
import { RealLytAdapter } from './adapters/real-lyt.adapter';
import { SandboxLytAdapter } from './adapters/sandbox-lyt.adapter';
import type { ILytAdapter } from './interfaces/lyt-adapter.interface';
import type { LytResolvedConnection } from './lyt.entity';

export interface LytAdapterSelection {
  adapterName: string;
  adapterMode: 'mock' | 'sandbox' | 'real';
  reason: string;
}

@Injectable()
export class LytAdapterRegistry {
  constructor(
    private readonly mockAdapter: MockLytAdapter,
    private readonly sandboxAdapter: SandboxLytAdapter,
    private readonly realAdapter: RealLytAdapter
  ) {}

  listAvailableAdapters(): Array<{ adapterName: string; adapterMode: 'mock' | 'sandbox' | 'real' }> {
    return [this.mockAdapter, this.sandboxAdapter, this.realAdapter].map((adapter) => ({
      adapterName: adapter.adapterName,
      adapterMode: adapter.adapterMode
    }));
  }

  resolveAdapterSelection(connection: LytResolvedConnection): LytAdapterSelection {
    if (
      connection.source === 'fallback' ||
      connection.authMode === 'mock-token' ||
      connection.endpoint.startsWith('mock://')
    ) {
      return {
        adapterName: this.mockAdapter.adapterName,
        adapterMode: this.mockAdapter.adapterMode,
        reason: 'connection uses mock endpoint or fallback configuration'
      };
    }

    if (
      connection.authMode.includes('sandbox') ||
      connection.endpoint.includes('sandbox') ||
      connection.endpoint.includes('staging')
    ) {
      return {
        adapterName: this.sandboxAdapter.adapterName,
        adapterMode: this.sandboxAdapter.adapterMode,
        reason: 'connection is marked as sandbox/staging for rehearsal'
      };
    }

    return {
      adapterName: this.realAdapter.adapterName,
      adapterMode: this.realAdapter.adapterMode,
      reason: 'connection points to non-mock production-style endpoint'
    };
  }

  getAdapterForConnection(connection: LytResolvedConnection): ILytAdapter {
    const selection = this.resolveAdapterSelection(connection);

    switch (selection.adapterMode) {
      case 'sandbox':
        return this.sandboxAdapter;
      case 'real':
        return this.realAdapter;
      case 'mock':
      default:
        return this.mockAdapter;
    }
  }

  getDefaultAdapter(): ILytAdapter {
    return this.mockAdapter;
  }
}
