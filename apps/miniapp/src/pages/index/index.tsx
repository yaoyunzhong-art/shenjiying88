import { View, Text, Button } from '@tarojs/components';
import { useEffect, useState } from 'react';
import type {
  FoundationAlertCatalogItem,
  FoundationAlertDrilldownResponse,
  FoundationAlertMutationResponse,
  RuntimeGovernanceReceipt
} from '@m5/types';
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
  acknowledgeMiniappGovernanceAlert,
  formatMiniappLocaleSummary,
  formatMiniappSharePolicySummary,
  loadMiniappRuntimeReceipt,
  loadMiniappAlertDrilldown,
  listMiniappActionPlans,
  loadMiniappRuntimeConsumerContract,
  miniappMarketBootstrap,
  muteMiniappGovernanceAlert,
  recordMiniappRuntimeCallback,
  replayMiniappRuntimeReceipt,
  replayMiniappSubmitHistoryEntry,
  syncMiniappRuntimeReceipt,
  submitMiniappActionPlanToApi,
  submitMiniappActionPlan,
  unmuteMiniappGovernanceAlert,
  type MiniappActionKey,
  type MiniappActionPlan,
  type MiniappLedgerRecord,
  type MiniappMemberSession,
  type MiniappReplayOutcome,
  type MiniappRuntimeConsumerContract,
  type MiniappSubmitHistoryEntry,
  type MiniappSubmitOutcome
} from '../../market-bootstrap';

