import {
  MOCK_EVENTS,
  MOCK_REPORTS,
  MOCK_PERFORMANCES,
  type TeamBuildingEvent,
  type EventReport,
  type PerformanceRecord,
} from './team-building-data';

// Simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get all team building events
 */
export async function getEvents(): Promise<TeamBuildingEvent[]> {
  await delay(300);
  return MOCK_EVENTS;
}

/**
 * Get event report by event ID
 */
export async function getReport(eventId: string): Promise<EventReport | null> {
  await delay(250);
  return MOCK_REPORTS.find(r => r.eventId === eventId) || null;
}

/**
 * Generate AI-powered event report
 */
export async function generateReport(eventId: string): Promise<EventReport> {
  await delay(800);
  const existingReport = MOCK_REPORTS.find(r => r.eventId === eventId);
  if (existingReport) {
    return {
      ...existingReport,
      generatedAt: new Date().toISOString(),
    };
  }
  
  // Generate new report for event without existing report
  const event = MOCK_EVENTS.find(e => e.id === eventId);
  if (!event) {
    throw new Error('Event not found');
  }

  return {
    id: `R${Date.now()}`,
    eventId,
    summary: `AI分析：${event.name}活动整体表现良好。通过数据分析，参与者在团队协作和沟通方面都有明显进步。建议未来活动增加更多互动环节。`,
    achievements: [
      '活动组织有序',
      '参与度高于预期',
      '员工反馈积极',
    ],
    participationRate: 92,
    budgetUsage: 85,
    satisfactionScore: 4.5,
    generatedAt: new Date().toISOString(),
    highlights: event.highlights,
  };
}

/**
 * Get member performance records for an event
 */
export async function getMemberPerformances(eventId: string): Promise<PerformanceRecord[]> {
  await delay(300);
  return MOCK_PERFORMANCES.filter(p => p.eventId === eventId);
}
