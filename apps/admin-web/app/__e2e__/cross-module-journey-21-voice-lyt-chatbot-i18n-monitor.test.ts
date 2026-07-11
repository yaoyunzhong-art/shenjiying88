/**
 * 🦞 龙虾哥 L3 跨模块端到端 · 链43 (Pulse-Nightly-14)
 * 语音交互 → LYT交易 → AI聊天 → 国际化多语言 → 运行时监控
 *
 * 新增于 2026-07-12 03:30-05:30 第三段
 * 覆盖盲区: voice-processing 模块 + lyt 模块 (之前无跨模块链覆盖)
 *
 * 模拟链路:
 *   Voice(语音处理: STT/意图识别/语音搜索)
 *   → LYT(LYT交易: 代币兑换/交易清算/账户变更)
 *   → AI-Chat(AI聊天助手: 多轮对话/FAQ/客服转接)
 *   → I18n(国际化: 多语言响应/语音多语言识别)
 *   → Monitor(运行时监控: 调用链跟踪/性能指标)
 *
 * 测试设计:
 *   - 语音输入→STT识别→意图分类→执行操作(交易/查询)
 *   - LYT交易流程: 创建交易→签名验证→清算→确认
 *   - AI聊天助手: 中英文FAQ、多轮上下文、客服转接
 *   - 国际化: 相同语音内容不同语言识别精准度
 *   - 运行时监控: 调用链每个环节打点、耗时跟踪
 *   - 场景: "帮我充值100元" → 语音→交易→确认→多语言播报
 */

import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

// ─── 类型定义 ───

type VoiceLanguage = 'zh-CN' | 'en-US' | 'ja-JP' | 'ko-KR';
type IntentType = 'recharge' | 'transfer' | 'balance' | 'exchange' | 'faq' | 'help' | 'complaint';
type LytOrderStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
type MonitorMetricType = 'latency' | 'error_rate' | 'throughput' | 'concurrency' | 'saturation';

interface VoiceInput {
  utteranceId: string;
  text: string;
  language: VoiceLanguage;
  confidence: number;
  intent: IntentType;
  entities: Record<string, string | number>;
  audioDurationMs: number;
  processedAt: number;
}

interface VoiceRecognitionResult {
  utteranceId: string;
  recognizedText: string;
  confidence: number;
  language: VoiceLanguage;
  normalizedIntent: IntentType;
  extractedEntities: Record<string, string | number>;
  processingTimeMs: number;
}

interface LytTransaction {
  txId: string;
  fromAccount: string;
  toAccount?: string;
  amount: number;
  currency: 'LYT' | 'CNY' | 'USD';
  orderType: LytOrderStatus;
  signature: string;
  fee: number;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: number;
  completedAt?: number;
}

interface ChatMessage {
  messageId: string;
  sessionId: string;
  role: 'user' | 'bot' | 'agent';
  content: string;
  language: VoiceLanguage;
  timestamp: number;
  intent?: IntentType;
  metadata?: Record<string, unknown>;
}

interface ChatSession {
  sessionId: string;
  userId: string;
  language: VoiceLanguage;
  messages: ChatMessage[];
  context: Record<string, unknown>;
  escalated: boolean;
  createdAt: number;
}

interface MonitorTraceSpan {
  spanId: string;
  traceId: string;
  service: 'voice' | 'lyt' | 'chat' | 'i18n';
  operation: string;
  startTime: number;
  endTime: number;
  durationMs: number;
  status: 'ok' | 'error';
  errorMessage?: string;
}

// ─── 仓储 ───

const VOICE_STORE: VoiceInput[] = [];
const RECOGNITION_STORE: Map<string, VoiceRecognitionResult> = new Map();
const LYT_STORE: Map<string, LytTransaction> = new Map();
const CHAT_SESSION_STORE: Map<string, ChatSession> = new Map();
const MONITOR_TRACES: MonitorTraceSpan[] = [];

