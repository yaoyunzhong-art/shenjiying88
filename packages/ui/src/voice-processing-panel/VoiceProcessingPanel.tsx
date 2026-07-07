/**
 * Phase 102 语音处理 面板 (V11 Sprint 3 Day 44)
 *
 * 4 Tabs: TTS / STT / 声音克隆 / 声纹
 * + 统计面板 + TTS 任务 + STT 任务 + 段落转写 + 克隆列表 + 声纹列表
 */

import React, { useState } from 'react'
import {
  useTtsVoices, useTtsTasks, useSttTasks, useSttSegments,
  useVoiceClones, useVoiceprints, useVoiceStats,
  useCreateTts, useCreateStt, useCloneVoice, useEnrollVoiceprint,
  useCancelTts, useCancelStt,
} from './useVoiceProcessing'
import {
  TTS_ENGINE_LABELS, STT_ENGINE_LABELS, CLONE_ENGINE_LABELS,
  EMOTION_LABELS, EMOTION_COLORS, LANGUAGE_LABELS, GENDER_ICONS,
  STATUS_LABELS, STATUS_COLORS, CLONE_STATUS_LABELS, CLONE_STATUS_COLORS,
  formatAudioTime, formatSeconds, countChars,
  type TtsTask, SttTask, VoiceClone, Voiceprint, TtsVoice, VoiceStats,
  type TtsEngine, SttEngine, VoiceCloningEngine, TtsEmotion, SupportedLanguage,
} from './types'

export interface VoiceProcessingPanelProps {
  variant?: 'pc' | 'h5' | 'app' | 'pad' | 'miniprogram'
  defaultTab?: 'tts' | 'stt' | 'clones' | 'voiceprints'
}

type TabKey = 'tts' | 'stt' | 'clones' | 'voiceprints'

export function VoiceProcessingPanel({ variant = 'pc', defaultTab = 'tts' }: VoiceProcessingPanelProps) {
  const isCompact = variant === 'h5' || variant === 'app' || variant === 'miniprogram'
  const [tab, setTab] = useState<TabKey>(defaultTab)
  const [selectedSttId, setSelectedSttId] = useState<string | undefined>()
  const [showCreateTts, setShowCreateTts] = useState(false)
  const [showCreateStt, setShowCreateStt] = useState(false)
  const [showCreateClone, setShowCreateClone] = useState(false)
  const [showEnrollVp, setShowEnrollVp] = useState(false)

  const { data: voices = [] } = useTtsVoices()
  const { data: ttsTasks = [] } = useTtsTasks({ limit: 50 })
  const { data: sttTasks = [] } = useSttTasks({ limit: 50 })
  const { data: segments = [] } = useSttSegments(selectedSttId ?? null)
  const { data: clones = [] } = useVoiceClones()
  const { data: voiceprints = [] } = useVoiceprints()
  const { data: stats } = useVoiceStats()
  const createTts = useCreateTts()
  const createStt = useCreateStt()
  const cloneVoice = useCloneVoice()
  const enrollVp = useEnrollVoiceprint()
  const cancelTts = useCancelTts()
  const cancelStt = useCancelStt()

  return (
    <div
      data-testid="voice-processing-panel"
      data-variant={variant}
      style={{
        padding: isCompact ? 12 : 20, background: '#f0f2f5', minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: isCompact ? 18 : 22, margin: 0 }}>语音处理</h1>
      </div>

      {/* 统计 */}
      {stats && <StatsPanel stats={stats} isCompact={isCompact} />}

      {/* Tab 切换 */}
      <TabBar active={tab} onChange={setTab} counts={{
        tts: ttsTasks.length, stt: sttTasks.length, clones: clones.length, voiceprints: voiceprints.length,
      }} isCompact={isCompact} />

      {tab === 'tts' && (
        <TtsTab
          voices={voices}
          tasks={ttsTasks}
          showCreate={showCreateTts}
          onToggleCreate={() => setShowCreateTts((v) => !v)}
          onSubmit={(input) => { createTts.mutate(input); setShowCreateTts(false) }}
          onCancel={(id) => cancelTts.mutate(id)}
          isCompact={isCompact}
        />
      )}

      {tab === 'stt' && (
        <SttTab
          tasks={sttTasks}
          segments={segments}
          selectedId={selectedSttId}
          onSelect={setSelectedSttId}
          showCreate={showCreateStt}
          onToggleCreate={() => setShowCreateStt((v) => !v)}
          onSubmit={(input) => { createStt.mutate(input); setShowCreateStt(false) }}
          onCancel={(id) => cancelStt.mutate(id)}
          isCompact={isCompact}
        />
      )}

      {tab === 'clones' && (
        <ClonesTab
          clones={clones}
          showCreate={showCreateClone}
          onToggleCreate={() => setShowCreateClone((v) => !v)}
          onSubmit={(input) => { cloneVoice.mutate(input); setShowCreateClone(false) }}
          isCompact={isCompact}
        />
      )}

      {tab === 'voiceprints' && (
        <VoiceprintsTab
          voiceprints={voiceprints}
          showCreate={showEnrollVp}
          onToggleCreate={() => setShowEnrollVp((v) => !v)}
          onSubmit={(input) => { enrollVp.mutate(input); setShowEnrollVp(false) }}
          isCompact={isCompact}
        />
      )}
    </div>
  )
}

