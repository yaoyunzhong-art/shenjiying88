import { Injectable } from '@nestjs/common'
import type { Conversation, Message, ConversationStatus } from '../ai-cs.entity'

@Injectable()
export class ConversationAdapter {
  private conversations = new Map<string, Conversation>()

  seed(conversations: Conversation[]): void {
    for (const c of conversations) {
      this.conversations.set(c.id, { ...c })
    }
  }

  create(conversation: Conversation): Conversation {
    if (this.conversations.has(conversation.id)) {
      throw new Error(`Conversation ${conversation.id} already exists`)
    }
    this.conversations.set(conversation.id, { ...conversation })
    return conversation
  }

  query(tenantId: string, conversationId: string): Conversation | null {
    const c = this.conversations.get(conversationId)
    if (!c || c.tenantId !== tenantId) return null
    return { ...c }
  }

  queryByStatus(tenantId: string, status: ConversationStatus): Conversation[] {
    return Array.from(this.conversations.values())
      .filter(c => c.tenantId === tenantId && c.status === status)
      .map(c => ({ ...c }))
  }

  queryByMember(tenantId: string, memberId: string): Conversation[] {
    return Array.from(this.conversations.values())
      .filter(c => c.tenantId === tenantId && c.memberId === memberId)
      .map(c => ({ ...c }))
  }

  queryAll(tenantId: string): Conversation[] {
    return Array.from(this.conversations.values())
      .filter(c => c.tenantId === tenantId)
      .map(c => ({ ...c }))
  }

  appendMessage(tenantId: string, conversationId: string, message: Message): Conversation {
    const c = this.conversations.get(conversationId)
    if (!c || c.tenantId !== tenantId) {
      throw new Error(`Conversation ${conversationId} not found in tenant ${tenantId}`)
    }
    c.messages.push(message)
    c.metadata.totalMessages = c.messages.length
    c.metadata.lastActivityAt = message.timestamp
    c.updatedAt = message.timestamp
    return { ...c }
  }

  updateStatus(tenantId: string, conversationId: string, status: ConversationStatus): Conversation {
    const c = this.conversations.get(conversationId)
    if (!c || c.tenantId !== tenantId) {
      throw new Error(`Conversation ${conversationId} not found in tenant ${tenantId}`)
    }
    c.status = status
    c.updatedAt = new Date().toISOString()
    return { ...c }
  }

  updateAgent(tenantId: string, conversationId: string, agentId: string): Conversation {
    const c = this.conversations.get(conversationId)
    if (!c || c.tenantId !== tenantId) {
      throw new Error(`Conversation ${conversationId} not found in tenant ${tenantId}`)
    }
    c.agentId = agentId
    c.updatedAt = new Date().toISOString()
    return { ...c }
  }

  updateContext(tenantId: string, conversationId: string, context: string[]): Conversation {
    const c = this.conversations.get(conversationId)
    if (!c || c.tenantId !== tenantId) {
      throw new Error(`Conversation ${conversationId} not found in tenant ${tenantId}`)
    }
    c.context = context
    c.updatedAt = new Date().toISOString()
    return { ...c }
  }

  delete(tenantId: string, conversationId: string): boolean {
    const c = this.conversations.get(conversationId)
    if (!c || c.tenantId !== tenantId) return false
    return this.conversations.delete(conversationId)
  }

  reset(): void {
    this.conversations.clear()
  }
}