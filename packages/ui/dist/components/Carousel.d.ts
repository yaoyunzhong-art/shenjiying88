import React from 'react';
export interface CarouselSlide {
    key: string;
    content: React.ReactNode;
    /** Optional aria label for the slide */
    label?: string;
}
export interface CarouselProps {
    slides: CarouselSlide[];
    /** Auto-play interval in ms. 0 disables auto-play. */
    autoPlay?: number;
    /** Show navigation arrows */
    showArrows?: boolean;
    /** Show dot indicators */
    showDots?: boolean;
    /** Infinite loop */
    loop?: boolean;
    /** Number of slides visible at once */
    slidesPerView?: number;
    /** Gap between slides in px */
    gap?: number;
    /** Aspect ratio, e.g. '16/9', '4/3', '1/1' */
    aspectRatio?: string;
    /** Visual variant */
    variant?: 'default' | 'fade' | 'card';
    /** Height in px (overrides aspectRatio) */
    height?: number;
    /** Aria label for the carousel */
    ariaLabel?: string;
}
export declare function Carousel({ slides, autoPlay, showArrows, showDots, loop, slidesPerView, gap, aspectRatio, variant, height, ariaLabel, }: CarouselProps): React.JSX.Element | null;