// ============ TabBar ============

interface TabBarProps {
  active: TabKey
  onChange: (k: TabKey) => void
  counts: Record<TabKey, number>
  isCompact: boolean
}
function TabBar({ active, onChange, counts, isCompact }: TabBarProps) {
  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'tts', label: 'TTS 合成' },
    { key: 'stt', label: 'STT 转写' },
    { key: 'clones', label: '声音克隆' },
    { key: 'voiceprints', label: '声纹' },
  ]
  return (
    <div data-testid="vp-tabbar" style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid #d9d9d9' }}>
      {tabs.map((t) => {
        const isActive = active === t.key
        return (
          <button
            key={t.key}
            type="button"
            data-testid={`vp-tab-${t.key}`}
            onClick={() => onChange(t.key)}
            style={{
              padding: isCompact ? '6px 10px' : '8px 16px',
              fontSize: 12, border: 'none', cursor: 'pointer',
              background: 'transparent',
              borderBottom: isActive ? '2px solid #1890ff' : '2px solid transparent',
              color: isActive ? '#1890ff' : '#595959',
              fontWeight: isActive ? 600 : 400,
            }}
          >
            {t.label}
            <span style={{
              marginLeft: 6, padding: '0 6px', fontSize: 10, borderRadius: 8,
              background: '#f0f0f0', color: '#595959',
            }}>{counts[t.key]}</span>
          </button>
        )
      })}
    </div>
  )
}

// ============ StatsPanel ============