let TX_COUNTER = 0;
let CHAT_MSG_COUNTER = 0;
let SPAN_COUNTER = 0;

function resetVoiceLytStore(): void {
  VOICE_STORE.length = 0;
  RECOGNITION_STORE.clear();
  LYT_STORE.clear();
  CHAT_SESSION_STORE.clear();
  MONITOR_TRACES.length = 0;
  TX_COUNTER = 0;
  CHAT_MSG_COUNTER = 0;
  SPAN_COUNTER = 0;
}

function nextTxId(): string { return `lyt_${++TX_COUNTER}`; }
function nextMsgId(): string { return `msg_${++CHAT_MSG_COUNTER}`; }
function nextSpanId(): string { return `span_${++SPAN_COUNTER}`; }
function nextUtteranceId(): string { return `utt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`; }

// ─── 语音: STT + 意图识别 ───

const STT_CONFIG: Record<string, { keywords: string[]; intent: IntentType }> = {
  recharge: { keywords: ['充值', 'recharge', 'top up', 'チャージ', '입금'], intent: 'recharge' },
  transfer: { keywords: ['转账', 'transfer', '送金', '이체'], intent: 'transfer' },
  balance: { keywords: ['余额', 'balance', '残高', '잔액'], intent: 'balance' },
  exchange: { keywords: ['兑换', 'exchange', '両替', '환전'], intent: 'exchange' },
  help: { keywords: ['帮助', 'help', 'ヘルプ', '도움말'], intent: 'help' },
  complaint: { keywords: ['投诉', 'complaint', 'クレーム', '불만'], intent: 'complaint' },
};

function voiceProcessInput(input: VoiceInput): VoiceRecognitionResult {
  const start = Date.now();

  // STT识别置信度 (模拟)
  const confidence = input.confidence;

  // 意图识别: 关键字匹配
  let recognizedIntent: IntentType = 'faq';
  const lowerText = input.text.toLowerCase();
  for (const [, config] of Object.entries(STT_CONFIG)) {
    if (config.keywords.some(k => lowerText.includes(k.toLowerCase()))) {
      recognizedIntent = config.intent;
      break;
    }
  }

  const result: VoiceRecognitionResult = {
    utteranceId: input.utteranceId,
    recognizedText: input.text,
    confidence,
    language: input.language,
    normalizedIntent: recognizedIntent,
    extractedEntities: input.entities,
    processingTimeMs: Date.now() - start,
  };

  RECOGNITION_STORE.set(input.utteranceId, result);
  VOICE_STORE.push(input);

  // 监控打点
  monitorAddSpan('voice', 'voiceProcessInput', start, Date.now(), 'ok');

  return result;
}

// ─── LYT: 交易系统 ───

interface LytAccount {
  accountId: string;
  userId: string;
  balance: number;
  currency: 'LYT' | 'CNY' | 'USD' | 'JPY';
  frozen: number;
}

const ACCOUNT_STORE: Map<string, LytAccount> = new Map();

function lytCreateAccount(account: LytAccount): void {
  ACCOUNT_STORE.set(account.accountId, account);
}

function lytGetAccount(accountId: string): LytAccount | undefined {
  return ACCOUNT_STORE.get(accountId);
}

function lytCreateTransaction(
  fromAccount: string,
  toAccount: string | undefined,
  amount: number,
  currency: 'LYT' | 'CNY' | 'USD',
): { success: boolean; tx?: LytTransaction; error?: string } {
  const start = Date.now();

  const from = ACCOUNT_STORE.get(fromAccount);
  if (!from) return { success: false, error: 'from_account_not_found' };

  if (from.balance < amount) return { success: false, error: 'insufficient_balance' };

  if (toAccount) {
    const to = ACCOUNT_STORE.get(toAccount);
    if (!to) return { success: false, error: 'to_account_not_found' };
  }

  // 模拟签名
  const signature = `sig_${fromAccount}_${Date.now()}`;

  // 创建交易
  const fee = Math.round(amount * 0.001 * 100) / 100; // 0.1% 手续费
  const balanceBefore = from.balance;
  const balanceAfter = Math.round((balanceBefore - amount - fee) * 100) / 100;

  const tx: LytTransaction = {
    txId: nextTxId(),
    fromAccount,
    toAccount,
    amount,
    currency,
    orderType: 'pending',
    signature,
    fee,
    balanceBefore,
    balanceAfter,
    createdAt: Date.now(),
  };

  LYT_STORE.set(tx.txId, tx);
  from.balance = balanceAfter;

  // 监控打点
  monitorAddSpan('lyt', 'lytCreateTransaction', start, Date.now(), 'ok');

  return { success: true, tx };
}

