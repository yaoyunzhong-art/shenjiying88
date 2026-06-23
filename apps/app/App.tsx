import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Button, SafeAreaView, Text, View } from 'react-native';
import type {
  FoundationAlertCatalogItem,
  FoundationAlertDrilldownResponse,
  FoundationAlertMutationResponse,
  RuntimeGovernanceReceipt
} from '@m5/types';
import {
  appMarketBootstrap,
  appendNativeAppSubmitHistory,
  acknowledgeNativeAppGovernanceAlert,
  buildNativeAppAuthEnvelope,
  buildNativeAppLedger,
  buildNativeAppHandlerSyncContract,
  createNativeAppCallbackReceipt,
  createNativeAppActionTicket,
  createNativeAppReplayRequest,
  createNativeAppReplayRetryPolicy,
  createGuestNativeSession,
  createNativeAppRuntimeConsumerContract,
  createNativeSession,
  executeNativeAppTransactionFlow,
  loadNativeAppAlertDrilldown,
  loadNativeAppRuntimeReceipt,
  listNativeAppActionPlans,
  loadNativeAppRuntimeConsumerContract,
  muteNativeAppGovernanceAlert,
  recordNativeAppRuntimeCallback,
  replayNativeAppRuntimeReceipt,
  replayNativeAppSubmitHistoryEntry,
  requestNativeAppRefundToApi,
  syncNativeAppRuntimeReceipt,
  submitNativeAppActionPlanToApi,
  submitNativeAppActionPlan,
  unmuteNativeAppGovernanceAlert,
  type NativeAppActionKey,
  type NativeAppActionPlan,
  type NativeAppReplayOutcome,
  type NativeAppRuntimeConsumerContract
} from './market-bootstrap';
import type {
  NativeAppLedgerRecord,
  NativeAppSession,
  NativeAppTransactionRuntimeSnapshot,
  NativeAppSubmitHistoryEntry,
  NativeAppSubmitOutcome
} from './market-bootstrap';

