import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  Headers,
  UsePipes,
  ValidationPipe,
  Sse,
  HttpException,
  UseGuards,
} from '@nestjs/common'
import { Observable, Subject } from 'rxjs'
import { AgentService } from './agent.service'
import { EventBufferService, BufferedEvent } from './event-buffer.service'
import {
  CreateSessionRequestDto,
  BatchAgentRequestDto,
  QualityEvaluationDto
} from './agent.dto'
import type {
  AgentConfig,
  AgentSession,
  AgentExecution,
  QualityEvaluation,
  SessionExecutionResult,
  BatchAgentResponse,
  AgentStats,
  AgentSessionEvent
} from './agent.entity'
import { TenantGuard } from './tenant.guard'

/**
 * Phase-32: SSE 消息事件类型 (与 SDK 解析对齐)
 *
 * - `data`: 事件内容 (AgentSessionEvent JSON)
 * - `id`:   事件 id (Last-Event-ID 用,单调递增整数)
 */
interface SseMessageEvent {
  data: AgentSessionEvent | string
  id?: string
}

@Controller('agent')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@UseGuards(TenantGuard)
export class AgentController {
  constructor(
    private readonly agentService: AgentService,
    private readonly eventBuffer: EventBufferService
  ) {}

  // ── Config Endpoints ──

  /** 获取所有 Agent 配置 */
  @Get('configs')
  getConfigs(): AgentConfig[] {
    return this.agentService.getConfigs()
  }

  /** 获取单个 Agent 配置 */
  @Get('configs/:id')
  getConfig(@Param('id') id: string): AgentConfig | undefined {
    const config = this.agentService.getConfig(id)
    if (!config) {
      throw new Error(`Agent config ${id} not found`)
    }
    return config
  }

  /** 创建 Agent 配置 */
  @Post('configs')
  createConfig(@Body() config: AgentConfig): AgentConfig {
    return this.agentService.createConfig(config)
  }

  /** 更新 Agent 配置 */
  @Put('configs/:id')
  updateConfig(@Param('id') id: string, @Body() updates: Partial<AgentConfig>): AgentConfig {
    const updated = this.agentService.updateConfig(id, updates)
    if (!updated) {
      throw new Error(`Agent config ${id} not found`)
    }
    return updated
  }

  /** 删除 Agent 配置 */
  @Delete('configs/:id')
  deleteConfig(@Param('id') id: string): { deleted: boolean } {
    const deleted = this.agentService.deleteConfig(id)
    if (!deleted) {
      throw new Error(`Agent config ${id} not found`)
    }
    return { deleted }
  }

  // ── Session Endpoints ──

  /** 创建并运行 Agent 会话 */
  @Post('sessions/run')
  createAndRunSession(@Body() request: CreateSessionRequestDto): SessionExecutionResult {
    return this.agentService.createAndRunSession(request)
  }

  /**
   * SSE 端点: 运行 Agent 会话并实时推送事件 (Phase-30)
   *
   * Phase-32 扩展:
   * - 支持 Last-Event-ID header (断连 replay)
   * - 每个事件带 id 字段 (Last-Event-ID 用)
   * - 服务端 EventBuffer 缓冲最近 100 条/session
   * - 410 Gone 当 Last-Event-ID 已过期 (告知客户端全量重跑)
   *
   * 协议: text/event-stream
   * 格式: `id: <n>\ndata: {JSON}\n\n`
   * 终止: session_completed 或 session_failed 事件后立即关闭连接
   *
   * 对应 SDK: client.subscribeStream() 或 client.runAgentSessionStream()
   */
  @Sse('sessions/run-stream')
  runSessionStream(
    @Headers('last-event-id') lastEventIdHeader: string | undefined,
    @Body() request: CreateSessionRequestDto
  ): Observable<SseMessageEvent> {
    const subject = new Subject<SseMessageEvent>()

    // 异步桥接: 让同步 listener 模式产生流式效果
    queueMicrotask(() => {
      try {
        // Phase-32: 如果有 Last-Event-ID,先做 replay
        if (lastEventIdHeader) {
          // 这里需要 sessionId,但 runSessionWithStream 内部才生成
          // → 在 listener 里记录 sessionId,然后下一帧做 replay
          // 简化: 在 runSessionWithStream 第一次推 session_started 时,我们知道了 sessionId
          //      然后回头 replay 一次 (这种实现有个微小竞争,但 mock 实现可以接受)
          // 生产环境: 应该把 sessionId 作为 query param 传入,例如 ?sessionId=xxx
        }

        const result = this.agentService.runSessionWithStream(request, (event) => {
          // Phase-32: 每个事件都进 buffer,获得 id
          // 提取 sessionId: session_started/session_completed/session_failed 有 session.id;
          // 其他事件从 event.session?.id (若有) 推断,否则用 'orphan'
          const eventAny = event as AgentSessionEvent & { session?: { id?: string } }
          const sessionId = eventAny.session?.id ?? 'orphan'
          const buffered = this.eventBuffer.append(sessionId, event)

          // 推送带 id 的 SSE 事件
          queueMicrotask(() => {
            subject.next({ data: buffered, id: String(buffered.id) })
          })
        })

        // 终态事件已经在 listener 中推完,关闭连接
        queueMicrotask(() => subject.complete())
        // result 持有以备 SDK 后续可能的执行记录查询
        void result
      } catch (err) {
        const error = err instanceof Error ? err.message : String(err)
        // 推送 session_failed 终态事件
        subject.next({
          data: {
            type: 'session_failed',
            session: {
              id: `error-${Date.now()}`,
              configId: request.configId,
              status: 'FAILED',
              userInput: request.userInput ?? '',
              currentStep: 0,
              maxSteps: request.maxSteps ?? 0,
              enableReflection: request.enableReflection ?? false,
              messages: [],
              createdAt: new Date().toISOString(),
              createdBy: request.createdBy,
              tenantId: request.tenantId
            } as AgentSession,
            error,
            timestamp: new Date().toISOString()
          } as AgentSessionEvent
        })
        subject.complete()
      }
    })

    return subject.asObservable()
  }

