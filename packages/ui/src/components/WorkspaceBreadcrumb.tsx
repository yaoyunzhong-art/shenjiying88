'use client';

import React from 'react';
import { Breadcrumb } from './Breadcrumb';

export interface WorkspaceBreadcrumbSegment {
  label: string;
  href?: string;
}

export interface WorkspaceBreadcrumbProps {
  /** Root label, defaults to '总览'. */
  homeLabel?: string;
  /** Optional href for the home / root segment. */
  homeHref?: string;
  /** The current workspace label (e.g. 'configuration'). */
  workspaceLabel: string;
  /** The href to navigate back to the workspace. */
  workspaceHref: string;
  /** Optional intermediate segment for context (e.g. '详情'). */
  intermediateLabel?: string;
  /** The label for the current detail page (the final breadcrumb). */
  detailLabel: string;
  /** Optional extra segments inserted between workspace and detail. */
  extraSegments?: WorkspaceBreadcrumbSegment[];
}

/**
 * WorkspaceBreadcrumb renders the canonical three-tier closure breadcrumb:
 *   Home > Workspace > Detail
 *
 * It is a thin wrapper over the shared Breadcrumb component so every detail
 * page in the admin workbench can adopt the same navigation pattern without
 * each page hand-rolling its own <Breadcrumb items=...> setup.
 */
export function WorkspaceBreadcrumb({
  homeLabel = '总览',
  homeHref = '/',
  workspaceLabel,
  workspaceHref,
  intermediateLabel = '详情',
  detailLabel,
  extraSegments = []
}: WorkspaceBreadcrumbProps) {
  const items: { label: string; href?: string }[] = [];
  if (homeHref) {
    items.push({ label: homeLabel, href: homeHref });
  } else {
    items.push({ label: homeLabel });
  }
  items.push({ label: workspaceLabel, href: workspaceHref });
  if (intermediateLabel) {
    items.push({ label: intermediateLabel });
  }
  for (const segment of extraSegments) {
    items.push({ label: segment.label, href: segment.href });
  }
  items.push({ label: detailLabel });

  return (
    <div
      data-testid="workspace-breadcrumb"
      style={{
        marginBottom: 16,
        fontSize: 13,
        color: '#94a3b8'
      }}
    >
      <Breadcrumb items={items} />
    </div>
  );
}

export default WorkspaceBreadcrumb;
