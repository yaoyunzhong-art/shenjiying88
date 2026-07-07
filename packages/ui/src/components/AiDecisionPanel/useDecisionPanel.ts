'use client'

/**
 * AI决策面板 - Hook
 */

import { useCallback, useState } from 'react'
import { useDecisionEvents, useHandleEvent } from './useDecisionPanel.mock'
import type { DecisionEvent, DecisionPanelConfig } from './types'

export interface UseDecisionPanelOptions {
  config?: DecisionPanelConfig
}

export function useDecisionPanel({ config }: UseDecisionPanelOptions = {}) {
  const { events, loading, error } = useDecisionEvents({
    typeFilter: config?.typeFilter,
    severityFilter: config?.severityFilter,
    maxEvents: config?.maxEvents,
  })
  const handleEvent = useHandleEvent()

  const [selectedEvent, setSelectedEvent] = useState<DecisionEvent | null>(null)

  const handleSelectEvent = useCallback((event: DecisionEvent) => {
    setSelectedEvent(event)
  }, [])

  const handleDismissDetail = useCallback(() => {
    setSelectedEvent(null)
  }, [])

  const handleMarkHandled = useCallback(
    (eventId: string, handledBy: string) => {
      handleEvent.mutate({ eventId, handledBy })
      setSelectedEvent((prev) =>
        prev && prev.id === eventId
          ? { ...prev, handled: true, handledBy, handledAt: new Date().toISOString() }
          : prev,
      )
    },
    [handleEvent],
  )

  return {
    events,
    loading,
    error,
    selectedEvent,
    handleSelectEvent,
    handleDismissDetail,
    handleMarkHandled,
  }
}
