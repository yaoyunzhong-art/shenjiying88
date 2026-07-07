import { describe, it, expect } from 'vitest';
import { ContentModule } from './content.module';

describe('ContentModule', () => {
  it('should be defined', () => {
    const module = new ContentModule();
    expect(module).toBeDefined();
  });

  it('should have ContentController in controllers', () => {
    const module = new ContentModule();
    const metadata = Reflect.getMetadata('controllers', ContentModule);
    expect(metadata).toBeDefined();
    expect(metadata.length).toBe(1);
    expect(metadata[0].name).toBe('ContentController');
  });

  it('should have ContentService in providers', () => {
    const metadata = Reflect.getMetadata('providers', ContentModule);
    expect(metadata).toBeDefined();
    expect(metadata.length).toBe(1);
    expect(metadata[0].name).toBe('ContentService');
  });

  it('should export ContentService', () => {
    const metadata = Reflect.getMetadata('exports', ContentModule);
    expect(metadata).toBeDefined();
    expect(metadata.length).toBe(1);
    expect(metadata[0].name).toBe('ContentService');
  });
});
