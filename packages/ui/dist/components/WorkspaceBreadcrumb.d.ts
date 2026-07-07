import React from 'react';
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
export declare function WorkspaceBreadcrumb({ homeLabel, homeHref, workspaceLabel, workspaceHref, intermediateLabel, detailLabel, extraSegments }: WorkspaceBreadcrumbProps): React.JSX.Element;
export default WorkspaceBreadcrumb;
