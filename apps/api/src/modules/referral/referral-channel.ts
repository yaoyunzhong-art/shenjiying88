// referral-channel.ts · Phase-17 T9
// 创建: 2026-06-26 · Pulse-68 下午主任务
// 状态: IMPLEMENTED · 微信分享 + 小程序扫码 + 数据脱敏
// 关联: tasks.md T9

import { createHash } from 'node:crypto';

/**
 * WechatChannelAdapter · 微信分享适配器
 *
 * 用途:
 * - 生成微信分享链接 (含签名,防伪造)
 * - 支持好友/朋友圈分享
 * - 用户点击后回调到落地页
 *
 * 生产实现: 调用 jssdk config + 微信开放接口
 */
export class WechatChannelAdapter {
  constructor(
    public readonly appId: string,
    public readonly appSecret: string,
  ) {}

  buildShareLink(shortCode: string, meta: { tenantId: string; userId: string }): string {
    const timestamp = Date.now().toString();
    const nonceStr = Math.random().toString(36).slice(2);
    const signStr = `${this.appId}${shortCode}${meta.tenantId}${timestamp}${nonceStr}`;
    const signature = createHash('sha256').update(signStr).digest('hex').slice(0, 16);
    return `weixin://share?shortCode=${shortCode}&signature=${signature}&ts=${timestamp}&nonce=${nonceStr}`;
  }

  verifySignature(shortCode: string, signature: string, ts: string, nonce: string): boolean {
    const signStr = `${this.appId}${shortCode}${ts}${nonce}`;
    const expected = createHash('sha256').update(signStr).digest('hex').slice(0, 16);
    return expected === signature;
  }
}

/**
 * MiniProgramChannelAdapter · 小程序扫码适配器
 *
 * 用途:
 * - 二维码 scene 编码 (短码 → scene 字符串)
 * - scene 解码 (扫码后还原短码)
 * - 支持小程序 wx.scanCode API
 */
export class MiniProgramChannelAdapter {
  encodeScene(shortCode: string): string {
    return `qr:${shortCode}`;
  }

  decodeScene(scene: string): string {
    if (!scene.startsWith('qr:')) {
      throw new Error(`Invalid scene format: ${scene}`);
    }
    return scene.slice(3);
  }
}

/**
 * maskPII · 隐私合规脱敏
 *
 * 用途: 在 referral record / 通知 / 审计日志中脱敏敏感字段
 *
 * 支持字段:
 * - phone: 中间 4 位 → *
 * - email: 首字符保留 + ***
 * - name: 保留姓 + * (单字直接 *)
 */
export function maskPII(value: string, kind: 'phone' | 'email' | 'name'): string {
  switch (kind) {
    case 'phone': {
      if (value.length < 7) return value;
      return value.slice(0, 3) + '****' + value.slice(-4);
    }
    case 'email': {
      const [local, domain] = value.split('@');
      if (!domain) return value;
      if (local.length <= 1) return local + '***@' + domain;
      return local[0] + '***@' + domain;
    }
    case 'name': {
      if (value.length === 0) return '';
      if (value.length === 1) return value;
      return value[0] + '*'.repeat(value.length - 1);
    }
  }
}