function StatsPanel({ stats, isCompact }: { stats: VoiceStats; isCompact: boolean }) {
  return (
    <div data-testid="vp-stats-panel" style={{
      background: '#fff', padding: 16, borderRadius: 8, marginBottom: 16,
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <h3 style={{ fontSize: 13, margin: '0 0 12px' }}>语音处理概览</h3>
      <div style={{ display: 'grid', gridTemplateColumns: isCompact ? 'repeat(2, 1fr)' : 'repeat(6, 1fr)', gap: 12 }}>
        <StatBox label="TTS 任务" value={stats.totalTtsTasks.toString()} testid="vp-stat-tts" />
        <StatBox label="STT 任务" value={stats.totalSttTasks.toString()} testid="vp-stat-stt" />
        <StatBox label="声音克隆" value={stats.totalClones.toString()} testid="vp-stat-clones" />
        <StatBox label="声纹" value={stats.totalVoiceprints.toString()} testid="vp-stat-vps" />
        <StatBox label="总音频时长" value={formatSeconds(stats.totalAudioSec)} testid="vp-stat-audiosec" />
        <StatBox label="总字符" value={stats.totalCharacters.toLocaleString()} testid="vp-stat-chars" />
      </div>
    </div>
  )
}

function StatBox({ label, value, testid }: { label: string; value: string; testid: string }) {
  return (
    <div data-testid={testid} style={{ background: '#fafafa', padding: 10, borderRadius: 6 }}>
      <div style={{ fontSize: 11, color: '#8c8c8c' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4, color: '#262626' }}>{value}</div>
    </div>
  )
}

// ============ TtsTab ============

interface TtsTabProps {
  voices: TtsVoice[]
  tasks: TtsTask[]
  showCreate: boolean
  onToggleCreate: () => void
  onSubmit: (input: { text: string; engine: TtsEngine; voiceId: string; emotion: TtsEmotion }) => void
  onCancel: (id: string) => void
  isCompact: boolean
}
function TtsTab({ voices, tasks, showCreate, onToggleCreate, onSubmit, onCancel, isCompact }: TtsTabProps) {
  return (
    <div data-testid="vp-tts-tab">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ fontSize: 14, margin: 0 }}>TTS 合成任务</h2>
        <button
          type="button"
          data-testid="vp-tts-toggle-create"
          onClick={onToggleCreate}
          style={{
            padding: '5px 12px', fontSize: 11, borderRadius: 4,
            background: showCreate ? '#52c41a' : '#fff',
            color: showCreate ? '#fff' : '#52c41a',
            border: '1px solid #52c41a', cursor: 'pointer',
          }}
        >
          + 新建合成
        </button>
      </div>

      {showCreate && (
        <TtsCreatePanel voices={voices} onSubmit={onSubmit} onClose={onToggleCreate} isCompact={isCompact} />
      )}

      <h3 style={{ fontSize: 12, margin: '12px 0 6px', color: '#8c8c8c' }}>音色目录 ({voices.length})</h3>
      <div style={{ display: 'grid', gridTemplateColumns: isCompact ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
        {voices.map((v) => (
          <div
            key={v.id}
            data-testid={`vp-voice-${v.id}`}
            style={{ background: '#fff', padding: 10, borderRadius: 6, border: '1px solid #f0f0f0' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <strong style={{ fontSize: 12 }}>{GENDER_ICONS[v.gender]} {v.displayName}</strong>
            </div>
            <div style={{ fontSize: 10, color: '#8c8c8c' }}>
              {TTS_ENGINE_LABELS[v.engine]} · {LANGUAGE_LABELS[v.language]}
            </div>
            <div style={{ fontSize: 10, marginTop: 4 }}>
              <span style={{
                padding: '1px 6px', fontSize: 9, borderRadius: 6,
                background: `${EMOTION_COLORS[v.defaultEmotion]}20`, color: EMOTION_COLORS[v.defaultEmotion],
              }}>{EMOTION_LABELS[v.defaultEmotion]}</span>
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 12, margin: '12px 0 6px', color: '#8c8c8c' }}>任务列表 ({tasks.length})</h3>
      <div style={{ display: 'grid', gap: 6 }}>
        {tasks.map((t) => (
          <div
            key={t.id}
            data-testid={`vp-tts-task-${t.id}`}
            data-status={t.status}
            style={{ background: '#fff', padding: 10, borderRadius: 6, border: '1px solid #f0f0f0' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {t.text}
                </div>
                <div style={{ fontSize: 10, color: '#8c8c8c', marginTop: 2 }}>
                  {TTS_ENGINE_LABELS[t.engine]} · {countChars(t.text)} 字符
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span data-testid={`vp-tts-status-${t.id}`} style={{
                  padding: '2px 8px', fontSize: 10, borderRadius: 8,
                  background: `${STATUS_COLORS[t.status]}20`, color: STATUS_COLORS[t.status],
                }}>{STATUS_LABELS[t.status]}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#595959', marginTop: 6, flexWrap: 'wrap' }}>
              <span data-testid={`vp-tts-emotion-${t.id}`} style={{ color: EMOTION_COLORS[t.emotion] }}>
                🎭 {EMOTION_LABELS[t.emotion]}
              </span>
              <span>🎵 {t.outputFormat.toUpperCase()} · {t.sampleRate / 1000}kHz</span>
              {t.estimatedAudioSec != null && <span>⏱ ~{t.estimatedAudioSec.toFixed(1)}s</span>}
              {t.durationMs != null && <span>⏱ {formatAudioTime(t.durationMs)}</span>}
            </div>
            {t.status === 'processing' && (
              <div style={{ height: 4, background: '#f0f0f0', borderRadius: 2, marginTop: 6, overflow: 'hidden' }}>
                <div style={{ width: `${t.progress * 100}%`, height: '100%', background: '#1890ff' }} />
              </div>
            )}
            {(t.status === 'pending' || t.status === 'processing') && (
              <button
                type="button"
                data-testid={`vp-tts-cancel-${t.id}`}
                onClick={() => onCancel(t.id)}
                style={{
                  marginTop: 6, padding: '2px 8px', fontSize: 10, borderRadius: 3,
                  background: '#fff1f0', color: '#ff4d4f', border: 'none', cursor: 'pointer',
                }}
              >
                取消
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function TtsCreatePanel({ voices, onSubmit, onClose, isCompact }: {
  voices: TtsVoice[]; onSubmit: TtsTabProps['onSubmit']; onClose: () => void; isCompact: boolean
}) {
  const [text, setText] = useState('欢迎使用语音合成服务')
  const [voiceId, setVoiceId] = useState(voices[0]?.id ?? '')
  const voice = voices.find((v) => v.id === voiceId)
  const [emotion, setEmotion] = useState<TtsEmotion>(voice?.defaultEmotion ?? 'neutral')

  const handleSubmit = () => {
    if (!voice) return
    onSubmit({ text, engine: voice.engine, voiceId, emotion })
  }

  return (
    <div data-testid="vp-tts-create-panel" style={{
      background: '#fff', padding: 12, borderRadius: 6, marginBottom: 12,
      border: '1px solid #f0f0f0',
    }}>
      <h3 style={{ fontSize: 12, margin: '0 0 8px' }}>新建 TTS 合成</h3>
      <div style={{ display: 'grid', gap: 8 }}>
        <label style={{ fontSize: 11 }}>
          文本内容
          <textarea
            data-testid="vp-tts-create-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            style={{ width: '100%', padding: 6, fontSize: 12, marginTop: 4, border: '1px solid #d9d9d9', borderRadius: 4, resize: 'vertical' }}
          />
        </label>
        <label style={{ fontSize: 11 }}>
          音色
          <select
            data-testid="vp-tts-create-voice"
            value={voiceId}
            onChange={(e) => {
              setVoiceId(e.target.value)
              const v = voices.find((vv) => vv.id === e.target.value)
              if (v) setEmotion(v.defaultEmotion)
            }}
            style={{ width: '100%', padding: 6, fontSize: 12, marginTop: 4, border: '1px solid #d9d9d9', borderRadius: 4 }}
          >
            {voices.map((v) => (
              <option key={v.id} value={v.id}>{GENDER_ICONS[v.gender]} {v.displayName}</option>
            ))}
          </select>
        </label>
        <label style={{ fontSize: 11 }}>
          情感
          <select
            data-testid="vp-tts-create-emotion"
            value={emotion}
            onChange={(e) => setEmotion(e.target.value as TtsEmotion)}
            style={{ width: '100%', padding: 6, fontSize: 12, marginTop: 4, border: '1px solid #d9d9d9', borderRadius: 4 }}
          >
            {Object.entries(EMOTION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
        <div style={{ fontSize: 10, color: '#1890ff' }} data-testid="vp-tts-create-stats">
          字符: {countChars(text)} | 引擎: {voice ? TTS_ENGINE_LABELS[voice.engine] : '-'} | 预计音频: ~{formatSeconds(countChars(text) * 0.15)}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            data-testid="vp-tts-create-submit"
            onClick={handleSubmit}
            style={{
              padding: '5px 12px', fontSize: 11, borderRadius: 4,
              background: '#52c41a', color: '#fff', border: 'none', cursor: 'pointer',
            }}
          >
            开始合成
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '5px 12px', fontSize: 11, borderRadius: 4,
              background: '#fff', color: '#595959', border: '1px solid #d9d9d9', cursor: 'pointer',
            }}
          >
            取消
          </button>
        </div>
      </div>
    </div>
  )
}

// ============ SttTab ============

interface SttTabProps {
  tasks: SttTask[]
  segments: { id: string; startMs: number; endMs: number; text: string; speakerName?: string; confidence: number; emotion?: TtsEmotion; language?: SupportedLanguage }[]
  selectedId?: string
  onSelect: (id: string) => void
  showCreate: boolean
  onToggleCreate: () => void
  onSubmit: (input: { sourceAssetId: string; engine: SttEngine; language: SupportedLanguage }) => void
  onCancel: (id: string) => void
  isCompact: boolean
}
function SttTab({ tasks, segments, selectedId, onSelect, showCreate, onToggleCreate, onSubmit, onCancel, isCompact }: SttTabProps) {
  return (
    <div data-testid="vp-stt-tab">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 14, margin: 0 }}>STT 转写任务</h2>
        <button
          type="button"
          data-testid="vp-stt-toggle-create"
          onClick={onToggleCreate}
          style={{
            padding: '5px 12px', fontSize: 11, borderRadius: 4,
            background: showCreate ? '#52c41a' : '#fff',
            color: showCreate ? '#fff' : '#52c41a',
            border: '1px solid #52c41a', cursor: 'pointer',
          }}
        >
          + 新建转写
        </button>
      </div>

      {showCreate && (
        <SttCreatePanel onSubmit={onSubmit} onClose={onToggleCreate} isCompact={isCompact} />
      )}

      <div style={{ display: 'grid', gap: 6, marginBottom: 16 }}>
        {tasks.map((t) => (
          <div
            key={t.id}
            data-testid={`vp-stt-task-${t.id}`}
            data-status={t.status}
            data-selected={selectedId === t.id}
            onClick={() => onSelect(t.id)}
            style={{
              background: '#fff', padding: 10, borderRadius: 6, cursor: 'pointer',
              border: selectedId === t.id ? '2px solid #1890ff' : '1px solid #f0f0f0',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{t.sourceAssetId}</div>
                <div style={{ fontSize: 10, color: '#8c8c8c', marginTop: 2 }}>
                  {STT_ENGINE_LABELS[t.engine]} · {LANGUAGE_LABELS[t.language]}
                  {t.enableSpeakerDiarization && ' · 🎙️ 说话人'}
                  {t.enableEmotionRecognition && ' · 🎭 情绪'}
                </div>
              </div>
              <span style={{
                padding: '2px 8px', fontSize: 10, borderRadius: 8,
                background: `${STATUS_COLORS[t.status]}20`, color: STATUS_COLORS[t.status],
              }}>{STATUS_LABELS[t.status]}</span>
            </div>
            <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#595959', marginTop: 6, flexWrap: 'wrap' }}>
              <span data-testid={`vp-stt-segments-${t.id}`}>📝 {t.segmentCount} 段落</span>
              {t.detectedLanguage && <span>🌐 检测: {LANGUAGE_LABELS[t.detectedLanguage]}</span>}
              {t.durationMs != null && <span>⏱ {formatAudioTime(t.durationMs)}</span>}
            </div>
          </div>
        ))}
      </div>

      {selectedId && segments.length > 0 && (
        <div data-testid="vp-stt-segments-panel" style={{
          background: '#fff', padding: 12, borderRadius: 8,
          border: '1px solid #f0f0f0',
        }}>
          <h3 style={{ fontSize: 12, margin: '0 0 8px' }}>转写段落 ({segments.length})</h3>
          <div style={{ display: 'grid', gap: 4 }}>
            {segments.map((s) => (
              <div
                key={s.id}
                data-testid={`vp-stt-segment-${s.id}`}
                style={{ display: 'flex', gap: 8, padding: 8, background: '#fafafa', borderRadius: 4, flexWrap: 'wrap' }}
              >
                <div style={{ fontSize: 10, color: '#8c8c8c', minWidth: 60 }}>
                  {formatAudioTime(s.startMs)} - {formatAudioTime(s.endMs)}
                </div>
                {s.speakerName && (
                  <div data-testid={`vp-stt-speaker-${s.id}`} style={{
                    fontSize: 10, padding: '1px 6px', borderRadius: 6,
                    background: '#e6f7ff', color: '#1890ff', alignSelf: 'flex-start',
                  }}>{s.speakerName}</div>
                )}
                <div style={{ flex: 1, minWidth: 200, fontSize: 12, color: '#262626' }}>
                  {s.text}
                </div>
                {s.emotion && (
                  <div data-testid={`vp-stt-emotion-${s.id}`} style={{
                    fontSize: 10, padding: '1px 6px', borderRadius: 6,
                    background: `${EMOTION_COLORS[s.emotion]}20`, color: EMOTION_COLORS[s.emotion],
                    alignSelf: 'flex-start',
                  }}>{EMOTION_LABELS[s.emotion]}</div>
                )}
                <div style={{ fontSize: 10, color: '#8c8c8c', alignSelf: 'flex-start' }}>
                  {(s.confidence * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function SttCreatePanel({ onSubmit, onClose, isCompact }: {
  onSubmit: (input: { sourceAssetId: string; engine: SttEngine; language: SupportedLanguage }) => void
  onClose: () => void; isCompact: boolean
}) {
  const [sourceAssetId, setSourceAssetId] = useState('asset-audio-001')
  const [engine, setEngine] = useState<SttEngine>('mock-azure-stt')
  const [language, setLanguage] = useState<SupportedLanguage>('zh-CN')
  return (
    <div data-testid="vp-stt-create-panel" style={{
      background: '#fff', padding: 12, borderRadius: 6, marginBottom: 12,
      border: '1px solid #f0f0f0',
    }}>
      <h3 style={{ fontSize: 12, margin: '0 0 8px' }}>新建 STT 转写</h3>
      <div style={{ display: 'grid', gap: 8 }}>
        <label style={{ fontSize: 11 }}>
          源资产 ID
          <input
            data-testid="vp-stt-create-assetid"
            type="text"
            value={sourceAssetId}
            onChange={(e) => setSourceAssetId(e.target.value)}
            style={{ width: '100%', padding: 6, fontSize: 12, marginTop: 4, border: '1px solid #d9d9d9', borderRadius: 4 }}
          />
        </label>
        <label style={{ fontSize: 11 }}>
          引擎
          <select
            data-testid="vp-stt-create-engine"
            value={engine}
            onChange={(e) => setEngine(e.target.value as SttEngine)}
            style={{ width: '100%', padding: 6, fontSize: 12, marginTop: 4, border: '1px solid #d9d9d9', borderRadius: 4 }}
          >
            {Object.entries(STT_ENGINE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
        <label style={{ fontSize: 11 }}>
          语言
          <select
            data-testid="vp-stt-create-language"
            value={language}
            onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
            style={{ width: '100%', padding: 6, fontSize: 12, marginTop: 4, border: '1px solid #d9d9d9', borderRadius: 4 }}
          >
            {Object.entries(LANGUAGE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </label>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            data-testid="vp-stt-create-submit"
            onClick={() => onSubmit({ sourceAssetId, engine, language })}
            style={{
              padding: '5px 12px', fontSize: 11, borderRadius: 4,
              background: '#52c41a', color: '#fff', border: 'none', cursor: 'pointer',
            }}
          >
            开始转写
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '5px 12px', fontSize: 11, borderRadius: 4,
              background: '#fff', color: '#595959', border: '1px solid #d9d9d9', cursor: 'pointer',
            }}
          >
            取消
          </button>
        </div>
      </div>
    </div>
  )
}

// ============ ClonesTab ============

interface ClonesTabProps {
  clones: VoiceClone[]
  showCreate: boolean
  onToggleCreate: () => void
  onSubmit: (input: { name: string; engine: VoiceCloningEngine; referenceAssetId: string; referenceDurationSec: number }) => void
  isCompact: boolean
}
function ClonesTab({ clones, showCreate, onToggleCreate, onSubmit, isCompact }: ClonesTabProps) {
  return (
    <div data-testid="vp-clones-tab">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 14, margin: 0 }}>声音克隆</h2>
        <button
          type="button"
          data-testid="vp-clone-toggle-create"
          onClick={onToggleCreate}
          style={{
            padding: '5px 12px', fontSize: 11, borderRadius: 4,
            background: showCreate ? '#52c41a' : '#fff',
            color: showCreate ? '#fff' : '#52c41a',
            border: '1px solid #52c41a', cursor: 'pointer',
          }}
        >
          + 新建克隆
        </button>
      </div>

      {showCreate && (
        <div data-testid="vp-clone-create-panel" style={{
          background: '#fff', padding: 12, borderRadius: 6, marginBottom: 12,
          border: '1px solid #f0f0f0',
        }}>
          <h3 style={{ fontSize: 12, margin: '0 0 8px' }}>新建声音克隆</h3>
          <CloneCreateForm onSubmit={onSubmit} onClose={onToggleCreate} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isCompact ? '1fr' : 'repeat(2, 1fr)', gap: 8 }}>
        {clones.map((c) => (
          <div
            key={c.id}
            data-testid={`vp-clone-${c.id}`}
            data-status={c.status}
            style={{ background: '#fff', padding: 12, borderRadius: 6, border: '1px solid #f0f0f0' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <strong style={{ fontSize: 13 }}>{c.name}</strong>
              <span style={{
                padding: '2px 8px', fontSize: 10, borderRadius: 8,
                background: `${CLONE_STATUS_COLORS[c.status]}20`, color: CLONE_STATUS_COLORS[c.status],
              }}>{CLONE_STATUS_LABELS[c.status]}</span>
            </div>
            <div style={{ fontSize: 10, color: '#8c8c8c', marginBottom: 4 }}>
              {CLONE_ENGINE_LABELS[c.engine]} · 参考 {c.referenceDurationSec}s · {c.referenceAssetId}
            </div>
            {c.status === 'training' && (
              <div style={{ height: 4, background: '#f0f0f0', borderRadius: 2, overflow: 'hidden', marginTop: 6 }}>
                <div data-testid={`vp-clone-progress-${c.id}`} style={{
                  width: `${c.progress * 100}%`, height: '100%', background: '#1890ff',
                }} />
              </div>
            )}
            {c.status === 'ready' && c.similarityScore != null && (
              <div data-testid={`vp-clone-sim-${c.id}`} style={{
                marginTop: 6, fontSize: 11, padding: '3px 8px', borderRadius: 4,
                background: '#f6ffed', color: '#52c41a', display: 'inline-block',
              }}>
                🎯 相似度 {(c.similarityScore * 100).toFixed(0)}%
              </div>
            )}
            {c.trainingDurationMs != null && (
              <div style={{ fontSize: 10, color: '#8c8c8c', marginTop: 4 }}>
                ⏱ 训练 {(c.trainingDurationMs / 1000).toFixed(1)}s
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function CloneCreateForm({ onSubmit, onClose }: {
  onSubmit: (input: { name: string; engine: VoiceCloningEngine; referenceAssetId: string; referenceDurationSec: number }) => void
  onClose: () => void
}) {
  const [name, setName] = useState('新克隆声音')
  const [engine, setEngine] = useState<VoiceCloningEngine>('mock-minimax-voice')
  const [refAsset, setRefAsset] = useState('asset-ref-001')
  const [duration, setDuration] = useState(60)
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <label style={{ fontSize: 11 }}>名称
        <input data-testid="vp-clone-create-name" type="text" value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ width: '100%', padding: 6, fontSize: 12, marginTop: 4, border: '1px solid #d9d9d9', borderRadius: 4 }} />
      </label>
      <label style={{ fontSize: 11 }}>引擎
        <select data-testid="vp-clone-create-engine" value={engine}
          onChange={(e) => setEngine(e.target.value as VoiceCloningEngine)}
          style={{ width: '100%', padding: 6, fontSize: 12, marginTop: 4, border: '1px solid #d9d9d9', borderRadius: 4 }}>
          {Object.entries(CLONE_ENGINE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </label>
      <label style={{ fontSize: 11 }}>参考音频 ID
        <input data-testid="vp-clone-create-ref" type="text" value={refAsset}
          onChange={(e) => setRefAsset(e.target.value)}
          style={{ width: '100%', padding: 6, fontSize: 12, marginTop: 4, border: '1px solid #d9d9d9', borderRadius: 4 }} />
      </label>
      <label style={{ fontSize: 11 }}>参考时长 (秒, 5-600)
        <input data-testid="vp-clone-create-duration" type="number" min={5} max={600} value={duration}
          onChange={(e) => setDuration(Number(e.target.value))}
          style={{ width: '100%', padding: 6, fontSize: 12, marginTop: 4, border: '1px solid #d9d9d9', borderRadius: 4 }} />
      </label>
      <div style={{ display: 'flex', gap: 6 }}>
        <button type="button" data-testid="vp-clone-create-submit"
          onClick={() => onSubmit({ name, engine, referenceAssetId: refAsset, referenceDurationSec: duration })}
          style={{ padding: '5px 12px', fontSize: 11, borderRadius: 4, background: '#52c41a', color: '#fff', border: 'none', cursor: 'pointer' }}>
          开始训练
        </button>
        <button type="button" onClick={onClose}
          style={{ padding: '5px 12px', fontSize: 11, borderRadius: 4, background: '#fff', color: '#595959', border: '1px solid #d9d9d9', cursor: 'pointer' }}>
          取消
        </button>
      </div>
    </div>
  )
}

// ============ VoiceprintsTab ============

interface VoiceprintsTabProps {
  voiceprints: Voiceprint[]
  showCreate: boolean
  onToggleCreate: () => void
  onSubmit: (input: { speakerName: string; referenceAssetIds: string[] }) => void
  isCompact: boolean
}
function VoiceprintsTab({ voiceprints, showCreate, onToggleCreate, onSubmit, isCompact }: VoiceprintsTabProps) {
  return (
    <div data-testid="vp-vp-tab">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ fontSize: 14, margin: 0 }}>声纹库</h2>
        <button
          type="button"
          data-testid="vp-vp-toggle-create"
          onClick={onToggleCreate}
          style={{
            padding: '5px 12px', fontSize: 11, borderRadius: 4,
            background: showCreate ? '#52c41a' : '#fff',
            color: showCreate ? '#fff' : '#52c41a',
            border: '1px solid #52c41a', cursor: 'pointer',
          }}
        >
          + 注册声纹
        </button>
      </div>

      {showCreate && (
        <div data-testid="vp-vp-create-panel" style={{
          background: '#fff', padding: 12, borderRadius: 6, marginBottom: 12,
          border: '1px solid #f0f0f0',
        }}>
          <h3 style={{ fontSize: 12, margin: '0 0 8px' }}>注册声纹</h3>
          <VpCreateForm onSubmit={onSubmit} onClose={onToggleCreate} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: isCompact ? '1fr' : 'repeat(2, 1fr)', gap: 8 }}>
        {voiceprints.map((vp) => (
          <div
            key={vp.id}
            data-testid={`vp-vp-${vp.id}`}
            data-status={vp.status}
            style={{ background: '#fff', padding: 12, borderRadius: 6, border: '1px solid #f0f0f0' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <strong style={{ fontSize: 13 }}>🎤 {vp.speakerName}</strong>
              <span style={{
                padding: '2px 8px', fontSize: 10, borderRadius: 8,
                background: vp.status === 'active' ? '#52c41a20' : '#faad1420',
                color: vp.status === 'active' ? '#52c41a' : '#faad14',
              }}>{vp.status === 'active' ? '已激活' : vp.status === 'enrolled' ? '已注册' : vp.status}</span>
            </div>
            <div style={{ fontSize: 10, color: '#8c8c8c' }}>
              {STT_ENGINE_LABELS[vp.engine]} · {vp.referenceAssetIds.length} 参考音频
            </div>
            {vp.enrolledDurationMs != null && (
              <div style={{ fontSize: 10, color: '#8c8c8c', marginTop: 4 }}>
                ⏱ 注册 {(vp.enrolledDurationMs / 1000).toFixed(2)}s
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function VpCreateForm({ onSubmit, onClose }: {
  onSubmit: (input: { speakerName: string; referenceAssetIds: string[] }) => void
  onClose: () => void
}) {
  const [speakerName, setSpeakerName] = useState('新说话人')
  const [refAssets, setRefAssets] = useState('asset-vp-1, asset-vp-2')
  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <label style={{ fontSize: 11 }}>说话人姓名
        <input data-testid="vp-vp-create-name" type="text" value={speakerName}
          onChange={(e) => setSpeakerName(e.target.value)}
          style={{ width: '100%', padding: 6, fontSize: 12, marginTop: 4, border: '1px solid #d9d9d9', borderRadius: 4 }} />
      </label>
      <label style={{ fontSize: 11 }}>参考音频 ID (逗号分隔,至少 1 个)
        <input data-testid="vp-vp-create-refs" type="text" value={refAssets}
          onChange={(e) => setRefAssets(e.target.value)}
          style={{ width: '100%', padding: 6, fontSize: 12, marginTop: 4, border: '1px solid #d9d9d9', borderRadius: 4 }} />
      </label>
      <div style={{ display: 'flex', gap: 6 }}>
        <button type="button" data-testid="vp-vp-create-submit"
          onClick={() => onSubmit({
            speakerName,
            referenceAssetIds: refAssets.split(',').map((s) => s.trim()).filter(Boolean),
          })}
          style={{ padding: '5px 12px', fontSize: 11, borderRadius: 4, background: '#52c41a', color: '#fff', border: 'none', cursor: 'pointer' }}>
          开始注册
        </button>
        <button type="button" onClick={onClose}
          style={{ padding: '5px 12px', fontSize: 11, borderRadius: 4, background: '#fff', color: '#595959', border: '1px solid #d9d9d9', cursor: 'pointer' }}>
          取消
        </button>
      </div>
    </div>
  )
}