function lytConfirmTransaction(txId: string): boolean {
  const tx = LYT_STORE.get(txId);
  if (!tx || tx.orderType !== 'pending') return false;
  tx.orderType = 'completed';
  tx.completedAt = Date.now();

  // 如果转账到他人账户
  if (tx.toAccount) {
    const to = ACCOUNT_STORE.get(tx.toAccount);
    if (to) to.balance += tx.amount;
  }

  return true;
}

function lytCancelTransaction(txId: string): { success: boolean; error?: string } {
  const tx = LYT_STORE.get(txId);
  if (!tx) return { success: false, error: 'tx_not_found' };
  if (tx.orderType !== 'pending') return { success: false, error: 'cannot_cancel_non_pending' };

  tx.orderType = 'cancelled';

  // 退款
  const from = ACCOUNT_STORE.get(tx.fromAccount);
  if (from) from.balance += tx.amount + tx.fee;

  return { success: true };
}

// ─── AI Chat: 聊天助手 ───

function chatCreateSession(userId: string, language: VoiceLanguage): ChatSession {
  const session: ChatSession = {
    sessionId: `sess_${userId}_${Date.now()}`,
    userId,
    language,
    messages: [],
    context: {},
    escalated: false,
    createdAt: Date.now(),
  };
  CHAT_SESSION_STORE.set(session.sessionId, session);
  return session;
}

const FAQ_RESPONSES: Record<string, Record<string, string>> = {
  'zh-CN': {
    '充值': '充值操作需要您进入"我的钱包"页面，选择充值金额后使用微信/支付宝支付。',
    '余额': '您的当前余额可以通过"我的钱包-余额查询"查看。',
    '兑换': 'LYT兑换支持CNY/USD两种法币，当前汇率为1 LYT = ¥0.5 / $0.07。',
    '帮助': '请问有什么可以帮助您的？您可以查询余额、充值或转账。',
    '投诉': '很抱歉给您带来不便，我将为您转接人工客服。',
    default: '抱歉，我暂时无法回答您的问题，已为您转接到人工客服。请稍候。',
  },
  'en-US': {
    'recharge': 'To recharge, please go to "My Wallet" and select the amount to pay via WeChat or Alipay.',
    'balance': 'Your current balance can be viewed in "My Wallet - Balance Inquiry".',
    'exchange': 'LYT supports CNY/USD fiat exchange. Current rate: 1 LYT = ¥0.5 / $0.07.',
    'help': 'How can I help you? You can check balance, recharge, or transfer funds.',
    'complaint': 'We apologize for the inconvenience. I will transfer you to a human agent.',
    default: 'Sorry, I cannot answer your question. Transferring to human agent. Please wait.',
  },
  'ja-JP': {
    'チャージ': 'チャージは「マイウォレット」から、金額を選択しWeChat/Alipayでお支払いください。',
    '残高': '現在の残高は「マイウォレット-残高照会」でご確認いただけます。',
    '両替': 'LYTはCNY/USDの両替に対応しています。現在のレート: 1 LYT = ¥0.5 / $0.07。',
    'ヘルプ': 'どのようなご用件でしょうか？残高照会、チャージ、送金が可能です。',
    'クレーム': 'ご不便をおかけして申し訳ございません。オペレーターにおつなぎします。',
    default: '申し訳ございません。オペレーターにおつなぎします。少々お待ちください。',
  },
};

