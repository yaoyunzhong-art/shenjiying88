# Voice Processing 语音处理

> AI 语音处理服务，支持文字转语音 (TTS) 与语音识别 (STT)

## 功能
- TTS 任务管理
- STT 语音识别

## 依赖
- AgentModule

## API
- POST /voice-processing/tts/tasks — 创建 TTS 任务
- GET /voice-processing/tts/tasks — TTS 任务列表
- GET /voice-processing/tts/tasks/:id — 任务详情
- POST /voice-processing/tts/tasks/:id/cancel — 取消
- POST /voice-processing/stt/tasks — 创建 STT 任务
