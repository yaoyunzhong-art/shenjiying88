import { describe, it, expect, beforeEach, vi } from 'vitest'
/**
 * 🐜 自动: [voice-processing] [C] 角色场景测试
 *
 * 8 角色视角的语音处理模块业务场景测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界 / 业务异常）
 * 基于 VoiceProcessingService 内联模拟，测试完整业务场景
 */

// ── 模拟 tenant-context (vi.mock hoisted) ──
vi.mock('../../common/context/tenant-context', () => ({
  requireTenantContext: () => ({ tenantId: 't-voice-scenario', userId: 'test-user' }),
}))

import { VoiceProcessingService } from './voice-processing.service'

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

describe('voice-processing 8角色业务场景测试', () => {
  let service: VoiceProcessingService

  beforeEach(() => {
    service = new VoiceProcessingService()
  })

  // ===== 👔 店长 =====
  describe('👔 店长 — 全局语音运营监控', () => {
    it('👔 正常流程: 店长查看语音服务统计概览', async () => {
      await service.createTtsTask({
        text: '欢迎光临审计云游戏中心',
        voiceId: 'zh-female-xiaoxian',
        engine: 'mock-azure-tts',
        emotion: 'friendly',
      })
      await service.createSttTask({
        sourceAssetId: 'asset-customer-feedback-001',
        engine: 'mock-azure-stt',
        language: 'zh-CN',
        enableDiarization: true,
        enableEmotionRecognition: true,
      })
      await service.enrollVoiceprint({
        speakerName: '王店长',
        referenceAssetIds: ['asset-voice-sample-01'],
        engine: 'mock-azure-stt',
      })

      const stats = await service.getVoiceStats()
      expect(stats.totalTtsTasks).toBe(1)
      expect(stats.totalSttTasks).toBe(1)
      expect(stats.totalVoiceprints).toBe(1)
      expect(stats.totalAudioSec).toBeGreaterThan(0)
      expect(stats.avgSttConfidence).toBeGreaterThan(0)
    })

    it('👔 边界: 店长查空数据统计', async () => {
      const stats = await service.getVoiceStats()
      expect(stats.totalTtsTasks).toBe(0)
      expect(stats.totalSttTasks).toBe(0)
      expect(stats.totalVoiceprints).toBe(0)
      expect(stats.totalVoiceClones).toBe(0)
      expect(stats.avgSttConfidence).toBe(0)
    })
  })

  // ===== 🛒 前台 =====
  describe('🛒 前台 — 语音播报与客户接待', () => {
    it('🛒 正常流程: 前台创建迎宾 TTS 播报', async () => {
      const task = await service.createTtsTask({
        text: '您好，欢迎来到审计云游戏，前台为您服务',
        voiceId: 'zh-female-xiaoxian',
        engine: 'mock-azure-tts',
        emotion: 'friendly',
        speedAdjustment: 10,
        outputFormat: 'mp3',
      })
      expect(task.status).toBe('completed')
      expect(task.engine).toBe('mock-azure-tts')
      expect(task.audioDurationSec).toBeGreaterThan(1)
      expect(task.outputAssetId).toContain('audio-')
    })

    it('🛒 正常流程: 前台创建客户语音留言 STT', async () => {
      const task = await service.createSttTask({
        sourceAssetId: 'asset-voicemail-customer',
        filename: 'customer-voicemail.wav',
        engine: 'mock-azure-stt',
        language: 'zh-CN',
        enableDiarization: true,
        enableEmotionRecognition: true,
      })
      expect(task.status).toBe('completed')
      expect(task.speakerCount).toBeGreaterThanOrEqual(1)
      expect(task.fullText.length).toBeGreaterThan(0)
      expect(task.avgConfidence).toBeGreaterThan(0.8)
    })

    it('🛒 边界: 前台指定不存在的 TTS 引擎应报错', async () => {
      await expect(service.createTtsTask({
        text: '测试', voiceId: 'zh-female-xiaoxian',
        engine: 'mock-nonexistent-tts' as any,
      })).rejects.toThrow('TTS 引擎 mock-nonexistent-tts 不存在')
    })
  })

  // ===== 👥 HR =====
  describe('👥 HR — 面试录音转写与声纹管理', () => {
    it('👥 正常流程: HR 创建面试录音 STT 转写', async () => {
      const task = await service.createSttTask({
        sourceAssetId: 'asset-interview-20260710',
        filename: 'interview-candidate-zhang.wav',
        engine: 'mock-azure-stt',
        language: 'zh-CN',
        enableDiarization: true,
        enableEmotionRecognition: false,
      })
      expect(task.status).toBe('completed')
      expect(task.speakerCount).toBe(2) // 面试官 + 候选人
      expect(task.fullText).toContain('您好')
    })

    it('👥 正常流程: HR 注册候选人声纹', async () => {
      const vp = await service.enrollVoiceprint({
        speakerName: '张某某候选人',
        userId: 'candidate-zhang-007',
        referenceAssetIds: ['asset-interview-20260710', 'asset-phone-screen-001'],
        engine: 'mock-azure-stt',
        description: '2026年7月10日面试录音',
      })
      expect(vp.id).toMatch(/^vp-/)
      expect(vp.speakerName).toBe('张某某候选人')
      expect(vp.status).toBe('enrolled')
      expect(vp.embedding.length).toBe(128)
    })

    it('👥 边界: HR 注册声纹时不提供参考音频应报错', async () => {
      await expect(service.enrollVoiceprint({
        speakerName: '无名氏',
        referenceAssetIds: [],
        engine: 'mock-azure-stt',
      })).rejects.toThrow('至少 1 个参考音频')
    })
  })

  // ===== 🔧 安监 =====
  describe('🔧 安监 — 安全监听与语音审核', () => {
    it('🔧 正常流程: 安监创建 STT 任务审核敏感对话', async () => {
      const task = await service.createSttTask({
        sourceAssetId: 'asset-security-monitor-001',
        filename: 'security-audit-log-001.wav',
        engine: 'mock-aliyun-stt',
        language: 'zh-CN',
        enableEmotionRecognition: true,
      })
      expect(task.status).toBe('completed')
      expect(task.engine).toBe('mock-aliyun-stt')
      expect(task.fullText).toBeTruthy()
      const segments = await service.listSttSegments(task.id)
      expect(segments.length).toBeGreaterThan(0)
    })

    it('🔧 边界: 安监尝试使用不支持的引擎功能应报错', async () => {
      await expect(service.createSttTask({
        sourceAssetId: 'asset-test',
        engine: 'mock-whisper',
        language: 'zh-CN',
        enableDiarization: true, // Whisper 不支持说话人分离
        enableEmotionRecognition: false,
      })).rejects.toThrow('不支持说话人分离')
    })

    it('🔧 正常流程: 安监识别说话人身份', async () => {
      // 先注册声纹
      const vp = await service.enrollVoiceprint({
        speakerName: '嫌疑人员A',
        userId: 'suspect-A',
        referenceAssetIds: ['asset-voice-sample-suspectA'],
        engine: 'mock-azure-stt',
      })
      // 创建 STT 获取段落
      const task = await service.createSttTask({
        sourceAssetId: 'asset-monitor-clip-001',
        engine: 'mock-azure-stt',
        language: 'zh-CN',
        enableDiarization: false,
      })
      const segments = await service.listSttSegments(task.id)
      const result = await service.identifySpeakers({
        segmentIds: [segments[0].id],
        candidateVoiceprintIds: [vp.id],
      })
      expect(result.length).toBe(1)
      expect(result[0].matches.length).toBe(1)
      expect(result[0].matches[0].speakerName).toBe('嫌疑人员A')
    })
  })

  // ===== 🎮 导玩员 =====
  describe('🎮 导玩员 — 游戏语音播报与互动语音包', () => {
    it('🎮 正常流程: 导玩员创建游戏道具 TTS 语音播报', async () => {
      const task = await service.createTtsTask({
        text: '恭喜您获得限量版传说皮肤！',
        voiceId: 'zh-male-yunxi',
        engine: 'mock-azure-tts',
        emotion: 'excited',
        speedAdjustment: 20,
        volumeAdjustment: 10,
        outputFormat: 'wav',
      })
      expect(task.status).toBe('completed')
      expect(task.voiceId).toBe('zh-male-yunxi')
      expect(task.emotion).toBe('excited')
      expect(task.audioDurationSec).toBeGreaterThan(1)
    })

    it('🎮 正常流程: 导玩员查询支持的全部音色', async () => {
      const voices = service.listVoices()
      expect(voices.length).toBeGreaterThanOrEqual(6)
      expect(voices.some((v) => v.displayName.includes('晓娴'))).toBe(true)
      // 按引擎过滤
      const edgeVoices = service.listVoices('mock-edge-tts')
      expect(edgeVoices.length).toBeGreaterThan(0)
    })

    it('🎮 边界: 导玩员尝试为不支持情感的引擎设置自定义情感应报错', async () => {
      await expect(service.createTtsTask({
        text: '游戏提示音',
        voiceId: 'en-female-jenny',
        engine: 'mock-google-tts', // Google TTS 不支持情感
        emotion: 'happy',
      })).rejects.toThrow('不支持情感调节')
    })
  })

  // ===== 🎯 运行专员 =====
  describe('🎯 运行专员 — 语音引擎运维与监控', () => {
    it('🎯 正常流程: 运行专员查询所有 TTS 引擎元数据', async () => {
      const engines = service.listTtsEngines()
      expect(engines.length).toBeGreaterThanOrEqual(6)
      const edgeEngine = engines.find((e) => e.type === 'mock-edge-tts')
      expect(edgeEngine).toBeTruthy()
      expect(edgeEngine!.freeQuotaPerMonth).toBe(Infinity)
      expect(edgeEngine!.unitPricePerCharCny).toBe(0)
    })

    it('🎯 正常流程: 运行专员查询 STT 引擎元数据', async () => {
      const engines = service.listSttEngines()
      expect(engines.length).toBeGreaterThanOrEqual(6)
      const whisperEngine = engines.find((e) => e.type === 'mock-whisper')
      expect(whisperEngine).toBeTruthy()
      expect(whisperEngine!.realtimeStreaming).toBe(false)
    })

    it('🎯 边界: 运行专员尝试创建 TTS 时使用不属于该引擎的音色应报错', async () => {
      await expect(service.createTtsTask({
        text: '测试',
        voiceId: 'zh-male-yunxi', // Azure TTS 的音色
        engine: 'mock-aliyun-tts', // 但指定阿里云引擎
      })).rejects.toThrow('不属于引擎')
    })
  })

  // ===== 🤝 团建 =====
  describe('🤝 团建 — 团建语音素材制作与整理', () => {
    it('🤝 正常流程: 团建专员制作团建活动开场 TTS', async () => {
      const task = await service.createTtsTask({
        text: '各位同事大家早上好！欢迎参加本次审计云团队建设活动。今天我们将一起度过愉快而有意义的一天！',
        voiceId: 'zh-female-xiaomeng',
        engine: 'mock-aliyun-tts',
        emotion: 'happy',
        speedAdjustment: 5,
        outputFormat: 'mp3',
      })
      expect(task.status).toBe('completed')
      expect(task.engine).toBe('mock-aliyun-tts')
    })

    it('🤝 正常流程: 团建专员克隆专属团建解说音色', async () => {
      const clone = await service.cloneVoice({
        name: '团建解说小张',
        description: '基于参考录音克隆的团建专属音色',
        engine: 'mock-minimax-voice',
        referenceAssetId: 'asset-teambuilding-voice-trainer',
        referenceDurationSec: 60,
      })
      expect(clone.status).toBe('ready')
      expect(clone.similarityScore).toBeGreaterThan(0.8)
      expect(clone.name).toBe('团建解说小张')
    })

    it('🤝 边界: 团建专员提供过短的参考音频应报错', async () => {
      await expect(service.cloneVoice({
        name: '无效克隆',
        engine: 'mock-minimax-voice',
        referenceAssetId: 'asset-too-short',
        referenceDurationSec: 2, // 少于 5 秒
      })).rejects.toThrow('至少 5 秒')
    })
  })

  // ===== 📢 营销 =====
  describe('📢 营销 — 语音营销素材生成与投放', () => {
    it('📢 正常流程: 营销专员创建促销活动语音广告 TTS', async () => {
      const task = await service.createTtsTask({
        text: '限时特惠！所有会员充值满100送50，活动仅限本周，赶快行动吧！',
        voiceId: 'zh-female-xiaomeng',
        engine: 'mock-aliyun-tts',
        emotion: 'excited',
        speedAdjustment: 15,
        volumeAdjustment: 5,
        outputFormat: 'mp3',
        sampleRate: 48000,
      })
      expect(task.status).toBe('completed')
      expect(task.outputFormat).toBe('mp3')
      expect(task.sampleRate).toBe(48000)
      expect(task.outputAssetId).toBeTruthy()
    })

    it('📢 正常流程: 营销专员查询并选择不同语言音色', async () => {
      const voices = service.listVoices('mock-google-tts')
      const jpVoice = voices.find((v) => v.language === 'ja-JP')
      expect(jpVoice).toBeTruthy()
      expect(jpVoice!.displayName).toContain('七海')
    })

    it('📢 边界: 营销专员使用 Edge TTS（免费）不应额外计费', async () => {
      const engine = service.listTtsEngines().find((e) => e.type === 'mock-edge-tts')
      expect(engine!.unitPricePerCharCny).toBe(0)
      expect(engine!.freeQuotaPerMonth).toBe(Infinity)

      const task = await service.createTtsTask({
        text: '免费语音测试',
        voiceId: 'en-female-jenny',
        engine: 'mock-edge-tts',
      })
      expect(task.status).toBe('completed')
    })
  })
})