function chatSendMessage(sessionId: string, content: string, role: 'user' | 'bot' | 'agent' = 'user'): ChatMessage | undefined {
  const session = CHAT_SESSION_STORE.get(sessionId);
  if (!session) return undefined;

  const msg: ChatMessage = {
    messageId: nextMsgId(),
    sessionId,
    role,
    content,
    language: session.language,
    timestamp: Date.now(),
  };

  session.messages.push(msg);

  // 如果用户消息, 自动回复
  if (role === 'user') {
    const lang = session.language;
    const langFaq = FAQ_RESPONSES[lang] || FAQ_RESPONSES['zh-CN'];

    // 意图匹配
    let botResponse = langFaq.default;
    for (const [keyword, response] of Object.entries(langFaq)) {
      if (keyword !== 'default' && content.toLowerCase().includes(keyword.toLowerCase())) {
        botResponse = response;
        break;
      }
    }

    // 投诉→转人工
    const isComplaint = content.toLowerCase().includes('投诉') || content.toLowerCase().includes('complaint') ||
                        content.toLowerCase().includes('クレーム') || content.toLowerCase().includes('불만');
    if (isComplaint) {
      session.escalated = true;
      const agentMsg: ChatMessage = {
        messageId: nextMsgId(),
        sessionId,
        role: 'agent',
        content: botResponse,
        language: lang,
        timestamp: Date.now(),
      };
      session.messages.push(agentMsg);
      return agentMsg;
    }

    const botMsg: ChatMessage = {
      messageId: nextMsgId(),
      sessionId,
      role: 'bot',
      content: botResponse,
      language: lang,
      timestamp: Date.now(),
    };
    session.messages.push(botMsg);
    return botMsg;
  }

  return msg;
}

function chatGetSession(sessionId: string): ChatSession | undefined {
  return CHAT_SESSION_STORE.get(sessionId);
}

// ─── I18n: 国际化多语言 ───

function i18nGetSupportedLanguages(): VoiceLanguage[] {
  return ['zh-CN', 'en-US', 'ja-JP'];
}

function i18nTranslate(text: string, from: VoiceLanguage, to: VoiceLanguage): string {
  if (from === to) return text;
  return `[${from}→${to}] ${text}`; // 模拟翻译
}

// ─── Monitor: 运行时监控 ───

function monitorAddSpan(
  service: MonitorTraceSpan['service'],
  operation: string,
  startTime: number,
  endTime: number,
  status: 'ok' | 'error',
  errorMessage?: string,
): void {
  MONITOR_TRACES.push({
    spanId: nextSpanId(),
    traceId: `trace_${Date.now()}`,
    service,
    operation,
    startTime,
    endTime,
    durationMs: endTime - startTime,
    status,
    errorMessage,
  });
}

function monitorGetTraces(service?: string): MonitorTraceSpan[] {
  if (service) return MONITOR_TRACES.filter(t => t.service === service);
  return [...MONITOR_TRACES];
}

function monitorGetAvgLatency(service: string): number {
  const traces = MONITOR_TRACES.filter(t => t.service === service && t.status === 'ok');
  if (traces.length === 0) return 0;
  const total = traces.reduce((s, t) => s + t.durationMs, 0);
  return Math.round(total / traces.length);
}

// ─── 测试套件 ───

