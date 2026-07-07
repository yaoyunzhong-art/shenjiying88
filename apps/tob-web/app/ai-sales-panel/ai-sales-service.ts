import {
  MOCK_RECOMMENDATIONS,
  MOCK_OBJECTIONS,
  MOCK_FOLLOW_UPS,
  MOCK_SCRIPTS,
  type RecommendedProduct,
  type ObjectionCase,
  type FollowUpTask,
  type SalesScript,
  type ObjectionType,
  type ToneType,
} from './ai-sales-data';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 跨推荐 / 上销 / 交叉销售共用的 filter+slice 模板
 * 集中维护默认 limit 与 mock 数据引用，未来加 query 维度仅 1 处
 */
async function filterRecommendations(
  predicate: (product: RecommendedProduct) => boolean,
  limit: number,
  delayMs: number
): Promise<RecommendedProduct[]> {
  await delay(delayMs);
  return MOCK_RECOMMENDATIONS.filter(predicate).slice(0, limit);
}

/**
 * Get product recommendations for a customer
 */
export async function getRecommendations(customerId: string): Promise<RecommendedProduct[]> {
  // In real app, would filter by customer preferences, purchase history, etc.
  return filterRecommendations(() => true, MOCK_RECOMMENDATIONS.length, 300);
}

/**
 * Get upsell recommendations for a specific product
 */
export async function getUpsellRecommendations(productId: string): Promise<RecommendedProduct[]> {
  // Return higher-tier alternatives or premium versions
  return filterRecommendations(r => r.matchScore > 85, 3, 200);
}

/**
 * Get cross-sell recommendations for a specific product
 */
export async function getCrossSellRecommendations(productId: string): Promise<RecommendedProduct[]> {
  // Return complementary products
  // matchScore <= 85 → ensures disjoint from upsell band (>85)
  return filterRecommendations(r => r.matchScore <= 85 && r.matchScore > 70, 3, 200);
}

/**
 * Handle customer objection with AI response
 */
export async function handleObjection(
  objectionType: ObjectionType,
  context: { productId?: string; customerName?: string }
): Promise<{ response: string; suggestedQuestions: string[] }> {
  await delay(400);

  const objection = MOCK_OBJECTIONS.find(o => o.type === objectionType);
  if (!objection) {
    return {
      response: '抱歉，暂未找到相关应对话术，请联系管理人员。',
      suggestedQuestions: [],
    };
  }

  const suggestedQuestions = [
    objection.customerQuestion,
    '能详细说说您的顾虑吗？',
    '我可以为您提供哪些额外保障？',
  ];

  return {
    response: objection.aiResponse,
    suggestedQuestions,
  };
}

/**
 * Get follow-up tasks for a sales person
 */
export async function getFollowUps(salesId: string): Promise<FollowUpTask[]> {
  await delay(250);
  return MOCK_FOLLOW_UPS;
}

/**
 * Mark a follow-up task as completed
 */
export async function completeFollowUp(taskId: string): Promise<FollowUpTask | null> {
  await delay(200);
  const task = MOCK_FOLLOW_UPS.find(t => t.id === taskId);
  if (!task) return null;
  return { ...task, status: 'completed' };
}

/**
 * Get sales script for a product with specified tone
 */
export async function getSalesScript(
  productId: string,
  tone: ToneType
): Promise<SalesScript | null> {
  await delay(300);
  const script = MOCK_SCRIPTS.find(
    s => s.productId === productId && s.tone === tone
  );
  return script || MOCK_SCRIPTS.find(s => s.productId === productId) || null;
}