export default function IndexPage() {
  const [consumerContract, setConsumerContract] = useState<MiniappRuntimeConsumerContract>(
    createMiniappRuntimeConsumerContract(miniappMarketBootstrap)
  );
  const [session, setSession] = useState<MiniappMemberSession>(createGuestMemberSession());
  const [activeAction, setActiveAction] = useState<MiniappActionKey>('member-login');
  const [submitOutcome, setSubmitOutcome] = useState<MiniappSubmitOutcome | null>(null);
  const [submitHistory, setSubmitHistory] = useState<MiniappSubmitHistoryEntry[]>([]);
  const [replayOutcome, setReplayOutcome] = useState<MiniappReplayOutcome | null>(null);
  const [runtimeReceipt, setRuntimeReceipt] = useState<RuntimeGovernanceReceipt | null>(null);
  const [runtimeHistory, setRuntimeHistory] = useState<RuntimeGovernanceReceipt[]>([]);
  const [governanceAlerts, setGovernanceAlerts] = useState<FoundationAlertCatalogItem[]>([]);
  const [governanceGeneratedAt, setGovernanceGeneratedAt] = useState('bootstrap');
  const [selectedAlertCode, setSelectedAlertCode] = useState<FoundationAlertCatalogItem['code']>('approvals-pending');
  const [alertDrilldown, setAlertDrilldown] = useState<FoundationAlertDrilldownResponse | null>(null);
  const [alertMutation, setAlertMutation] = useState<FoundationAlertMutationResponse | null>(null);
  const bootstrap = consumerContract.snapshot;
  const domainGovernance = bootstrap.domainGovernance;
  const governanceWorkspaceHref = bootstrap.domainGovernanceWorkspaceHref;
  const actionPlans = listMiniappActionPlans(bootstrap, session);
  const activePlan = actionPlans.find((plan) => plan.action === activeAction) ?? null;
  const decision = activePlan?.decision ?? null;
  const overviewStats = [
    {
      label: '待处理审批',
      value: consumerContract.governance.summary.approvalsPending,
      helper: `执行失败 ${consumerContract.governance.summary.approvalsWithFailures}`
    },
    {
      label: '高风险审计',
      value: consumerContract.governance.summary.highRiskAudits,
      helper: `限流封禁 ${consumerContract.governance.summary.blockedLedgers}`
    },
    {
      label: '韧性关注',
      value:
        consumerContract.governance.summary.degradedSignals +
        consumerContract.governance.summary.attentionRecoveryPlans +
        consumerContract.governance.summary.staleDrills,
      helper: `密钥关注 ${
        consumerContract.governance.summary.rotationDueSecrets +
        consumerContract.governance.summary.expiredSecrets +
        consumerContract.governance.summary.expiringCertificates +
        consumerContract.governance.summary.expiredCertificates
      }`
    }
  ];
  const topRisks = consumerContract.governance.topRisks.slice(0, 3);
  const ledger = buildMiniappLedger(submitHistory);
  const submitTicket = submitOutcome ? createMiniappActionTicket(submitOutcome) : null;
  const handlerSync = submitOutcome ? buildMiniappHandlerSyncContract(submitOutcome) : null;
  const latestReplayRequest = ledger[0] ? createMiniappReplayRequest(ledger[0]) : null;
  const authEnvelope = handlerSync ? buildMiniappAuthEnvelope(handlerSync) : null;
  const callbackReceipt = submitOutcome && handlerSync ? createMiniappCallbackReceipt(submitOutcome, handlerSync) : null;
  const retryPolicy = ledger[0] && replayOutcome ? createMiniappReplayRetryPolicy(ledger[0], replayOutcome) : null;

  async function syncGovernanceContract() {
    const contract = await loadMiniappRuntimeConsumerContract();
    setConsumerContract(contract);
    setGovernanceAlerts(contract.governance.alerts);
    setGovernanceGeneratedAt(contract.governance.generatedAt);
  }

  useEffect(() => {
    let cancelled = false;

    loadMiniappRuntimeConsumerContract().then((contract) => {
      if (!cancelled) {
        setConsumerContract(contract);
        setGovernanceAlerts(contract.governance.alerts);
        setGovernanceGeneratedAt(contract.governance.generatedAt);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={{ padding: '32px', color: '#e2e8f0', background: '#020617', minHeight: '100vh' }}>
      <Text>
        M5 门店小程序骨架已就位，当前市场为 {bootstrap.marketCode}，交付模式为 {bootstrap.deliveryMode}，后续按 tenant /
        brand / store / market 承接会员中心、预约、活动和营销触达。
      </Text>
      <View style={{ marginTop: '16px' }}>
        <Text>默认语言：{bootstrap.defaultLanguage}</Text>
      </View>
      <View style={{ marginTop: '8px' }}>
        <Text>支持语言：{bootstrap.supportedLanguages.join(' / ')}</Text>
      </View>
      <View style={{ marginTop: '8px' }}>
        <Text>语言策略：{formatMiniappLocaleSummary(bootstrap)}</Text>
      </View>
      <View style={{ marginTop: '8px' }}>
        <Text>分享策略：{formatMiniappSharePolicySummary(bootstrap)}</Text>
      </View>
      <View style={{ marginTop: '8px' }}>
        <Text>门店域名：{bootstrap.primaryDomain}</Text>
      </View>
      <View style={{ marginTop: '8px' }}>
        <Text>域名来源：{bootstrap.domainSource}</Text>
      </View>
      <View style={{ marginTop: '8px' }}>
        <Text>
          当前会员态：{session.memberTier} / {session.authenticated ? '已登录' : '未登录'}
        </Text>
      </View>
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
        <Text>Governance：{(governanceAlerts.length > 0 ? governanceAlerts : consumerContract.governance.alerts).map((item) => item.code).join(' / ')}</Text>
      </View>
      <View style={{ marginTop: '8px' }}>
        <Text>当前告警焦点：{selectedAlertCode}</Text>
      </View>
      <View
        style={{
          marginTop: '20px',
          padding: '16px',
          borderRadius: '16px',
          background: domainGovernance.requiresAttention ? 'rgba(127, 29, 29, 0.35)' : 'rgba(15, 23, 42, 0.45)'
        }}
      >
        <Text>
          域名治理摘要：缺主 scope {domainGovernance.totalMissingPrimaryScopes} / 活跃未设主域名{' '}
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
          setRuntimeReceipt(null);
        }}>模拟游客态</Button>
        <Button onClick={() => {
          setSession(createMemberSession());
          setSubmitOutcome(null);
          setRuntimeReceipt(null);
        }}>模拟普通会员</Button>
        <Button onClick={() => {
          setSession(createMemberSession('SVIP'));
          setSubmitOutcome(null);
          setRuntimeReceipt(null);
        }}>模拟 SVIP</Button>
      </View>
      <View style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
        <Button
          onClick={() => {
            setActiveAction('member-login');
            setSubmitOutcome(null);
            setRuntimeReceipt(null);
          }}
        >
          登录挑战
        </Button>
        <Button
          onClick={() => {
            setActiveAction('booking-submit');
            setSubmitOutcome(null);
            setRuntimeReceipt(null);
          }}
        >
          预约提交
        </Button>
        <Button
          onClick={() => {
            setActiveAction('coupon-claim');
            setSubmitOutcome(null);
            setRuntimeReceipt(null);
          }}
        >
          领券前校验
        </Button>
      </View>
      <View style={{ marginTop: '16px', display: 'flex', gap: '12px' }}>
        <Button
          onClick={async () => {
            if (activePlan) {
              const outcome = submitMiniappActionPlan(activePlan);
              const receipt = await submitMiniappActionPlanToApi(activePlan);
              setSubmitOutcome(outcome);
              setSubmitHistory((current) => appendMiniappSubmitHistory(current, outcome));
              setRuntimeReceipt(receipt);
              setRuntimeHistory((current) => [receipt, ...current.filter((item) => item.receiptCode !== receipt.receiptCode)].slice(0, 5));
              setReplayOutcome(null);
            }
          }}
        >
          执行当前动作
        </Button>
        <Button
          onClick={async () => {
            if (runtimeReceipt) {
              const replayed = await replayMiniappRuntimeReceipt(runtimeReceipt);
              setRuntimeReceipt(replayed);
              setRuntimeHistory((current) =>
                [replayed, ...current.filter((item) => item.receiptCode !== replayed.receiptCode)].slice(0, 5)
              );
            }

            const latest = submitHistory[0];
            if (latest && !runtimeReceipt) {
              setReplayOutcome(replayMiniappSubmitHistoryEntry(latest));
            }
          }}
        >
          回放最近记录
        </Button>
        <Button
          onClick={async () => {
            if (!runtimeReceipt) {
              return;
            }

            const synced = await syncMiniappRuntimeReceipt(runtimeReceipt);
            setRuntimeReceipt(synced);
            setRuntimeHistory((current) =>
              [synced, ...current.filter((item) => item.receiptCode !== synced.receiptCode)].slice(0, 5)
            );
          }}
        >
          记录 Handler Sync
        </Button>
        <Button
          onClick={async () => {
            if (!runtimeReceipt) {
              return;
            }

            const callbacked = await recordMiniappRuntimeCallback(runtimeReceipt);
            setRuntimeReceipt(callbacked);
            setRuntimeHistory((current) =>
              [callbacked, ...current.filter((item) => item.receiptCode !== callbacked.receiptCode)].slice(0, 5)
            );
          }}
        >
          写入 Callback
        </Button>
        <Button
          onClick={async () => {
            if (!runtimeReceipt) {
              return;
            }

            const latest = await loadMiniappRuntimeReceipt(runtimeReceipt.receiptCode);
            if (latest) {
              setRuntimeReceipt(latest);
              setRuntimeHistory((current) =>
                [latest, ...current.filter((item) => item.receiptCode !== latest.receiptCode)].slice(0, 5)
              );
            }
          }}
        >
          刷新真实回执
        </Button>
        <Button
          onClick={async () => {
            await syncGovernanceContract();
          }}
        >
          刷新治理告警
        </Button>
      </View>
      <View style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
        {actionPlans.map((plan: MiniappActionPlan) => (
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
              <Text>当前下一步：{plan.decision.nextStep}</Text>
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
          <Text>
            治理状态：{decision.bootstrapState} / {decision.title}
          </Text>
          <View style={{ marginTop: '8px' }}>
            <Text>{decision.helper}</Text>
          </View>
          <View style={{ marginTop: '8px' }}>
            <Text>下一步：{decision.nextStep}</Text>
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
      {runtimeReceipt ? (
        <View
          style={{
            marginTop: '20px',
            padding: '16px',
            borderRadius: '16px',
            background: 'rgba(14, 116, 144, 0.4)'
          }}
        >
          <Text>
            真实 Runtime 回执：{runtimeReceipt.state} / {runtimeReceipt.generatedAt === 'local-fallback' ? 'fallback' : 'api'}
          </Text>
          <View style={{ marginTop: '8px' }}>
            <Text>回执：{runtimeReceipt.receiptCode} / 动作 {runtimeReceipt.action}</Text>
          </View>
          <View style={{ marginTop: '8px' }}>
            <Text>入口：{runtimeReceipt.requestEndpoint} / 下一步 {runtimeReceipt.nextStep}</Text>
          </View>
          <View style={{ marginTop: '8px' }}>
            <Text>建议动作：{runtimeReceipt.recommendedAction} / 风险 {runtimeReceipt.riskLevel}</Text>
          </View>
          <View style={{ marginTop: '8px' }}>
            <Text>事件：{runtimeReceipt.events.map((item) => item.eventType).join(' / ')}</Text>
          </View>
          <View style={{ marginTop: '8px' }}>
            <Text>Sync：{runtimeReceipt.sync.handlerName} / {runtimeReceipt.sync.ready ? 'ready' : 'pending'}</Text>
          </View>
          <View style={{ marginTop: '8px' }}>
            <Text>Callback：{runtimeReceipt.callback.callbackStatus} / Ack {runtimeReceipt.callback.ackToken}</Text>
          </View>
        </View>
      ) : null}
      <View
        style={{
          marginTop: '20px',
          padding: '16px',
          borderRadius: '16px',
          background: 'rgba(30, 41, 59, 0.55)'
        }}
      >
        <Text>治理告警目录：{governanceGeneratedAt}</Text>
        <View style={{ marginTop: '8px' }}>
          <Text>{(governanceAlerts.length > 0 ? governanceAlerts : consumerContract.governance.alerts).map((item) => item.code).join(' / ')}</Text>
        </View>
        <View style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
          {overviewStats.map((item) => (
            <View key={item.label} style={{ padding: '12px', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.3)' }}>
              <Text>{item.label} / {item.value}</Text>
              <Text>{item.helper}</Text>
            </View>
          ))}
        </View>
        <View style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
          {topRisks.map((item) => (
            <View key={`${item.code}-risk`} style={{ padding: '12px', borderRadius: '12px', background: 'rgba(30, 41, 59, 0.45)' }}>
              <Text>{item.code} / {item.count} 件 / {item.triageState ?? 'needs-triage'}</Text>
              <Text>{item.triageSummary ?? item.summary}</Text>
              <Text>责任人：{item.recentOperation?.actorId ?? item.acknowledgement?.actorId ?? '系统'}</Text>
            </View>
          ))}
        </View>
        <View style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
          {(governanceAlerts.length > 0 ? governanceAlerts : consumerContract.governance.alerts).slice(0, 3).map((item) => (
            <View key={`${item.code}-summary`} style={{ padding: '12px', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.3)' }}>
              <Text>{item.code} / {item.defaultSummary}</Text>
              <Text>
                当前：{item.acknowledgement?.status ?? (item.visibleInOverview ? 'VISIBLE' : 'IDLE')} / 最近动作：
                {item.recentOperation ? `${item.recentOperation.action}@${item.recentOperation.createdAt}` : 'none'}
              </Text>
            </View>
          ))}
        </View>
        <View style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
          {(governanceAlerts.length > 0 ? governanceAlerts : consumerContract.governance.alerts).slice(0, 3).map((item) => (
            <Button key={item.code} onClick={() => setSelectedAlertCode(item.code)}>
              聚焦 {item.code}
            </Button>
          ))}
        </View>
        <View style={{ marginTop: '12px', display: 'flex', gap: '12px' }}>
          <Button
            onClick={async () => {
              const detail = await loadMiniappAlertDrilldown(selectedAlertCode);
              setAlertDrilldown(detail);
            }}
          >
            读取 Drilldown
          </Button>
          <Button
            onClick={async () => {
              const mutation = await acknowledgeMiniappGovernanceAlert(selectedAlertCode);
              setAlertMutation(mutation);
              await syncGovernanceContract();
            }}
          >
            Ack 告警
          </Button>
          <Button
            onClick={async () => {
              const mutation = await muteMiniappGovernanceAlert(selectedAlertCode);
              setAlertMutation(mutation);
              await syncGovernanceContract();
            }}
          >
            Mute 告警
          </Button>
          <Button
            onClick={async () => {
              const mutation = await unmuteMiniappGovernanceAlert(selectedAlertCode);
              setAlertMutation(mutation);
              await syncGovernanceContract();
            }}
          >
            取消静默
          </Button>
        </View>
      </View>
      {alertDrilldown ? (
        <View
          style={{
            marginTop: '20px',
            padding: '16px',
            borderRadius: '16px',
            background: 'rgba(67, 56, 202, 0.35)'
          }}
        >
          <Text>Alert Drilldown：{alertDrilldown.code}</Text>
          <View style={{ marginTop: '8px' }}>
            <Text>生成时间：{alertDrilldown.generatedAt}</Text>
          </View>
          <View style={{ marginTop: '8px' }}>
            <Text>摘要：{alertDrilldown.alert?.summary ?? '暂无 alert 摘要'}</Text>
          </View>
          <View style={{ marginTop: '8px' }}>
            <Text>概览可见：{alertDrilldown.visibleInOverview ? '是' : '否'}</Text>
          </View>
          <View style={{ marginTop: '8px' }}>
            <Text>可用动作：{(alertDrilldown.availableActions ?? []).join(' / ') || 'none'}</Text>
          </View>
          <View style={{ marginTop: '8px' }}>
            <Text>时间线：{(alertDrilldown.history ?? []).map((item) => `${item.action}@${item.createdAt}`).join(' | ') || 'none'}</Text>
          </View>
          <View style={{ marginTop: '8px' }}>
            <Text>详情：{JSON.stringify(alertDrilldown.detail ?? {})}</Text>
          </View>
        </View>
      ) : null}
      {alertMutation ? (
        <View
          style={{
            marginTop: '20px',
            padding: '16px',
            borderRadius: '16px',
            background: 'rgba(22, 101, 52, 0.35)'
          }}
        >
          <Text>Alert Acknowledgement：{alertMutation.code}</Text>
          <View style={{ marginTop: '8px' }}>
            <Text>状态：{alertMutation.acknowledgement?.status ?? 'unknown'}</Text>
          </View>
          <View style={{ marginTop: '8px' }}>
            <Text>备注：{alertMutation.acknowledgement?.note ?? 'none'}</Text>
          </View>
          <View style={{ marginTop: '8px' }}>
            <Text>概览可见：{alertMutation.visibleInOverview ? '是' : '否'}</Text>
          </View>
          <View style={{ marginTop: '8px' }}>
            <Text>可用动作：{(alertMutation.availableActions ?? []).join(' / ') || 'none'}</Text>
          </View>
          <View style={{ marginTop: '8px' }}>
            <Text>最新轨迹：{(alertMutation.history ?? []).map((item) => `${item.action}@${item.createdAt}`).join(' | ') || 'none'}</Text>
          </View>
        </View>
      ) : null}
      {runtimeHistory.length > 0 ? (
        <View style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
          {runtimeHistory.map((entry) => (
            <View
              key={`runtime-${entry.receiptCode}`}
              style={{ padding: '16px', borderRadius: '16px', background: 'rgba(8, 47, 73, 0.45)' }}
            >
              <Text>真实历史：{entry.action} / {entry.state}</Text>
              <View style={{ marginTop: '8px' }}>
                <Text>回执：{entry.receiptCode}</Text>
              </View>
              <View style={{ marginTop: '8px' }}>
                <Text>事件数：{entry.events.length} / Retry {entry.retry.currentAttempt}/{entry.retry.maxAttempts}</Text>
              </View>
            </View>
          ))}
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
