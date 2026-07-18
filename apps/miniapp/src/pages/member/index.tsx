import { View, Text, Button } from '@tarojs/components';
import { useEffect, useState } from 'react';
import { buildDomainGovernanceHref, type PortalDomainGovernanceSummaryContract } from '@m5/types';
import {
  appendMiniappSubmitHistory,
  buildMiniappAuthEnvelope,
  buildMiniappLedger,
  buildMiniappHandlerSyncContract,
  createMiniappCallbackReceipt,
  createMiniappActionTicket,
  createMiniappRuntimeConsumerContract,
  createMiniappReplayRequest,
  createMiniappReplayRetryPolicy,
  createGuestMemberSession,
  createMemberSession,
  loadMiniappMemberRuntimeSnapshot,
  listMiniappActionPlans,
  loadMiniappRuntimeConsumerContract,
  miniappMarketBootstrap,
  replayMiniappSubmitHistoryEntry,
  submitMiniappActionPlan,
  type MiniappActionKey,
  type MiniappActionPlan,
  type MiniappLedgerRecord,
  type MiniappMemberRuntimeSnapshot,
  type MiniappMemberSession,
  type MiniappReplayOutcome,
  type MiniappRuntimeConsumerContract,
  type MiniappSubmitHistoryEntry,
  type MiniappSubmitOutcome
} from '../../market-bootstrap';

function resolveDomainGovernanceWorkspaceHref(
  summary: PortalDomainGovernanceSummaryContract,
  marketCode: string
) {
  const scope =
    summary.currentScopes.find((item) => item.missingPrimary) ??
    summary.currentScopes.find((item) => item.scopeType === 'STORE') ??
    summary.currentScopes.find((item) => item.scopeType === 'BRAND') ??
    summary.currentScopes[0];

  return buildDomainGovernanceHref({
    tenantId: scope?.tenantId,
    brandId: scope?.brandId,
    storeId: scope?.storeId,
    marketCode,
    scopeType: scope?.scopeType,
  });
}

// 会员等级体系
const MEMBER_TIERS = [
  { key: 'bronze', level: '铜牌会员', label: '铜牌会员', minPoints: 0, color: '#cd7f32' },
  { key: 'silver', level: '银牌会员', label: '银牌会员', minPoints: 3000, color: '#c0c0c0' },
  { key: 'gold', level: '金牌会员', label: '金牌会员', minPoints: 10000, color: '#ffd700' },
  { key: 'platinum', level: '钻石会员', label: '钻石会员', minPoints: 50000, color: '#e5e4e2' },
];