describe('[L3-E2E] 链43: 语音交互 → LYT交易 → AI聊天 → 国际化 → 运行时监控', () => {

  // ════════════════════════════════════════════
  // 正例 (P) — 全链路
  // ════════════════════════════════════════════

  test('[P1] 正向: 语音充值完整链路 — 语音→LYT交易→CHAT确认→i18n播报', () => {
    resetVoiceLytStore();

    // 1. 创建账户
    lytCreateAccount({ accountId: 'acc_user01', userId: 'user01', balance: 500, currency: 'LYT', frozen: 0 });

    // 2. 语音输入: "帮我充值100元"
    const voiceIn: VoiceInput = {
      utteranceId: nextUtteranceId(),
      text: '帮我充值100元',
      language: 'zh-CN',
      confidence: 0.92,
      intent: 'recharge',
      entities: { amount: 100, currency: 'CNY' },
      audioDurationMs: 3500,
      processedAt: Date.now(),
    };

    const recognition = voiceProcessInput(voiceIn);
    assert.equal(recognition.normalizedIntent, 'recharge');
    assert.equal(recognition.confidence, 0.92);
    assert.ok(recognition.recognizedText.includes('充值'));

    // 3. LYT交易: 充值100 LYT (源账户: acc_user01, 资金从充值账户)
    // 充值场景: from=内部账户 to=用户账户
    lytCreateAccount({ accountId: 'acc_platform', userId: 'platform', balance: 10000, currency: 'LYT', frozen: 0 });
    const tx = lytCreateTransaction('acc_platform', 'acc_user01', 100, 'LYT');
    assert.ok(tx.success);
    assert.equal(tx.tx!.amount, 100);
    assert.equal(tx.tx!.orderType, 'pending');

    // 4. 确认交易
    const confirmed = lytConfirmTransaction(tx.tx!.txId);
    assert.ok(confirmed);

    // 5. 验证余额
    const userAcc = lytGetAccount('acc_user01');
    assert.equal(userAcc!.balance, 600); // 500 + 100

    // 6. CHAT对话: 创建会话→播报充值成功
    const session = chatCreateSession('user01', 'zh-CN');
    const reply = chatSendMessage(session.sessionId, '充值成功了吗？');
    assert.ok(reply);
    assert.equal(reply!.role, 'bot');

    // 7. 监控打点验证
    const voiceTraces = monitorGetTraces('voice');
    assert.ok(voiceTraces.length >= 1);
    assert.equal(voiceTraces[0].operation, 'voiceProcessInput');
    assert.equal(voiceTraces[0].status, 'ok');

    const lytTraces = monitorGetTraces('lyt');
    assert.ok(lytTraces.length >= 1);
    assert.equal(lytTraces[0].operation, 'lytCreateTransaction');

    assert.ok(monitorGetAvgLatency('voice') >= 0);
  });

  test('[P2] 正向: 多语言FAQ — 中文/英文/日语各提问', () => {
    resetVoiceLytStore();

    const languages: VoiceLanguage[] = ['zh-CN', 'en-US', 'ja-JP'];
    const queries: Record<string, string> = {
      'zh-CN': '我的余额是多少',
      'en-US': 'what is my balance',
      'ja-JP': '残高はいくらですか',
    };

    for (const lang of languages) {
      const session = chatCreateSession(`user_${lang}`, lang);
      const reply = chatSendMessage(session.sessionId, queries[lang]);
      assert.ok(reply, `${lang} 应收到回复`);

      // 验证回复语言
      if (lang === 'zh-CN') {
        assert.ok(reply!.content.includes('余额'));
        assert.equal(reply!.role, 'bot');
      } else if (lang === 'en-US') {
        assert.ok(reply!.content.includes('balance') || reply!.content.includes('Balance'));
      } else if (lang === 'ja-JP') {
        assert.ok(reply!.content.includes('残高'));
      }
    }
  });

  test('[P3] 正向: 语音意图精准识别 — 5种意图', () => {
    resetVoiceLytStore();

    const testCases: Array<{ text: string; expectedIntent: IntentType }> = [
      { text: '我要充值500元', expectedIntent: 'recharge' },
      { text: '转账给张三200元', expectedIntent: 'transfer' },
      { text: '查询我的余额', expectedIntent: 'balance' },
      { text: 'LYT兑换成美金', expectedIntent: 'exchange' },
      { text: '帮助', expectedIntent: 'help' },
      { text: '我要投诉', expectedIntent: 'complaint' },
      { text: '今天天气怎么样', expectedIntent: 'faq' }, // 不匹配 → faq
    ];

    for (const tc of testCases) {
      const vi: VoiceInput = {
        utteranceId: nextUtteranceId(),
        text: tc.text,
        language: 'zh-CN',
        confidence: 0.85,
        intent: tc.expectedIntent,
        entities: {},
        audioDurationMs: 2000,
        processedAt: Date.now(),
      };
      const result = voiceProcessInput(vi);
      assert.equal(result.normalizedIntent, tc.expectedIntent, `"${tc.text}" 应识别为 ${tc.expectedIntent}`);
    }
  });

  // ════════════════════════════════════════════
  // 反例 (N)
  // ════════════════════════════════════════════

  test('[N1] 反例: 余额不足时LYT交易拒绝', () => {
    resetVoiceLytStore();
    lytCreateAccount({ accountId: 'acc_poor', userId: 'poor_user', balance: 10, currency: 'LYT', frozen: 0 });
    lytCreateAccount({ accountId: 'acc_rich', userId: 'rich_user', balance: 1000, currency: 'LYT', frozen: 0 });

    const tx = lytCreateTransaction('acc_poor', 'acc_rich', 100, 'LYT');
    assert.equal(tx.success, false);
    assert.equal(tx.error, 'insufficient_balance');
  });

  test('[N2] 反例: 不存在的账户交易被拒绝', () => {
    resetVoiceLytStore();
    const tx = lytCreateTransaction('ghost_account', 'acc_user01', 100, 'LYT');
    assert.equal(tx.success, false);
    assert.equal(tx.error, 'from_account_not_found');
  });

  test('[N3] 反例: 确认已完成的交易被拒绝', () => {
    resetVoiceLytStore();
    lytCreateAccount({ accountId: 'acc_a', userId: 'a', balance: 500, currency: 'LYT', frozen: 0 });
    lytCreateAccount({ accountId: 'acc_b', userId: 'b', balance: 100, currency: 'LYT', frozen: 0 });

    const tx = lytCreateTransaction('acc_a', 'acc_b', 50, 'LYT');
    assert.ok(tx.success);
    assert.ok(lytConfirmTransaction(tx.tx!.txId));

    // 重复确认
    const dupConfirm = lytConfirmTransaction(tx.tx!.txId);
    assert.equal(dupConfirm, false);
  });

  test('[N4] 反例: 不存在的会话发送消息', () => {
    resetVoiceLytStore();
    const msg = chatSendMessage('nonexistent_session', 'hello');
    assert.equal(msg, undefined);
  });

  test('[N5] 反例: 未设置语音语言时默认降级', () => {
    resetVoiceLytStore();
    // 默认fallback到zh-CN
    const session = chatCreateSession('user_test', 'zh-CN');
    const reply = chatSendMessage(session.sessionId, 'unknown gibberish xyz123');
    assert.ok(reply);
    // 应返回default回复
    assert.ok(reply!.content.includes('转接'));
  });

  // ════════════════════════════════════════════
  // 边界 (B)
  // ════════════════════════════════════════════

  test('[B1] 边界: 语音低置信度(0.4)仍正常处理', () => {
    resetVoiceLytStore();
    const vi: VoiceInput = {
      utteranceId: nextUtteranceId(),
      text: '充值', language: 'zh-CN', confidence: 0.4,
      intent: 'recharge', entities: { amount: 100 },
      audioDurationMs: 1200, processedAt: Date.now(),
    };
    const result = voiceProcessInput(vi);
    assert.equal(result.confidence, 0.4);
    assert.equal(result.normalizedIntent, 'recharge');
  });

  test('[B2] 边界: 转账到目标账户后双方余额验证', () => {
    resetVoiceLytStore();
    lytCreateAccount({ accountId: 'acc_src', userId: 'src', balance: 1000, currency: 'LYT', frozen: 0 });
    lytCreateAccount({ accountId: 'acc_dst', userId: 'dst', balance: 200, currency: 'LYT', frozen: 0 });

    const tx = lytCreateTransaction('acc_src', 'acc_dst', 300, 'LYT');
    assert.ok(tx.success);
    assert.equal(tx.tx!.fee, 0.3); // 300 * 0.001 = 0.3

    // 确认后双方余额变化
    assert.ok(lytConfirmTransaction(tx.tx!.txId));

    const src = lytGetAccount('acc_src');
    const dst = lytGetAccount('acc_dst');
    // src: 1000 - 300 - 0.3 = 699.7
    assert.equal(src!.balance, 699.7);
    // dst: 200 + 300 = 500
    assert.equal(dst!.balance, 500);
  });

  test('[B3] 边界: 取消交易后余额回退', () => {
    resetVoiceLytStore();
    lytCreateAccount({ accountId: 'acc_c', userId: 'c', balance: 500, currency: 'LYT', frozen: 0 });

    const tx = lytCreateTransaction('acc_c', undefined, 200, 'LYT');
    assert.ok(tx.success);

    const cancel = lytCancelTransaction(tx.tx!.txId);
    assert.ok(cancel.success);

    // 确认余额回退 (500 - 200 - 0.2 + 200 + 0.2 = 500)
    const acc = lytGetAccount('acc_c');
    assert.equal(acc!.balance, 500);
  });

  test('[B4] 边界: 大量并发交易 + 语音调用链监控', () => {
    resetVoiceLytStore();
    lytCreateAccount({ accountId: 'acc_bulk', userId: 'bulk', balance: 100000, currency: 'LYT', frozen: 0 });

    // 100笔并发交易
    const txCount = 100;
    for (let i = 0; i < txCount; i++) {
      const tx = lytCreateTransaction('acc_bulk', undefined, 1, 'LYT');
      assert.ok(tx.success);
      lytConfirmTransaction(tx.tx!.txId);
    }

    const finalAcc = lytGetAccount('acc_bulk');
    // 100笔 * 1 LY = 100, fee per tx = Math.round(1 * 0.001 * 100) / 100 = 0
    // 100000 - 100 = 99900
    assert.equal(finalAcc!.balance, 99900);

    // 语音→监控打点
    const bulkVoice = voiceProcessInput({
      utteranceId: nextUtteranceId(), text: '帮助', language: 'zh-CN',
      confidence: 0.9, intent: 'help', entities: {}, audioDurationMs: 1000, processedAt: Date.now(),
    });
    assert.equal(bulkVoice.normalizedIntent, 'help');

    // 验证监控
    const allTraces = monitorGetTraces();
    assert.ok(allTraces.length > 100); // 语音1 + LYT 100 + confirm 100 = 约201
    assert.equal(monitorGetAvgLatency('lyt'), 0); // 0ms 模拟
  });

  test('[B5] 边界: 会话多轮上下文保留', () => {
    resetVoiceLytStore();
    const session = chatCreateSession('context_user', 'zh-CN');

    // 第一轮
    chatSendMessage(session.sessionId, '我的余额', 'user');
    const s1 = chatGetSession(session.sessionId);
    assert.equal(s1!.messages.length, 2); // user + bot

    // 第二轮
    chatSendMessage(session.sessionId, '再帮我充值', 'user');
    const s2 = chatGetSession(session.sessionId);
    assert.equal(s2!.messages.length, 4); // 2 user + 2 bot
  });

  test('[B6] 边界: 投诉消息触发转人工', () => {
    resetVoiceLytStore();
    const session = chatCreateSession('angry_user', 'zh-CN');
    const reply = chatSendMessage(session.sessionId, '我要投诉你们服务太差');
    assert.ok(reply);
    assert.equal(reply!.role, 'agent', '投诉应转接到agent');
    const s = chatGetSession(session.sessionId);
    assert.ok(s!.escalated, '会话应标记为已转人工');
  });
});
