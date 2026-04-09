import { describe, expect, it } from 'vitest';
import { RomeDateTimePipe } from './rome-date-time.pipe';

describe('RomeDateTimePipe', () => {
  const pipe = new RomeDateTimePipe();

  it('formats date-time with seconds by default', () => {
    expect(pipe.transform('2026-01-15T10:30:45.000Z')).toBe('15/01/2026 - 11:30:45');
  });

  it('formats date-time without seconds when requested', () => {
    expect(pipe.transform('2026-01-15T10:30:45.000Z', false)).toBe('15/01/2026 - 11:30');
  });

  it('returns null for invalid or empty input', () => {
    expect(pipe.transform('invalid')).toBeNull();
    expect(pipe.transform(null)).toBeNull();
    expect(pipe.transform(undefined)).toBeNull();
  });
});
