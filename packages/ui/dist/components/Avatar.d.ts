import React from 'react';
export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AvatarStatus = 'online' | 'offline' | 'busy' | 'away' | 'none';
export interface AvatarProps {
    /** Image source URL. If provided and loads, it takes precedence over initials. */
    src?: string;
    /** Fallback initials when no image or image fails to load (max 2 chars shown). */
    initials?: string;
    /** Alt text for the image. */
    alt?: string;
    /** Size variant. */
    size?: AvatarSize;
    /** Status indicator dot. */
    status?: AvatarStatus;
    /** Custom background color for initials fallback. */
    bgColor?: string;
    /** Custom text color for initials fallback. */
    textColor?: string;
    /** Click handler. */
    onClick?: () => void;
    /** Optional className for external styling. */
    className?: string;
    /** Optional style overrides. */
    style?: React.CSSProperties;
}
export declare function Avatar({ src, initials, alt, size, status, bgColor, textColor, onClick, className, style, }: AvatarProps): React.JSX.Element;
export interface AvatarGroupProps {
    children: React.ReactNode;
    /** Max visible avatars before showing +N overflow badge. */
    max?: number;
    /** Spacing between stacked avatars (negative margin). */
    spacing?: number;
}
export declare function AvatarGroup({ children, max, spacing }: AvatarGroupProps): React.JSX.Element;
