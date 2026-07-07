/**
 * Ollama Local Model + RAG Service (T119-4)
 *
 * 使用内存 mock 模拟 Ollama API 响应。
 * 提供本地模型推理和检索增强生成能力。
 */
import { Logger } from '@nestjs/common'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OllamaModel {
  name: string
  size: number
  modified_at: string
}

export interface GenerateResponse {
  model: string
  response: string
  done: boolean
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ChatResponse {
  model: string
  message: ChatMessage
  done: boolean
}

export interface EmbedResponse {
  embedding: number[]
}

export interface ModelStatus {
  name: string
  status: 'ready' | 'pulling' | 'error'
  progress?: number
  error?: string
}

export interface RetrievedContent {
  content: string
  metadata: Record<string, any>
  score: number
}

// ── Mock HTTP Client ───────────────────────────────────────────────────────────

class MockHttpClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async get<T>(path: string): Promise<T> {
    return this.mockRequest('GET', path) as T
  }

  async post<T>(path: string, body: any): Promise<T> {
    return this.mockRequest('POST', path, body) as T
  }

  private mockRequest(method: string, path: string, body?: any): any {
    // Mock responses based on path
    if (path === '/api/tags') {
      return {
        models: [
          { name: 'llama2:7b', size: 3826793564, modified_at: new Date().toISOString() },
          { name: 'codellama:7b', size: 3826793564, modified_at: new Date().toISOString() },
          { name: 'nomic-embed-text', size: 274609095, modified_at: new Date().toISOString() }
        ]
      }
    }

    if (path === '/api/generate') {
      const model = body?.model || 'llama2:7b'
      return {
        model,
        response: `Mock response for: ${body?.prompt?.substring(0, 50)}...`,
        done: true
      }
    }

    if (path === '/api/chat') {
      const model = body?.model || 'llama2:7b'
      const lastMessage = body?.messages?.[body.messages.length - 1]?.content || ''
      return {
        model,
        message: {
          role: 'assistant',
          content: `Mock chat response to: ${lastMessage.substring(0, 30)}...`
        },
        done: true
      }
    }

    if (path === '/api/embeddings') {
      return {
        embedding: this.generateMockEmbedding(body?.prompt || '')
      }
    }

    return {}
  }

  private generateMockEmbedding(text: string): number[] {
    // Generate deterministic embedding based on text hash
    const vector: number[] = []
    let hash = this.hashString(text)
    for (let i = 0; i < 768; i++) {
      hash = (hash * 1664525 + 1013904223) & 0xffffffff
      const value = (hash >>> 0) / 0xffffffff
      vector.push(value)
    }
    return this.normalize(vector)
  }

  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash + char) | 0
    }
    return hash
  }

  private normalize(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0))
    if (magnitude === 0) return vector
    return vector.map((v) => v / magnitude)
  }
}

// ── OllamaClient ───────────────────────────────────────────────────────────────

export class OllamaClient {
  private readonly logger = new Logger(OllamaClient.name)
  private client: MockHttpClient
  private connected = false

  constructor(private readonly baseUrl = 'http://localhost:11434') {
    this.client = new MockHttpClient(baseUrl)
  }

  async connect(): Promise<void> {
    try {
      // Mock connectivity check - always succeeds
      this.connected = true
      this.logger.log(`Ollama client connected to ${this.baseUrl}`)
    } catch (error) {
      this.connected = false
      throw new Error(`Failed to connect to Ollama at ${this.baseUrl}`)
    }
  }

  async listModels(): Promise<OllamaModel[]> {
    if (!this.connected) {
      throw new Error('Ollama client not connected')
    }
    const response = await this.client.get<{ models: OllamaModel[] }>('/api/tags')
    return response.models
  }

  async generate(prompt: string, model?: string): Promise<GenerateResponse> {
    if (!this.connected) {
      throw new Error('Ollama client not connected')
    }
    return this.client.post<GenerateResponse>('/api/generate', { prompt, model })
  }

  async chat(messages: ChatMessage[], model?: string): Promise<ChatResponse> {
    if (!this.connected) {
      throw new Error('Ollama client not connected')
    }
    return this.client.post<ChatResponse>('/api/chat', { messages, model })
  }

  async embed(text: string, model?: string): Promise<EmbedResponse> {
    if (!this.connected) {
      throw new Error('Ollama client not connected')
    }
    return this.client.post<EmbedResponse>('/api/embeddings', { prompt: text, model })
  }

  isConnected(): boolean {
    return this.connected
  }
}

// ── RAGService ─────────────────────────────────────────────────────────────────

export class RAGService {
  private readonly logger = new Logger(RAGService.name)
  private knowledgeStore = new Map<string, { content: string; metadata: Record<string, any>; embedding: number[] }>()
  private embeddingService: OllamaClient

  constructor(embeddingService: OllamaClient) {
    this.embeddingService = embeddingService
  }

