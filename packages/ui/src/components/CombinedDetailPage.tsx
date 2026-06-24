'use client';

import React, { useState, useCallback } from 'react';
import { DetailShell, type DetailShellAction } from './DetailShell';
import { DetailActionBar, type DetailActionBarAction } from './DetailActionBar';
import { DetailClosureBar, type DetailClosureLink } from './DetailClosureBar';
import { InfoRow } from './InfoRow';
import { ConfirmDialog } from './InfoRow';
import { StatusBadge } from './StatusBadge';
import { Tabs } from './Tabs';
import { useToast } from './Toast';

// ─── Types ────────────────────────────────────────────────────────

export interface DetailInfoRow {
  key: string;
  label: string;
  value: React.ReactNode;
  /** Optional inline status badge next to value. */
  statusBadge?: { label: string; variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' };
}

export interface DetailTab {
  key: string;
  label: string;
  content: React.ReactNode;
}

export interface TransitionAction {
  key: string;
  label: string;
  /** Target status after transition. */
  targetStatus: string;
  variant?: 'primary' | 'secondary' | 'danger';
  /** Optional confirmation dialog before executing transition. */
  confirm?: { title: string; message: string };
  onTransition: () => void | Promise<void>;
}

export interface CombinedDetailPageProps {
  /** Main title for the detail page. */
  title: string;
  /** Subtitle — often the entity id or a short descriptor. */
  subtitle?: string;
  /** Back navigation. */
  backHref?: string;
  backLabel?: string;
  onBack?: () => void;

