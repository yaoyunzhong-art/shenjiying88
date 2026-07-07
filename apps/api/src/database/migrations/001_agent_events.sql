-- Phase-33: EventStore Postgres Schema
-- 用途: 持久化 Agent 会话事件, 跨实例共享, 重启不丢失
-- 设计: 见 DR-34 §4.1

CREATE TABLE IF NOT EXISTS agent_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  TEXT NOT NULL,
  event_id    BIGINT NOT NULL,           -- session 内单调递增 (Phase-32 id)
  event_type  TEXT NOT NULL,             -- session_started / message_added / ...
  tenant_id   TEXT NOT NULL,             -- 多租户隔离
  payload     JSONB NOT NULL,            -- 完整 AgentSessionEvent
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_events_session_id ON agent_events (session_id, event_id);
CREATE INDEX IF NOT EXISTS idx_agent_events_tenant_id ON agent_events (tenant_id, created_at DESC);

-- LISTEN/NOTIFY 触发器 (DR-34 §4.1)
CREATE OR REPLACE FUNCTION notify_agent_event() RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('agent_events', json_build_object(
    'session_id', NEW.session_id,
    'event_id', NEW.event_id,
    'event_type', NEW.event_type,
    'tenant_id', NEW.tenant_id
  )::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_agent_events_notify ON agent_events;
CREATE TRIGGER trg_agent_events_notify
AFTER INSERT ON agent_events
FOR EACH ROW EXECUTE FUNCTION notify_agent_event();