export default function App() {
  const [consumerContract, setConsumerContract] = useState<NativeAppRuntimeConsumerContract>(
    createNativeAppRuntimeConsumerContract(appMarketBootstrap)
  );
  const [session, setSession] = useState<NativeAppSession>(createGuestNativeSession());
  const [activeAction, setActiveAction] = useState<NativeAppActionKey>('member-login');
  const [submitOutcome, setSubmitOutcome] = useState<NativeAppSubmitOutcome | null>(null);
  const [submitHistory, setSubmitHistory] = useState<NativeAppSubmitHistoryEntry[]>([]);
  const [replayOutcome, setReplayOutcome] = useState<NativeAppReplayOutcome | null>(null);
  const [runtimeReceipt, setRuntimeReceipt] = useState<RuntimeGovernanceReceipt | null>(null);
  const [runtimeHistory, setRuntimeHistory] = useState<RuntimeGovernanceReceipt[]>([]);
  const [governanceAlerts, setGovernanceAlerts] = useState<FoundationAlertCatalogItem[]>([]);
  const [governanceGeneratedAt, setGovernanceGeneratedAt] = useState('bootstrap');
  const [selectedAlertCode, setSelectedAlertCode] = useState<FoundationAlertCatalogItem['code']>('approvals-pending');
  const [alertDrilldown, setAlertDrilldown] = useState<FoundationAlertDrilldownResponse | null>(null);
  const [alertMutation, setAlertMutation] = useState<FoundationAlertMutationResponse | null>(null);
  const [transactionRuntime, setTransactionRuntime] = useState<NativeAppTransactionRuntimeSnapshot | null>(null);
  const bootstrap = consumerContract.snapshot;
  const actionPlans = listNativeAppActionPlans(bootstrap, session);
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
  const ledger = buildNativeAppLedger(submitHistory);
  const submitTicket = submitOutcome ? createNativeAppActionTicket(submitOutcome) : null;
  const handlerSync = submitOutcome ? buildNativeAppHandlerSyncContract(submitOutcome) : null;
  const latestReplayRequest = ledger[0] ? createNativeAppReplayRequest(ledger[0]) : null;
  const authEnvelope = handlerSync ? buildNativeAppAuthEnvelope(handlerSync) : null;
  const callbackReceipt = submitOutcome && handlerSync ? createNativeAppCallbackReceipt(submitOutcome, handlerSync) : null;
  const retryPolicy = ledger[0] && replayOutcome ? createNativeAppReplayRetryPolicy(ledger[0], replayOutcome) : null;

  async function syncGovernanceContract() {
    const contract = await loadNativeAppRuntimeConsumerContract();
    setConsumerContract(contract);
    setGovernanceAlerts(contract.governance.alerts);
    setGovernanceGeneratedAt(contract.governance.generatedAt);
  }

  useEffect(() => {
    let cancelled = false;

    loadNativeAppRuntimeConsumerContract().then((contract) => {
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#020617' }}>
      <StatusBar style="light" />
      <View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
        <Text style={{ color: '#f8fafc', fontSize: 28, fontWeight: '700' }}>M5 App</Text>
        <Text style={{ color: '#94a3b8', marginTop: 12, fontSize: 16 }}>
          React Native 门店 App 骨架已准备，当前市场为 {bootstrap.marketCode}，交付模式为 {bootstrap.deliveryMode}，
          后续可按门店上下文接导航、登录、会员中心、设备能力与深度服务。
        </Text>
        <Text style={{ color: '#cbd5e1', marginTop: 12, fontSize: 15 }}>默认语言：{bootstrap.defaultLanguage}</Text>
        <Text style={{ color: '#cbd5e1', marginTop: 8, fontSize: 15 }}>邮箱通道：{bootstrap.emailProvider}</Text>
        <Text style={{ color: '#cbd5e1', marginTop: 8, fontSize: 15 }}>门店域名：{bootstrap.primaryDomain}</Text>
        <Text style={{ color: '#cbd5e1', marginTop: 8, fontSize: 15 }}>
          支持端：{bootstrap.supportedSurfaces.join(' / ')}
        </Text>
        <Text style={{ color: '#cbd5e1', marginTop: 8, fontSize: 15 }}>
          当前会员态：{session.memberTier} / {session.authenticated ? '已登录' : '未登录'}
        </Text>
        <Text style={{ color: '#cbd5e1', marginTop: 8, fontSize: 15 }}>
          MemberId：{session.memberId ?? 'guest'}
        </Text>
        <Text style={{ color: '#cbd5e1', marginTop: 8, fontSize: 15 }}>
          Scope：{consumerContract.scope.scopePath} / {consumerContract.scope.mismatchStrategy}
        </Text>
        <Text style={{ color: '#cbd5e1', marginTop: 8, fontSize: 15 }}>
          降级：{consumerContract.degradation.featureFlagFallback} / 脱敏：{consumerContract.degradation.desensitizationMode}
        </Text>
        <Text style={{ color: '#cbd5e1', marginTop: 8, fontSize: 15 }}>
          挑战：{consumerContract.challenge.enforcement}
        </Text>
        <Text style={{ color: '#93c5fd', marginTop: 8, fontSize: 15 }}>
          Governance：{(governanceAlerts.length > 0 ? governanceAlerts : consumerContract.governance.alerts).map((item) => item.code).join(' / ')}
        </Text>
        <Text style={{ color: '#cbd5e1', marginTop: 8, fontSize: 15 }}>当前告警焦点：{selectedAlertCode}</Text>
        <View style={{ marginTop: 16, gap: 10 }}>
          <Button
            title="切回游客"
            onPress={() => {
              setSession(createGuestNativeSession());
              setSubmitOutcome(null);
              setRuntimeReceipt(null);
              setTransactionRuntime(null);
            }}
          />
          <Button
            title="模拟普通会员"
            onPress={() => {
              setSession(createNativeSession());
              setSubmitOutcome(null);
              setRuntimeReceipt(null);
              setTransactionRuntime(null);
            }}
          />
          <Button
            title="模拟 SVIP"
            onPress={() => {
              setSession(createNativeSession('SVIP'));
              setSubmitOutcome(null);
              setRuntimeReceipt(null);
              setTransactionRuntime(null);
            }}
          />
        </View>
        <View style={{ marginTop: 16, gap: 10 }}>
          <Button
            title="登录挑战"
            onPress={() => {
              setActiveAction('member-login');
              setSubmitOutcome(null);
              setRuntimeReceipt(null);
            }}
          />
          <Button
            title="设备绑定校验"
            onPress={() => {
              setActiveAction('device-bind');
              setSubmitOutcome(null);
              setRuntimeReceipt(null);
            }}
          />
          <Button
            title="支付前校验"
            onPress={() => {
              setActiveAction('payment-submit');
              setSubmitOutcome(null);
              setRuntimeReceipt(null);
            }}
          />
        </View>
        <View style={{ marginTop: 16, gap: 10 }}>
          <Button
            title="执行当前动作"
            onPress={async () => {
              if (activePlan) {
                const outcome = submitNativeAppActionPlan(activePlan);
                const receipt = await submitNativeAppActionPlanToApi(activePlan);
                setSubmitOutcome(outcome);
                setSubmitHistory((current) => appendNativeAppSubmitHistory(current, outcome));
                setRuntimeReceipt(receipt);
                setRuntimeHistory((current) => [receipt, ...current.filter((item) => item.receiptCode !== receipt.receiptCode)].slice(0, 5));
                setReplayOutcome(null);
              }
            }}
          />
          <Button
            title="回放最近记录"
            onPress={async () => {
              if (runtimeReceipt) {
                const replayed = await replayNativeAppRuntimeReceipt(runtimeReceipt);
                setRuntimeReceipt(replayed);
                setRuntimeHistory((current) =>
                  [replayed, ...current.filter((item) => item.receiptCode !== replayed.receiptCode)].slice(0, 5)
                );
              }

              const latest = submitHistory[0];
              if (latest && !runtimeReceipt) {
                setReplayOutcome(replayNativeAppSubmitHistoryEntry(latest));
              }
            }}
          />
          <Button
            title="记录 Handler Sync"
            onPress={async () => {
              if (!runtimeReceipt) {
                return;
              }

              const synced = await syncNativeAppRuntimeReceipt(runtimeReceipt);
              setRuntimeReceipt(synced);
              setRuntimeHistory((current) =>
                [synced, ...current.filter((item) => item.receiptCode !== synced.receiptCode)].slice(0, 5)
              );
            }}
          />
          <Button
            title="写入 Callback"
            onPress={async () => {
              if (!runtimeReceipt) {
                return;
              }

              const callbacked = await recordNativeAppRuntimeCallback(runtimeReceipt);
              setRuntimeReceipt(callbacked);
              setRuntimeHistory((current) =>
                [callbacked, ...current.filter((item) => item.receiptCode !== callbacked.receiptCode)].slice(0, 5)
              );
            }}
          />
          <Button
            title="刷新真实回执"
            onPress={async () => {
              if (!runtimeReceipt) {
                return;
              }

              const latest = await loadNativeAppRuntimeReceipt(runtimeReceipt.receiptCode);
              if (latest) {
                setRuntimeReceipt(latest);
                setRuntimeHistory((current) =>
                  [latest, ...current.filter((item) => item.receiptCode !== latest.receiptCode)].slice(0, 5)
                );
              }
            }}
          />
          <Button
            title="刷新治理告警"
            onPress={async () => {
              await syncGovernanceContract();
            }}
          />
          <Button
            title="执行真实交易闭环"
            onPress={async () => {
              const runtime = await executeNativeAppTransactionFlow(bootstrap, session);
              setTransactionRuntime(runtime);
            }}
          />
          <Button
            title="申请真实退款"
            onPress={async () => {
              if (!transactionRuntime?.aggregate) {
                return;
              }

              const refunded = await requestNativeAppRefundToApi(transactionRuntime);
              setTransactionRuntime(refunded);
            }}
          />
        </View>
        <View style={{ marginTop: 16, gap: 10 }}>
          {actionPlans.map((plan: NativeAppActionPlan) => (
            <View
              key={plan.action}
              style={{
                padding: 16,
                borderRadius: 16,
                backgroundColor:
                  activeAction === plan.action ? 'rgba(30, 41, 59, 0.92)' : 'rgba(15, 23, 42, 0.65)'
              }}
            >
              <Text style={{ color: '#f8fafc', fontSize: 15, fontWeight: '600' }}>
                {plan.label} / 风险 {plan.riskLevel} / 通道 {plan.channel}
              </Text>
              <Text style={{ color: '#cbd5e1', marginTop: 8 }}>{plan.draftSummary}</Text>
              <Text style={{ color: '#93c5fd', marginTop: 8 }}>当前下一步：{plan.decision.nextStep}</Text>
              <Text style={{ color: '#cbd5e1', marginTop: 8 }}>
                请求预览：{plan.requestPreview.method} {plan.requestPreview.endpoint}
              </Text>
            </View>
          ))}
        </View>
        {decision ? (
          <View
            style={{
              marginTop: 20,
              padding: 16,
              borderRadius: 16,
              backgroundColor: 'rgba(15, 23, 42, 0.65)'
            }}
          >
            <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: '600' }}>{decision.title}</Text>
            <Text style={{ color: '#cbd5e1', marginTop: 8 }}>状态：{decision.bootstrapState}</Text>
            <Text style={{ color: '#cbd5e1', marginTop: 8 }}>{decision.helper}</Text>
            <Text style={{ color: '#93c5fd', marginTop: 8 }}>下一步：{decision.nextStep}</Text>
            {activePlan ? (
              <Text style={{ color: '#cbd5e1', marginTop: 8 }}>执行清单：{activePlan.checklist.join(' / ')}</Text>
            ) : null}
            {activePlan ? (
              <Text style={{ color: '#cbd5e1', marginTop: 8 }}>
                Payload：{JSON.stringify(activePlan.requestPreview.payload)}
              </Text>
            ) : null}
          </View>
        ) : null}
        {runtimeReceipt ? (
          <View
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 16,
              backgroundColor: 'rgba(14, 116, 144, 0.4)'
            }}
          >
            <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: '600' }}>
              真实 Runtime 回执：{runtimeReceipt.state} / {runtimeReceipt.generatedAt === 'local-fallback' ? 'fallback' : 'api'}
            </Text>
            <Text style={{ color: '#cbd5e1', marginTop: 8 }}>
              回执：{runtimeReceipt.receiptCode} / 动作 {runtimeReceipt.action}
            </Text>
            <Text style={{ color: '#93c5fd', marginTop: 8 }}>
              入口：{runtimeReceipt.requestEndpoint} / 下一步 {runtimeReceipt.nextStep}
            </Text>
            <Text style={{ color: '#cbd5e1', marginTop: 8 }}>
              建议动作：{runtimeReceipt.recommendedAction} / 风险 {runtimeReceipt.riskLevel}
            </Text>
            <Text style={{ color: '#cbd5e1', marginTop: 8 }}>
              事件：{runtimeReceipt.events.map((item) => item.eventType).join(' / ')}
            </Text>
            <Text style={{ color: '#cbd5e1', marginTop: 8 }}>
              Sync：{runtimeReceipt.sync.handlerName} / {runtimeReceipt.sync.ready ? 'ready' : 'pending'}
            </Text>
            <Text style={{ color: '#93c5fd', marginTop: 8 }}>
              Callback：{runtimeReceipt.callback.callbackStatus} / Ack {runtimeReceipt.callback.ackToken}
            </Text>
          </View>
        ) : null}
        {transactionRuntime?.aggregate ? (
          <View
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 16,
              backgroundColor:
                transactionRuntime.deliveryMode === 'api'
                  ? 'rgba(22, 101, 52, 0.35)'
                  : 'rgba(120, 53, 15, 0.35)'
            }}
          >
            <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: '600' }}>
              真实交易聚合：{transactionRuntime.aggregate.order.orderId} / {transactionRuntime.deliveryMode}
            </Text>
            <Text style={{ color: '#cbd5e1', marginTop: 8 }}>{transactionRuntime.note}</Text>
            <Text style={{ color: '#93c5fd', marginTop: 8 }}>
              订单：{transactionRuntime.aggregate.order.status} / 金额 {transactionRuntime.aggregate.order.totalAmount}{' '}
              {transactionRuntime.aggregate.order.currency}
            </Text>
            <Text style={{ color: '#cbd5e1', marginTop: 8 }}>
              支付：{transactionRuntime.aggregate.payment?.status ?? 'NONE'} / 通道{' '}
              {transactionRuntime.aggregate.payment?.channel ?? 'N/A'} / 交易号{' '}
              {transactionRuntime.aggregate.payment?.transactionNo ?? 'pending'}
            </Text>
            <Text style={{ color: '#cbd5e1', marginTop: 8 }}>
              退款：{transactionRuntime.aggregate.refunds.length} 笔 / 最近状态{' '}
              {transactionRuntime.aggregate.refunds[0]?.status ?? 'NONE'}
            </Text>
            <Text style={{ color: '#cbd5e1', marginTop: 8 }}>
              权益：积分流水 {transactionRuntime.aggregate.pointsLedger.length} / 券核销{' '}
              {transactionRuntime.aggregate.couponRedemptions.length} / 盲盒履约{' '}
              {transactionRuntime.aggregate.blindboxFulfillments.length}
            </Text>
            <Text style={{ color: '#93c5fd', marginTop: 8 }}>
              Checkout：{transactionRuntime.checkoutPayload.paymentChannel} / Member{' '}
              {transactionRuntime.checkoutPayload.memberId}
            </Text>
            {transactionRuntime.paymentCallback ? (
              <Text style={{ color: '#93c5fd', marginTop: 8 }}>
                Callback：{transactionRuntime.paymentCallback.standardizedEventName} /{' '}
                {transactionRuntime.paymentCallback.orderId}
              </Text>
            ) : null}
            {transactionRuntime.refundPayload ? (
              <Text style={{ color: '#93c5fd', marginTop: 8 }}>
                Refund：{transactionRuntime.refundPayload.reason} / 金额{' '}
                {transactionRuntime.refundPayload.refundAmount ?? 'AUTO'}
              </Text>
            ) : null}
          </View>
        ) : null}
        <View
          style={{
            marginTop: 16,
            padding: 16,
            borderRadius: 16,
            backgroundColor: 'rgba(30, 41, 59, 0.55)'
          }}
        >
          <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: '600' }}>治理告警目录：{governanceGeneratedAt}</Text>
          <Text style={{ color: '#cbd5e1', marginTop: 8 }}>
            {(governanceAlerts.length > 0 ? governanceAlerts : consumerContract.governance.alerts).map((item) => item.code).join(' / ')}
          </Text>
          <View style={{ marginTop: 12, gap: 10 }}>
            {overviewStats.map((item) => (
              <View key={item.label} style={{ padding: 12, borderRadius: 12, backgroundColor: 'rgba(15, 23, 42, 0.3)' }}>
                <Text style={{ color: '#f8fafc' }}>{item.label} / {item.value}</Text>
                <Text style={{ color: '#cbd5e1', marginTop: 6 }}>{item.helper}</Text>
              </View>
            ))}
          </View>
          <View style={{ marginTop: 12, gap: 10 }}>
            {topRisks.map((item) => (
              <View key={`${item.code}-risk`} style={{ padding: 12, borderRadius: 12, backgroundColor: 'rgba(30, 41, 59, 0.45)' }}>
                <Text style={{ color: '#f8fafc' }}>{item.code} / {item.count} 件 / {item.triageState ?? 'needs-triage'}</Text>
                <Text style={{ color: '#93c5fd', marginTop: 6 }}>{item.triageSummary ?? item.summary}</Text>
                <Text style={{ color: '#cbd5e1', marginTop: 6 }}>
                  责任人：{item.recentOperation?.actorId ?? item.acknowledgement?.actorId ?? '系统'}
                </Text>
              </View>
            ))}
          </View>
          <View style={{ marginTop: 12, gap: 10 }}>
            {(governanceAlerts.length > 0 ? governanceAlerts : consumerContract.governance.alerts).slice(0, 3).map((item) => (
              <View key={`${item.code}-summary`} style={{ padding: 12, borderRadius: 12, backgroundColor: 'rgba(15, 23, 42, 0.3)' }}>
                <Text style={{ color: '#f8fafc' }}>{item.code} / {item.defaultSummary}</Text>
                <Text style={{ color: '#cbd5e1', marginTop: 6 }}>
                  当前：{item.acknowledgement?.status ?? (item.visibleInOverview ? 'VISIBLE' : 'IDLE')} / 最近动作：
                  {item.recentOperation ? `${item.recentOperation.action}@${item.recentOperation.createdAt}` : 'none'}
                </Text>
              </View>
            ))}
          </View>
          <View style={{ marginTop: 12, gap: 10 }}>
            {(governanceAlerts.length > 0 ? governanceAlerts : consumerContract.governance.alerts).slice(0, 3).map((item) => (
              <Button key={item.code} title={`聚焦 ${item.code}`} onPress={() => setSelectedAlertCode(item.code)} />
            ))}
          </View>
          <View style={{ marginTop: 12, gap: 10 }}>
            <Button
              title="读取 Drilldown"
              onPress={async () => {
                const detail = await loadNativeAppAlertDrilldown(selectedAlertCode);
                setAlertDrilldown(detail);
              }}
            />
            <Button
              title="Ack 告警"
              onPress={async () => {
                const mutation = await acknowledgeNativeAppGovernanceAlert(selectedAlertCode);
                setAlertMutation(mutation);
                await syncGovernanceContract();
              }}
            />
            <Button
              title="Mute 告警"
              onPress={async () => {
                const mutation = await muteNativeAppGovernanceAlert(selectedAlertCode);
                setAlertMutation(mutation);
                await syncGovernanceContract();
              }}
            />
            <Button
              title="取消静默"
              onPress={async () => {
                const mutation = await unmuteNativeAppGovernanceAlert(selectedAlertCode);
                setAlertMutation(mutation);
                await syncGovernanceContract();
              }}
            />
          </View>
        </View>
        {alertDrilldown ? (
          <View
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 16,
              backgroundColor: 'rgba(67, 56, 202, 0.35)'
            }}
          >
            <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: '600' }}>Alert Drilldown：{alertDrilldown.code}</Text>
            <Text style={{ color: '#cbd5e1', marginTop: 8 }}>生成时间：{alertDrilldown.generatedAt}</Text>
            <Text style={{ color: '#cbd5e1', marginTop: 8 }}>
              摘要：{alertDrilldown.alert?.summary ?? '暂无 alert 摘要'}
            </Text>
            <Text style={{ color: '#cbd5e1', marginTop: 8 }}>
              概览可见：{alertDrilldown.visibleInOverview ? '是' : '否'}
            </Text>
            <Text style={{ color: '#93c5fd', marginTop: 8 }}>
              可用动作：{(alertDrilldown.availableActions ?? []).join(' / ') || 'none'}
            </Text>
            <Text style={{ color: '#93c5fd', marginTop: 8 }}>
              时间线：{(alertDrilldown.history ?? []).map((item) => `${item.action}@${item.createdAt}`).join(' | ') || 'none'}
            </Text>
            <Text style={{ color: '#93c5fd', marginTop: 8 }}>详情：{JSON.stringify(alertDrilldown.detail ?? {})}</Text>
          </View>
        ) : null}
        {alertMutation ? (
          <View
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 16,
              backgroundColor: 'rgba(22, 101, 52, 0.35)'
            }}
          >
            <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: '600' }}>Alert Acknowledgement：{alertMutation.code}</Text>
            <Text style={{ color: '#cbd5e1', marginTop: 8 }}>
              状态：{alertMutation.acknowledgement?.status ?? 'unknown'}
            </Text>
            <Text style={{ color: '#93c5fd', marginTop: 8 }}>
              备注：{alertMutation.acknowledgement?.note ?? 'none'}
            </Text>
            <Text style={{ color: '#cbd5e1', marginTop: 8 }}>
              概览可见：{alertMutation.visibleInOverview ? '是' : '否'}
            </Text>
            <Text style={{ color: '#93c5fd', marginTop: 8 }}>
              可用动作：{(alertMutation.availableActions ?? []).join(' / ') || 'none'}
            </Text>
            <Text style={{ color: '#93c5fd', marginTop: 8 }}>
              最新轨迹：{(alertMutation.history ?? []).map((item) => `${item.action}@${item.createdAt}`).join(' | ') || 'none'}
            </Text>
          </View>
        ) : null}
        {runtimeHistory.length > 0 ? (
          <View style={{ marginTop: 16, gap: 10 }}>
            {runtimeHistory.map((entry) => (
              <View
                key={`runtime-${entry.receiptCode}`}
                style={{ padding: 16, borderRadius: 16, backgroundColor: 'rgba(8, 47, 73, 0.45)' }}
              >
                <Text style={{ color: '#f8fafc', fontSize: 15, fontWeight: '600' }}>
                  真实历史：{entry.action} / {entry.state}
                </Text>
                <Text style={{ color: '#cbd5e1', marginTop: 8 }}>回执：{entry.receiptCode}</Text>
                <Text style={{ color: '#93c5fd', marginTop: 8 }}>
                  事件数：{entry.events.length} / Retry {entry.retry.currentAttempt}/{entry.retry.maxAttempts}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        {submitOutcome ? (
          <View
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 16,
              backgroundColor: 'rgba(8, 47, 73, 0.65)'
            }}
          >
            <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: '600' }}>提交结果：{submitOutcome.state}</Text>
            <Text style={{ color: '#cbd5e1', marginTop: 8 }}>{submitOutcome.message}</Text>
            <Text style={{ color: '#93c5fd', marginTop: 8 }}>
              提交入口：{submitOutcome.endpoint} / 下一步 {submitOutcome.nextStep}
            </Text>
            <Text style={{ color: '#cbd5e1', marginTop: 8 }}>
              回执：{submitOutcome.receiptCode} / 建议动作 {submitOutcome.recommendedAction}
            </Text>
            <Text style={{ color: '#cbd5e1', marginTop: 8 }}>Payload 摘要：{submitOutcome.payloadSummary}</Text>
          </View>
        ) : null}
        {submitTicket ? (
          <View
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 16,
              backgroundColor: 'rgba(51, 65, 85, 0.65)'
            }}
          >
            <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: '600' }}>
              Ticket：{submitTicket.ticketType} / {submitTicket.status}
            </Text>
            <Text style={{ color: '#cbd5e1', marginTop: 8 }}>{submitTicket.summary}</Text>
            <Text style={{ color: '#93c5fd', marginTop: 8 }}>票据编码：{submitTicket.ticketCode}</Text>
          </View>
        ) : null}
        {handlerSync ? (
          <View
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 16,
              backgroundColor: 'rgba(12, 74, 110, 0.5)'
            }}
          >
            <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: '600' }}>
              Handler Sync：{handlerSync.handlerName}
            </Text>
            <Text style={{ color: '#cbd5e1', marginTop: 8 }}>{handlerSync.summary}</Text>
            <Text style={{ color: '#93c5fd', marginTop: 8 }}>
              Sync：{handlerSync.syncEndpoint} / Callback：{handlerSync.callbackEndpoint}
            </Text>
            <Text style={{ color: '#cbd5e1', marginTop: 8 }}>
              模式：{handlerSync.syncMode} / 幂等键 {handlerSync.idempotencyKey} / {handlerSync.ready ? '可同步' : '待前置'}
            </Text>
          </View>
        ) : null}
        {authEnvelope ? (
          <View
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 16,
              backgroundColor: 'rgba(22, 101, 52, 0.45)'
            }}
          >
            <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: '600' }}>
              Auth Envelope：{authEnvelope.authScheme}
            </Text>
            <Text style={{ color: '#cbd5e1', marginTop: 8 }}>Audience：{authEnvelope.audience}</Text>
            <Text style={{ color: '#93c5fd', marginTop: 8 }}>Authorization：{authEnvelope.authorization}</Text>
            <Text style={{ color: '#cbd5e1', marginTop: 8 }}>
              Signed：{authEnvelope.signedHeaders.join(' / ')} / 过期 {authEnvelope.expiresAt}
            </Text>
          </View>
        ) : null}
        {callbackReceipt ? (
          <View
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 16,
              backgroundColor: 'rgba(120, 53, 15, 0.45)'
            }}
          >
            <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: '600' }}>
              Callback Receipt：{callbackReceipt.callbackStatus}
            </Text>
            <Text style={{ color: '#cbd5e1', marginTop: 8 }}>{callbackReceipt.summary}</Text>
            <Text style={{ color: '#93c5fd', marginTop: 8 }}>
              Endpoint：{callbackReceipt.callbackEndpoint} / Ack {callbackReceipt.ackToken}
            </Text>
          </View>
        ) : null}
        {submitHistory.length > 0 ? (
          <View style={{ marginTop: 16, gap: 10 }}>
            {submitHistory.map((entry) => (
              <View
                key={entry.receiptCode}
                style={{ padding: 16, borderRadius: 16, backgroundColor: 'rgba(15, 23, 42, 0.65)' }}
              >
                <Text style={{ color: '#f8fafc', fontSize: 15, fontWeight: '600' }}>
                  执行历史：{entry.action} / {entry.state}
                </Text>
                <Text style={{ color: '#cbd5e1', marginTop: 8 }}>{entry.summary}</Text>
                <Text style={{ color: '#93c5fd', marginTop: 8 }}>
                  回执：{entry.receiptCode} / 建议 {entry.recommendedAction}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        {replayOutcome ? (
          <View
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 16,
              backgroundColor: 'rgba(30, 64, 175, 0.35)'
            }}
          >
            <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: '600' }}>回放结果：{replayOutcome.status}</Text>
            <Text style={{ color: '#cbd5e1', marginTop: 8 }}>{replayOutcome.message}</Text>
            <Text style={{ color: '#93c5fd', marginTop: 8 }}>回放入口：{replayOutcome.replayEndpoint}</Text>
          </View>
        ) : null}
        {retryPolicy ? (
          <View
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 16,
              backgroundColor: 'rgba(127, 29, 29, 0.45)'
            }}
          >
            <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: '600' }}>
              Retry Policy：{retryPolicy.retryable ? '可重试' : '人工复核'}
            </Text>
            <Text style={{ color: '#cbd5e1', marginTop: 8 }}>{retryPolicy.summary}</Text>
            <Text style={{ color: '#93c5fd', marginTop: 8 }}>
              次数：{retryPolicy.currentAttempt}/{retryPolicy.maxAttempts} / Backoff {retryPolicy.nextBackoffMs}ms
            </Text>
            <Text style={{ color: '#cbd5e1', marginTop: 8 }}>升级动作：{retryPolicy.escalationAction}</Text>
          </View>
        ) : null}
        {ledger.length > 0 ? (
          <View style={{ marginTop: 16, gap: 10 }}>
            {ledger.map((record: NativeAppLedgerRecord) => (
              <View
                key={record.ledgerKey}
                style={{ padding: 16, borderRadius: 16, backgroundColor: 'rgba(15, 23, 42, 0.65)' }}
              >
                <Text style={{ color: '#f8fafc', fontSize: 15, fontWeight: '600' }}>
                  Ledger：{record.action} / {record.state}
                </Text>
                <Text style={{ color: '#cbd5e1', marginTop: 8 }}>{record.summary}</Text>
                <Text style={{ color: '#93c5fd', marginTop: 8 }}>
                  Key：{record.ledgerKey} / 回放 {record.replayable ? '可用' : '受限'}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        {latestReplayRequest ? (
          <View
            style={{
              marginTop: 16,
              padding: 16,
              borderRadius: 16,
              backgroundColor: 'rgba(67, 56, 202, 0.35)'
            }}
          >
            <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: '600' }}>
              Replay Request：{latestReplayRequest.method} {latestReplayRequest.endpoint}
            </Text>
            <Text style={{ color: '#cbd5e1', marginTop: 8 }}>
              Headers：{JSON.stringify(latestReplayRequest.headers)}
            </Text>
            <Text style={{ color: '#cbd5e1', marginTop: 8 }}>
              Body：{JSON.stringify(latestReplayRequest.body)}
            </Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  )
}