  /** Current status to render as a status badge. */
  status?: { label: string; variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral' };

  /** Info rows shown above tabs. */
  infoRows?: DetailInfoRow[];

  /** Tabs for organizing detail content. */
  tabs?: DetailTab[];

  /** Default active tab key. */
  defaultTab?: string;

  /** Edit action — shown as a primary button in the shell actions. */
  onEdit?: () => void;
  editLabel?: string;

  /** Delete action with built-in confirmation dialog. */
  onDelete?: () => void | Promise<void>;
  deleteLabel?: string;
  deleteConfirm?: { title: string; message: string };

  /** Status transition actions rendered below info rows. */
  transitions?: TransitionAction[];

  /** Closure bar links. */
  closureLinks?: DetailClosureLink[];

  /** Detail action bar actions (copy, export etc.). */
  actionBarActions?: DetailActionBarAction[];

  /** Loading state. */
  loading?: boolean;
  /** Error message. */
  error?: string;

  /** Test id. */
  'data-testid'?: string;
}

// ─── Component ────────────────────────────────────────────────────

export function CombinedDetailPage({
  title,
  subtitle,
  backHref,
  backLabel = 'Back to list',
  onBack,
  status,
  infoRows,
  tabs,
  defaultTab,
  onEdit,
  editLabel = 'Edit',
  onDelete,
  deleteLabel = 'Delete',
  deleteConfirm = { title: 'Confirm Delete', message: 'Are you sure you want to delete this item? This action cannot be undone.' },
  transitions,
  closureLinks,
  actionBarActions,
  loading = false,
  error,
  'data-testid': testId,
}: CombinedDetailPageProps) {
  const { success, error: toastError } = useToast();
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs?.[0]?.key ?? '');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pendingTransition, setPendingTransition] = useState<TransitionAction | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  const handleDelete = useCallback(async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete();
      success('Successfully deleted');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Delete failed';
      toastError(msg);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  }, [onDelete, success, toastError]);

  const handleTransition = useCallback(async (action: TransitionAction) => {
    if (action.confirm) {
      setPendingTransition(action);
      return;
    }
    await executeTransition(action);
  }, []);

  const executeTransition = useCallback(async (action: TransitionAction) => {
    setTransitioning(true);
    try {
      await action.onTransition();
      success(`Status changed to ${action.targetStatus}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Transition failed';
      toastError(msg);
    } finally {
      setTransitioning(false);
      setPendingTransition(null);
    }
  }, [success, toastError]);

  // Build shell actions
  const shellActions: DetailShellAction[] = [];
  if (onEdit) {
    shellActions.push({ key: 'edit', label: editLabel, variant: 'primary', onClick: onEdit });
  }
  if (onDelete) {
    shellActions.push({ key: 'delete', label: deleteLabel, variant: 'danger', onClick: () => setDeleteDialogOpen(true) });
  }

  return (
    <div data-testid={testId ?? 'combined-detail-page'}>
      <DetailShell
        title={title}
        subtitle={subtitle}
        backHref={backHref}
        backLabel={backLabel}
        onBack={onBack}
        actions={shellActions.length > 0 ? shellActions : undefined}
        loading={loading}
        error={error}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Status badge */}
          {status && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>Status:</span>
              <StatusBadge label={status.label} variant={status.variant ?? 'neutral'} />
            </div>
          )}

          {/* Info rows */}
          {infoRows && infoRows.length > 0 && (
            <InfoRowsSection infoRows={infoRows} />
          )}

          {/* Status transitions */}
          {transitions && transitions.length > 0 && (
            <div
              data-testid="combined-detail-transitions"
              style={{
                border: '1px solid rgba(148,163,184,0.12)',
                borderRadius: 12,
                padding: 16,
                background: 'rgba(15,23,42,0.38)',
              }}
            >
              <h4
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: '0 0 12px',
                }}
              >
                State Transitions
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {transitions.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    data-testid={`transition-${t.key}`}
                    disabled={transitioning}
                    onClick={() => handleTransition(t)}
                    style={{
                      ...transitionButtonStyle,
                      ...(t.variant === 'primary' ? transitionPrimaryStyle : null),
                      ...(t.variant === 'danger' ? transitionDangerStyle : null),
                      ...(transitioning ? disabledButtonStyle : null),
                    }}
                  >
                    {t.label} → {t.targetStatus}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tabs */}
          {tabs && tabs.length > 0 && (
            <div>
              <Tabs
                items={tabs.map((t) => ({ key: t.key, label: t.label }))}
                activeKey={activeTab}
                onChange={setActiveTab}
              />
              <div
                style={{
                  background: 'rgba(15,23,42,0.5)',
                  border: '1px solid rgba(148,163,184,0.12)',
                  borderRadius: 12,
                  padding: 20,
                  marginTop: 12,
                }}
              >
                {tabs.find((t) => t.key === activeTab)?.content}
              </div>
            </div>
          )}
        </div>
      </DetailShell>

      {/* Detail action bar */}
      {actionBarActions && actionBarActions.length > 0 && (
        <div style={{ padding: '0 32px', maxWidth: 960, margin: '0 auto' }}>
          <DetailActionBar actions={actionBarActions} />
        </div>
      )}

      {/* Closure bar */}
      {closureLinks && closureLinks.length > 0 && (
        <div style={{ padding: '0 32px', maxWidth: 960, margin: '0 auto' }}>
          <DetailClosureBar links={closureLinks} />
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title={deleteConfirm.title}
        message={deleteConfirm.message}
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />

      {/* Transition confirmation dialog */}
      {pendingTransition && (
        <ConfirmDialog
          open={true}
          title={pendingTransition.confirm!.title}
          message={pendingTransition.confirm!.message}
          confirmLabel={transitioning ? 'Processing...' : 'Confirm'}
          variant={pendingTransition.variant === 'danger' ? 'danger' : 'default'}
          onConfirm={() => executeTransition(pendingTransition)}
          onCancel={() => setPendingTransition(null)}
        />
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────

function InfoRowsSection({ infoRows }: { infoRows: DetailInfoRow[] }) {
  return (
    <div
      data-testid="combined-detail-info-rows"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16,
        background: 'rgba(15,23,42,0.5)',
        border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: 12,
        padding: 20,
      }}
    >
      {infoRows.map((row) => (
        <div key={row.key} data-testid={`info-row-${row.key}`}>
          <InfoRow label={row.label} value={row.value} />
          {row.statusBadge && (
            <div style={{ marginTop: 6 }}>
              <StatusBadge
                label={row.statusBadge.label}
                variant={row.statusBadge.variant ?? 'neutral'}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────

const transitionButtonStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 500,
  borderRadius: 8,
  border: '1px solid rgba(148,163,184,0.14)',
  background: 'rgba(59,130,246,0.08)',
  color: '#93c5fd',
  cursor: 'pointer',
  transition: 'all 0.15s',
};

const transitionPrimaryStyle: React.CSSProperties = {
  border: '1px solid rgba(96,165,250,0.35)',
  background: 'rgba(59,130,246,0.16)',
  color: '#bfdbfe',
};

const transitionDangerStyle: React.CSSProperties = {
  border: '1px solid rgba(239,68,68,0.35)',
  background: 'rgba(239,68,68,0.1)',
  color: '#fecaca',
};

const disabledButtonStyle: React.CSSProperties = {
  cursor: 'not-allowed',
  opacity: 0.55,
};

export default CombinedDetailPage;
