import React from 'react';

const assert = require('node:assert/strict');
const { describe, test, before, after } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { Carousel } = require('./Carousel');
import type { CarouselSlide } from './Carousel';

describe('Carousel', () => {
  const slides: CarouselSlide[] = [
    { key: 's1', content: React.createElement('div', null, 'Slide 1 Content'), label: 'First Slide' },
    { key: 's2', content: React.createElement('div', null, 'Slide 2 Content'), label: 'Second Slide' },
    { key: 's3', content: React.createElement('div', null, 'Slide 3 Content'), label: 'Third Slide' },
  ];

  test('returns null for empty slides array', () => {
    const html = renderToStaticMarkup(
      React.createElement(Carousel, { slides: [] })
    );
    assert.equal(html, '');
  });

  test('renders all slides', () => {
    const html = renderToStaticMarkup(
      React.createElement(Carousel, { slides })
    );
    assert.match(html, /Slide 1 Content/);
    assert.match(html, /Slide 2 Content/);
    assert.match(html, /Slide 3 Content/);
  });

  test('renders carousel region with aria label', () => {
    const html = renderToStaticMarkup(
      React.createElement(Carousel, { slides, ariaLabel: 'Product Gallery' })
    );
    assert.match(html, /aria-label="Product Gallery"/);
    assert.match(html, /aria-roledescription="carousel"/);
  });

  test('renders slide aria labels', () => {
    const html = renderToStaticMarkup(
      React.createElement(Carousel, { slides })
    );
    assert.match(html, /aria-label="First Slide"/);
    assert.match(html, /aria-roledescription="slide"/);
  });

  test('renders navigation arrows by default', () => {
    const html = renderToStaticMarkup(
      React.createElement(Carousel, { slides })
    );
    assert.match(html, /aria-label="Previous slide"/);
    assert.match(html, /aria-label="Next slide"/);
  });

  test('hides arrows when showArrows is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(Carousel, { slides, showArrows: false })
    );
    assert.doesNotMatch(html, /aria-label="Previous slide"/);
    assert.doesNotMatch(html, /aria-label="Next slide"/);
  });

  test('hides arrows when only one slide', () => {
    const singleSlide: CarouselSlide[] = [
      { key: 's1', content: 'Only One' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(Carousel, { slides: singleSlide })
    );
    assert.doesNotMatch(html, /aria-label="Previous slide"/);
    assert.doesNotMatch(html, /aria-label="Next slide"/);
  });

  test('renders dot indicators by default', () => {
    const html = renderToStaticMarkup(
      React.createElement(Carousel, { slides })
    );
    assert.match(html, /aria-label="Go to slide 1"/);
    assert.match(html, /aria-label="Go to slide 2"/);
    assert.match(html, /aria-label="Go to slide 3"/);
  });

  test('hides dots when showDots is false', () => {
    const html = renderToStaticMarkup(
      React.createElement(Carousel, { slides, showDots: false })
    );
    assert.doesNotMatch(html, /aria-label="Go to slide/);
  });

  test('hides dots when only one slide', () => {
    const singleSlide: CarouselSlide[] = [
      { key: 's1', content: 'Only One' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(Carousel, { slides: singleSlide })
    );
    assert.doesNotMatch(html, /aria-label="Go to slide/);
  });

  test('first dot has aria-current true', () => {
    const html = renderToStaticMarkup(
      React.createElement(Carousel, { slides })
    );
    assert.match(html, /aria-current="true"/);
  });

  test('renders with autoPlay prop set', () => {
    const html = renderToStaticMarkup(
      React.createElement(Carousel, { slides, autoPlay: 3000 })
    );
    assert.match(html, /Slide 1 Content/);
    assert.match(html, /Slide 2 Content/);
  });

  test('renders with slidesPerView = 2', () => {
    const html = renderToStaticMarkup(
      React.createElement(Carousel, { slides, slidesPerView: 2 })
    );
    assert.match(html, /Slide 1 Content/);
    assert.match(html, /Slide 2 Content/);
  });

  test('renders with gap between slides', () => {
    const html = renderToStaticMarkup(
      React.createElement(Carousel, { slides, gap: 16 })
    );
    assert.match(html, /Slide 1 Content/);
    assert.match(html, /Slide 2 Content/);
  });

  test('renders with card variant', () => {
    const html = renderToStaticMarkup(
      React.createElement(Carousel, { slides, variant: 'card' })
    );
    assert.match(html, /Slide 1 Content/);
    assert.match(html, /Slide 2 Content/);
    // Card variant should have rounded inner container
    assert.match(html, /border-radius:8px/);
  });

  test('renders with fade variant', () => {
    const html = renderToStaticMarkup(
      React.createElement(Carousel, { slides, variant: 'fade' })
    );
    assert.match(html, /Slide 1 Content/);
  });

  test('renders with custom aspect ratio', () => {
    const html = renderToStaticMarkup(
      React.createElement(Carousel, { slides, aspectRatio: '4/3' })
    );
    assert.match(html, /Slide 1 Content/);
    // 4/3 = 75% padding
    assert.match(html, /padding-top:75%/);
  });

  test('renders with default 16/9 aspect ratio', () => {
    const html = renderToStaticMarkup(
      React.createElement(Carousel, { slides })
    );
    assert.match(html, /padding-top:56\.25%/);
  });

  test('renders with fixed height overriding aspect ratio', () => {
    const html = renderToStaticMarkup(
      React.createElement(Carousel, { slides, height: 400 })
    );
    assert.match(html, /Slide 1 Content/);
    assert.doesNotMatch(html, /padding-top/);
  });

  test('renders with loop disabled', () => {
    const html = renderToStaticMarkup(
      React.createElement(Carousel, { slides, loop: false })
    );
    assert.match(html, /Slide 1 Content/);
  });

  test('renders svg chevrons in navigation arrows', () => {
    const html = renderToStaticMarkup(
      React.createElement(Carousel, { slides })
    );
    assert.match(html, /<svg/);
    // Both arrows have SVGs
    const svgCount = (html.match(/<svg/g) || []).length;
    assert.ok(svgCount >= 2);
  });

  test('renders data-testid markers', () => {
    const html = renderToStaticMarkup(
      React.createElement(Carousel, { slides })
    );
    assert.match(html, /data-testid="carousel"/);
    assert.match(html, /data-testid="carousel-track"/);
    assert.match(html, /data-testid="carousel-prev"/);
    assert.match(html, /data-testid="carousel-next"/);
    assert.match(html, /data-testid="carousel-slide-s1"/);
    assert.match(html, /data-testid="carousel-dot-0"/);
    assert.match(html, /data-testid="carousel-dots"/);
  });

  test('default aria label is Carousel', () => {
    const html = renderToStaticMarkup(
      React.createElement(Carousel, { slides })
    );
    assert.match(html, /aria-label="Carousel"/);
  });

  test('track translates to show first slide', () => {
    const html = renderToStaticMarkup(
      React.createElement(Carousel, { slides })
    );
    // First slide: translateX(-0%)
    assert.match(html, /translateX\(-0%\)/);
  });

  test('single slide renders content without arrows or dots', () => {
    const singleSlide: CarouselSlide[] = [
      { key: 'only', content: React.createElement('div', null, 'Single Slide'), label: 'Only Slide' },
    ];
    const html = renderToStaticMarkup(
      React.createElement(Carousel, { slides: singleSlide })
    );
    assert.match(html, /Single Slide/);
    assert.match(html, /aria-label="Only Slide"/);
    assert.doesNotMatch(html, /carousel-prev/);
    assert.doesNotMatch(html, /carousel-next/);
    assert.doesNotMatch(html, /carousel-dot/);
  });

  test('many slides render correctly', () => {
    const manySlides: CarouselSlide[] = Array.from({ length: 10 }, (_, i) => ({
      key: `slide-${i}`,
      content: React.createElement('div', null, `Content ${i}`),
    }));
    const html = renderToStaticMarkup(
      React.createElement(Carousel, { slides: manySlides })
    );
    for (let i = 0; i < 10; i++) {
      assert.match(html, new RegExp(`Content ${i}`));
    }
  });
});
