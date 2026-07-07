import { Injectable } from '@nestjs/common'
import type { Intent } from '../ai-cs.entity'

@Injectable()
export class IntentAdapter {
  private intents = new Map<string, Intent>()

  seed(intents: Intent[]): void {
    for (const i of intents) {
      this.intents.set(i.id, { ...i })
    }
  }

  add(intent: Intent): Intent {
    if (this.intents.has(intent.id)) {
      throw new Error(`Intent ${intent.id} already exists`)
    }
    this.intents.set(intent.id, { ...intent })
    return intent
  }

  query(tenantId: string, intentId: string): Intent | null {
    const i = this.intents.get(intentId)
    if (!i || i.tenantId !== tenantId) return null
    return { ...i }
  }

  queryAll(tenantId: string): Intent[] {
    return Array.from(this.intents.values())
      .filter(i => i.tenantId === tenantId)
      .map(i => ({ ...i }))
  }

  recognize(tenantId: string, text: string): { intent: Intent; confidence: number } | null {
    const intents = this.queryAll(tenantId)
    if (intents.length === 0) return null

    const lowerText = text.toLowerCase()
    let bestIntent: Intent | null = null
    let bestScore = 0

    for (const intent of intents) {
      let score = 0
      let matchedKeywords = 0
      for (const kw of intent.keywords) {
        if (lowerText.includes(kw.toLowerCase())) {
          score += 1 / intent.keywords.length
          matchedKeywords++
        }
      }
      if (matchedKeywords > 0 && score > bestScore) {
        bestScore = score
        bestIntent = intent
      }
    }

    if (!bestIntent) return null

    const matched = bestIntent.keywords.filter(kw => lowerText.includes(kw.toLowerCase())).length
    const confidence = Math.min(1.0, bestScore * (1 + matched * 0.1))

    return { intent: bestIntent, confidence }
  }

  reset(): void {
    this.intents.clear()
  }
}