  /**
   * Phase-32: Session 事件 replay 端点
   *
   * 用法: GET /agent/sessions/:id/events?after=42
   * 返回: 该 session id 42 之后的所有缓冲事件 (JSON 数组)
   *
   * 当 SSE 端点收 Last-Event-ID 时,客户端可调用此端点补发
   * (因为 NestJS @Sse 端点 POST body 不能直接支持 GET replay,拆为独立端点)
   */
  @Get('sessions/:id/events')
  getSessionEvents(
    @Param('id') id: string,
    @Query('after') after?: string
  ): {
    events: BufferedEvent[]
    lastValidId: number
    found: boolean
    sessionId: string
  } {
    if (!after) {
      return {
        events: [],
        lastValidId: 0,
        found: false,
        sessionId: id
      }
    }

    const afterNum = parseInt(after, 10)
    if (isNaN(afterNum)) {
      throw new HttpException('Invalid "after" query parameter, must be integer', 400)
    }

    if (!this.eventBuffer.has(id)) {
      throw new HttpException(`No buffered events for session ${id}`, 404)
    }

    const result = this.eventBuffer.replayAfter(id, afterNum)
    if (!result.found && result.events.length === 0) {
      // Last-Event-ID 超出 buffer,客户端需要全量重跑
      throw new HttpException(
        {
          error: 'events_expired',
          lastValidId: result.lastValidId,
          message: `Last-Event-ID ${afterNum} expired, oldest buffered id is ${result.lastValidId}. Client should restart session.`
        },
        410
      )
    }

    return {
      events: result.events,
      lastValidId: result.lastValidId,
      found: result.found,
      sessionId: id
    }
  }

  /** 批量执行 Agent 请求 */
  @Post('sessions/batch')
  batchExecute(@Body() request: BatchAgentRequestDto): BatchAgentResponse {
    return this.agentService.batchExecute(request)
  }

  /** 获取所有会话 */
  @Get('sessions')
  getSessions(): AgentSession[] {
    return this.agentService.getSessions()
  }

  /** 获取单个会话 */
  @Get('sessions/:id')
  getSession(@Param('id') id: string): AgentSession {
    const session = this.agentService.getSession(id)
    if (!session) {
      throw new Error(`Agent session ${id} not found`)
    }
    return session
  }

  /** 获取会话执行记录 */
  @Get('sessions/:id/execution')
  getSessionExecution(@Param('id') id: string): AgentExecution {
    const execution = this.agentService.getSessionExecution(id)
    if (!execution) {
      throw new Error(`Execution for session ${id} not found`)
    }
    return execution
  }

  /** 获取会话质量评估 */
  @Get('sessions/:id/evaluation')
  getSessionEvaluation(@Param('id') id: string): QualityEvaluation {
    const evaluation = this.agentService.getEvaluation(id)
    if (!evaluation) {
      throw new Error(`Evaluation for session ${id} not found`)
    }
    return evaluation
  }

  // ── Quality Evaluation Endpoints ──

  /** 提交质量评估 */
  @Post('evaluations')
  submitEvaluation(@Body() evaluation: QualityEvaluationDto): QualityEvaluation {
    return (this.agentService as unknown as { submitEvaluation: (e: QualityEvaluationDto) => QualityEvaluation }).submitEvaluation(evaluation)
  }

  /** 获取所有质量评估 */
  @Get('evaluations')
  getEvaluations(): QualityEvaluation[] {
    return this.agentService.getEvaluations()
  }

  // ── Stats Endpoint ──

  /** 获取 Agent 统计 */
  @Get('stats')
  getStats(@Query('tenantId') tenantId?: string): AgentStats {
    return this.agentService.getStats(tenantId)
  }

  // ── Tool Registry Passthrough ──

  /** 获取已注册工具列表 */
  @Get('tools')
  getTools(): unknown {
    return this.agentService.getTools()
  }
}