export default function MemberPage() {
  const [consumerContract, setConsumerContract] = useState<MiniappRuntimeConsumerContract>(
    createMiniappRuntimeConsumerContract(miniappMarketBootstrap)
  );
  const [session, setSession] = useState<MiniappMemberSession>(createGuestMemberSession());
  const [memberRuntime, setMemberRuntime] = useState<MiniappMemberRuntimeSnapshot>({
    deliveryMode: 'fallback',
    session: createGuestMemberSession(),
    profile: null,
    availableMembers: [],
    sessionVerified: false,
    note: '当前无法读取真实会员档案，会员中心回退到本地游客态演示。'
  });
  const [activeAction, setActiveAction] = useState<MiniappActionKey>('member-login');
  const [submitOutcome, setSubmitOutcome] = useState<MiniappSubmitOutcome | null>(null);
  const [submitHistory, setSubmitHistory] = useState<MiniappSubmitHistoryEntry[]>([]);
  const [replayOutcome, setReplayOutcome] = useState<MiniappReplayOutcome | null>(null);
  const bootstrap = consumerContract.snapshot;
  const domainGovernance = bootstrap.domainGovernance;
  const governanceWorkspaceHref = resolveDomainGovernanceWorkspaceHref(domainGovernance, bootstrap.marketCode);
  const actionPlans = listMiniappActionPlans(bootstrap, session);
  const visiblePlans = actionPlans.filter((plan) => plan.action !== 'booking-submit');
  const activePlan = visiblePlans.find((plan) => plan.action === activeAction) ?? null;
  const decision = activePlan?.decision ?? null;
  const ledger = buildMiniappLedger(submitHistory);
  const submitTicket = submitOutcome ? createMiniappActionTicket(submitOutcome) : null;
  const handlerSync = submitOutcome ? buildMiniappHandlerSyncContract(submitOutcome) : null;
  const latestReplayRequest = ledger[0] ? createMiniappReplayRequest(ledger[0]) : null;
  const authEnvelope = handlerSync ? buildMiniappAuthEnvelope(handlerSync) : null;
  const callbackReceipt = submitOutcome && handlerSync ? createMiniappCallbackReceipt(submitOutcome, handlerSync) : null;
  const retryPolicy = ledger[0] && replayOutcome ? createMiniappReplayRetryPolicy(ledger[0], replayOutcome) : null;

  useEffect(() => {
    let cancelled = false;

    loadMiniappRuntimeConsumerContract().then((contract) => {
      if (!cancelled) {
        setConsumerContract(contract);
      }
    });

    loadMiniappMemberRuntimeSnapshot().then((runtime) => {
      if (!cancelled) {
        setMemberRuntime(runtime);
        setSession(runtime.session);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={{ padding: '32px', color: '#e2e8f0', background: '#0f172a', minHeight: '100vh' }}>
      <Text>
        会员中心已接入移动端 bootstrap 运行态，当前为 {bootstrap.deliveryMode} / {bootstrap.marketCode}。
      </Text>
      <View style={{ marginTop: '16px' }}>
        <Text>
          会员层级：{session.memberTier} / 积分：{session.points} / 券包：{session.couponCount} / 数据源：{memberRuntime.deliveryMode}
        </Text>
      </View>
      <View style={{ marginTop: '8px' }}>
        <Text>{memberRuntime.note}</Text>
      </View>
      <View style={{ marginTop: '8px' }}>
        <Text>
          会话：{session.authenticated ? '已登录' : '游客'} / 校验：{memberRuntime.sessionVerified ? '通过' : '未校验'}
        </Text>
      </View>
      <View style={{ marginTop: '8px' }}>
        <Text>域名来源：{bootstrap.domainSource}</Text>
      </View>
      {memberRuntime.profile ? (
        <View style={{ marginTop: '8px' }}>
          <Text>
            真实会员：{memberRuntime.profile.nickname} / {memberRuntime.profile.level} / {memberRuntime.profile.status}
          </Text>
        </View>
      ) : null}
      {session.sessionToken ? (
        <View style={{ marginTop: '8px' }}>
          <Text>Session：{session.sessionToken.slice(0, 12)}... / 过期 {session.expiresAt}</Text>
        </View>
      ) : null}
      {memberRuntime.availableMembers.length > 0 ? (
        <View style={{ marginTop: '8px' }}>
          <Text>
            可用会员：{memberRuntime.availableMembers.map((item) => item.nickname).join(' / ')}
          </Text>
        </View>
      ) : null}
      <View style={{ marginTop: '8px' }}>
        <Text>Scope：{consumerContract.scope.scopePath} / {consumerContract.scope.mismatchStrategy}</Text>
      </View>
      <View style={{ marginTop: '8px' }}>
        <Text>
          降级：{consumerContract.degradation.featureFlagFallback} / 脱敏：{consumerContract.degradation.desensitizationMode}
        </Text>
      </View>
      <View style={{ marginTop: '8px' }}>
        <Text>挑战：{consumerContract.challenge.enforcement}</Text>
      </View>
      <View style={{ marginTop: '8px' }}>
        <Text>Governance：{consumerContract.governance.alerts.map((item) => item.code).join(' / ')}</Text>
      </View>
      <View
        style={{
          marginTop: '20px',
          padding: '16px',
          borderRadius: '16px',
          background: domainGovernance.requiresAttention ? 'rgba(127, 29, 29, 0.35)' : 'rgba(15, 23, 42, 0.65)'
        }}
      >
        <Text>
          域名治理：缺主 scope {domainGovernance.totalMissingPrimaryScopes} / 活跃未设主域名{' '}
          {domainGovernance.totalActiveWithoutPrimaryDomains}
        </Text>
        <View style={{ marginTop: '8px' }}>
          <Text>
            治理状态：{domainGovernance.requiresAttention ? '待治理' : '已对齐'} / 可直接补选{' '}
            {domainGovernance.recommendedReadyScopes}
          </Text>
        </View>
        <View style={{ marginTop: '8px' }}>
          <Text>治理后台入口：{governanceWorkspaceHref}</Text>
        </View>
      </View>
      <View style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
        <Button onClick={() => {
          setSession(createGuestMemberSession());
          setSubmitOutcome(null);
        }}>切回游客</Button>
        <Button onClick={() => {
          void loadMiniappMemberRuntimeSnapshot().then((runtime) => {
            setMemberRuntime(runtime);
            setSession(runtime.session);
            setSubmitOutcome(null);
          });
        }}>同步真实会员</Button>
        <Button onClick={() => {
          setSession(createMemberSession());
          setSubmitOutcome(null);
        }}>模拟登录会员</Button>
        <Button onClick={() => {
          setSession(createMemberSession('SVIP'));
          setSubmitOutcome(null);
        }}>模拟 SVIP</Button>
      </View>
      <View style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
        <Button
          onClick={() => {
            setActiveAction('member-login');
            setSubmitOutcome(null);
          }}
        >
          会员登录
        </Button>
        <Button
          onClick={() => {
            setActiveAction('coupon-claim');
            setSubmitOutcome(null);
          }}
        >
          券权益校验
        </Button>
      </View>
      <View style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
        <Button
          onClick={() => {
            if (activePlan) {
              const outcome = submitMiniappActionPlan(activePlan);
              setSubmitOutcome(outcome);
              setSubmitHistory((current) => appendMiniappSubmitHistory(current, outcome));
              setReplayOutcome(null);
            }
          }}
        >
          执行当前动作
        </Button>
        <Button
          onClick={() => {
            const latest = submitHistory[0];
            if (latest) {
              setReplayOutcome(replayMiniappSubmitHistoryEntry(latest));
            }
          }}
        >
          回放最近记录
        </Button>
      </View>
      <View style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
        {visiblePlans.map((plan: MiniappActionPlan) => (
          <View
            key={plan.action}
            style={{
              padding: '16px',
              borderRadius: '16px',
              background: activeAction === plan.action ? 'rgba(30, 41, 59, 0.92)' : 'rgba(15, 23, 42, 0.65)'
            }}
          >
            <Text>
              {plan.label} / 风险 {plan.riskLevel} / 通道 {plan.channel}
            </Text>
            <View style={{ marginTop: '8px' }}>
              <Text>{plan.draftSummary}</Text>
            </View>
            <View style={{ marginTop: '8px' }}>
              <Text>下一步：{plan.decision.nextStep}</Text>
            </View>
            <View style={{ marginTop: '8px' }}>
              <Text>请求预览：{plan.requestPreview.method} {plan.requestPreview.endpoint}</Text>
            </View>
          </View>
        ))}
      </View>
      {decision ? (
        <View
          style={{
            marginTop: '20px',
            padding: '16px',
            borderRadius: '16px',
            background: 'rgba(15, 23, 42, 0.65)'
          }}
        >
          <Text>{decision.title}</Text>
          <View style={{ marginTop: '8px' }}>
            <Text>状态：{decision.bootstrapState}</Text>
          </View>
          <View style={{ marginTop: '8px' }}>
            <Text>{decision.helper}</Text>
          </View>
          {activePlan ? (
            <View style={{ marginTop: '8px' }}>
              <Text>执行清单：{activePlan.checklist.join(' / ')}</Text>
            </View>
          ) : null}
          {activePlan ? (
            <View style={{ marginTop: '8px' }}>
              <Text>Payload：{JSON.stringify(activePlan.requestPreview.payload)}</Text>
            </View>
          ) : null}
        </View>
      ) : null}
      {submitOutcome ? (
        <View
          style={{
            marginTop: '20px',
            padding: '16px',
            borderRadius: '16px',
            background: 'rgba(8, 47, 73, 0.65)'
          }}
        >
          <Text>提交结果：{submitOutcome.state}</Text>
          <View style={{ marginTop: '8px' }}>
            <Text>{submitOutcome.message}</Text>
          </View>
          <View style={{ marginTop: '8px' }}>
            <Text>提交入口：{submitOutcome.endpoint} / 下一步 {submitOutcome.nextStep}</Text>
          </View>
          <View style={{ marginTop: '8px' }}>
            <Text>回执：{submitOutcome.receiptCode} / 建议动作 {submitOutcome.recommendedAction}</Text>
          </View>
          <View style={{ marginTop: '8px' }}>
            <Text>Payload 摘要：{submitOutcome.payloadSummary}</Text>
          </View>
        </View>
      ) : null}
      {submitTicket ? (
        <View
          style={{
            marginTop: '20px',
            padding: '16px',
            borderRadius: '16px',
            background: 'rgba(51, 65, 85, 0.65)'
          }}
        >
          <Text>Ticket：{submitTicket.ticketType} / {submitTicket.status}</Text>
          <View style={{ marginTop: '8px' }}>
            <Text>{submitTicket.summary}</Text>
          </View>
          <View style={{ marginTop: '8px' }}>
            <Text>票据编码：{submitTicket.ticketCode}</Text>
          </View>
        </View>
      ) : null}
      {handlerSync ? (
        <View
          style={{
            marginTop: '20px',
            padding: '16px',
            borderRadius: '16px',
            background: 'rgba(12, 74, 110, 0.5)'
          }}
        >
          <Text>Handler Sync：{handlerSync.handlerName}</Text>
          <View style={{ marginTop: '8px' }}>
            <Text>{handlerSync.summary}</Text>
          </View>
          <View style={{ marginTop: '8px' }}>
            <Text>Sync：{handlerSync.syncEndpoint}</Text>
          </View>
          <View style={{ marginTop: '8px' }}>
            <Text>Callback：{handlerSync.callbackEndpoint}</Text>
          </View>
          <View style={{ marginTop: '8px' }}>
            <Text>
              模式：{handlerSync.syncMode} / 幂等键 {handlerSync.idempotencyKey} / {handlerSync.ready ? '可同步' : '待前置'}
            </Text>
          </View>
        </View>
      ) : null}
      {authEnvelope ? (
        <View
          style={{
            marginTop: '20px',
            padding: '16px',
            borderRadius: '16px',
            background: 'rgba(22, 101, 52, 0.45)'
          }}
        >
          <Text>Auth Envelope：{authEnvelope.authScheme}</Text>
          <View style={{ marginTop: '8px' }}>
            <Text>Audience：{authEnvelope.audience}</Text>
          </View>
          <View style={{ marginTop: '8px' }}>
            <Text>Authorization：{authEnvelope.authorization}</Text>
          </View>
          <View style={{ marginTop: '8px' }}>
            <Text>Signed：{authEnvelope.signedHeaders.join(' / ')} / 过期 {authEnvelope.expiresAt}</Text>
          </View>
        </View>
      ) : null}
      {callbackReceipt ? (
        <View
          style={{
            marginTop: '20px',
            padding: '16px',
            borderRadius: '16px',
            background: 'rgba(120, 53, 15, 0.45)'
          }}
        >
          <Text>Callback Receipt：{callbackReceipt.callbackStatus}</Text>
          <View style={{ marginTop: '8px' }}>
            <Text>{callbackReceipt.summary}</Text>
          </View>
          <View style={{ marginTop: '8px' }}>
            <Text>Endpoint：{callbackReceipt.callbackEndpoint} / Ack {callbackReceipt.ackToken}</Text>
          </View>
        </View>
      ) : null}
      {submitHistory.length > 0 ? (
        <View style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
          {submitHistory.map((entry) => (
            <View
              key={entry.receiptCode}
              style={{ padding: '16px', borderRadius: '16px', background: 'rgba(15, 23, 42, 0.65)' }}
            >
              <Text>执行历史：{entry.action} / {entry.state}</Text>
              <View style={{ marginTop: '8px' }}>
                <Text>{entry.summary}</Text>
              </View>
              <View style={{ marginTop: '8px' }}>
                <Text>回执：{entry.receiptCode} / 建议 {entry.recommendedAction}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
      {replayOutcome ? (
        <View
          style={{
            marginTop: '20px',
            padding: '16px',
            borderRadius: '16px',
            background: 'rgba(30, 64, 175, 0.35)'
          }}
        >
          <Text>回放结果：{replayOutcome.status}</Text>
          <View style={{ marginTop: '8px' }}>
            <Text>{replayOutcome.message}</Text>
          </View>
          <View style={{ marginTop: '8px' }}>
            <Text>回放入口：{replayOutcome.replayEndpoint}</Text>
          </View>
        </View>
      ) : null}
      {retryPolicy ? (
        <View
          style={{
            marginTop: '20px',
            padding: '16px',
            borderRadius: '16px',
            background: 'rgba(127, 29, 29, 0.45)'
          }}
        >
          <Text>Retry Policy：{retryPolicy.retryable ? '可重试' : '人工复核'}</Text>
          <View style={{ marginTop: '8px' }}>
            <Text>{retryPolicy.summary}</Text>
          </View>
          <View style={{ marginTop: '8px' }}>
            <Text>
              次数：{retryPolicy.currentAttempt}/{retryPolicy.maxAttempts} / Backoff {retryPolicy.nextBackoffMs}ms
            </Text>
          </View>
          <View style={{ marginTop: '8px' }}>
            <Text>升级动作：{retryPolicy.escalationAction}</Text>
          </View>
        </View>
      ) : null}
      {ledger.length > 0 ? (
        <View style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
          {ledger.map((record: MiniappLedgerRecord) => (
            <View
              key={record.ledgerKey}
              style={{ padding: '16px', borderRadius: '16px', background: 'rgba(15, 23, 42, 0.65)' }}
            >
              <Text>Ledger：{record.action} / {record.state}</Text>
              <View style={{ marginTop: '8px' }}>
                <Text>{record.summary}</Text>
              </View>
              <View style={{ marginTop: '8px' }}>
                <Text>Key：{record.ledgerKey} / 回放 {record.replayable ? '可用' : '受限'}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
      {latestReplayRequest ? (
        <View
          style={{
            marginTop: '20px',
            padding: '16px',
            borderRadius: '16px',
            background: 'rgba(67, 56, 202, 0.35)'
          }}
        >
          <Text>Replay Request：{latestReplayRequest.method} {latestReplayRequest.endpoint}</Text>
          <View style={{ marginTop: '8px' }}>
            <Text>Headers：{JSON.stringify(latestReplayRequest.headers)}</Text>
          </View>
          <View style={{ marginTop: '8px' }}>
            <Text>Body：{JSON.stringify(latestReplayRequest.body)}</Text>
          </View>
        </View>
      ) : null}
    </View>
  )
}