  async indexContent(content: string, metadata: Record<string, any> = {}): Promise<string> {
    const id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const embeddingResponse = await this.embeddingService.embed(content)
    
    this.knowledgeStore.set(id, {
      content,
      metadata: { ...metadata, id },
      embedding: embeddingResponse.embedding
    })
    
    this.logger.log(`Indexed content with id: ${id}`)
    return id
  }

  async retrieve(query: string, topK = 5): Promise<RetrievedContent[]> {
    const queryEmbedding = await this.embeddingService.embed(query)
    
    const results: RetrievedContent[] = []
    for (const [id, doc] of this.knowledgeStore.entries()) {
      const score = this.cosineSimilarity(queryEmbedding.embedding, doc.embedding)
      results.push({
        content: doc.content,
        metadata: { ...doc.metadata, id },
        score
      })
    }

    results.sort((a, b) => b.score - a.score)
    return results.slice(0, topK)
  }

  async generateWithContext(prompt: string, query: string): Promise<{ answer: string; contexts: RetrievedContent[] }> {
    const contexts = await this.retrieve(query, 3)
    
    const contextText = contexts
      .map((ctx, idx) => `[Context ${idx + 1}]: ${ctx.content}`)
      .join('\n\n')

    const enhancedPrompt = `Based on the following contexts, answer the question.\n\n${contextText}\n\nQuestion: ${prompt}\n\nAnswer:`
    
    const response = await this.embeddingService.generate(enhancedPrompt)
    
    return {
      answer: response.response,
      contexts
    }
  }

  async chatWithKnowledge(
    messages: ChatMessage[],
    collection?: string
  ): Promise<{ response: string; contexts: RetrievedContent[] }> {
    const lastUserMessage = messages.filter((m) => m.role === 'user').pop()
    if (!lastUserMessage) {
      throw new Error('No user message found in conversation')
    }

    const contexts = await this.retrieve(lastUserMessage.content, 3)
    
    const contextText = contexts
      .map((ctx, idx) => `[Context ${idx + 1}]: ${ctx.content}`)
      .join('\n\n')

    const systemPrompt = `You are a helpful assistant with knowledge base access. Use the following contexts to answer questions accurately.\n\n${contextText}`

    const enhancedMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages
    ]

    const response = await this.embeddingService.chat(enhancedMessages)

    return {
      response: response.message.content,
      contexts
    }
  }

  async clearKnowledge(): Promise<void> {
    this.knowledgeStore.clear()
    this.logger.log('Knowledge base cleared')
  }

  getKnowledgeCount(): number {
    return this.knowledgeStore.size
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0
    
    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB)
    if (denominator === 0) return 0
    return dotProduct / denominator
  }
}

// ── LocalModelManager ──────────────────────────────────────────────────────────

export class LocalModelManager {
  private readonly logger = new Logger(LocalModelManager.name)
  private modelStatuses = new Map<string, ModelStatus>()
  private defaultModel = 'llama2:7b'

  constructor(private ollamaClient: OllamaClient) {
    // Initialize with known models
    this.modelStatuses.set('llama2:7b', { name: 'llama2:7b', status: 'ready' })
    this.modelStatuses.set('codellama:7b', { name: 'codellama:7b', status: 'ready' })
    this.modelStatuses.set('nomic-embed-text', { name: 'nomic-embed-text', status: 'ready' })
  }

  async pullModel(modelName: string): Promise<void> {
    this.logger.log(`Pulling model: ${modelName}`)
    
    this.modelStatuses.set(modelName, {
      name: modelName,
      status: 'pulling',
      progress: 0
    })

    // Simulate pulling progress
    await this.simulateProgress(modelName)

    this.modelStatuses.set(modelName, {
      name: modelName,
      status: 'ready',
      progress: 100
    })

    this.logger.log(`Model ${modelName} is ready`)
  }

  async getModelStatus(modelName: string): Promise<ModelStatus | null> {
    return this.modelStatuses.get(modelName) || null
  }

  async switchDefaultModel(modelName: string): Promise<void> {
    const status = this.modelStatuses.get(modelName)
    if (!status || status.status !== 'ready') {
      throw new Error(`Model ${modelName} is not available`)
    }
    this.defaultModel = modelName
    this.logger.log(`Default model switched to ${modelName}`)
  }

  getDefaultModel(): string {
    return this.defaultModel
  }

  getAllModelStatuses(): ModelStatus[] {
    return Array.from(this.modelStatuses.values())
  }

  private async simulateProgress(modelName: string): Promise<void> {
    // Simulate async pulling process
    for (let i = 0; i <= 100; i += 20) {
      await new Promise((resolve) => setTimeout(resolve, 10))
      const status = this.modelStatuses.get(modelName)
      if (status && status.status === 'pulling') {
        this.modelStatuses.set(modelName, { ...status, progress: i })
      }
    }
  }
}
