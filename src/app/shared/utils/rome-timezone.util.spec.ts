import { describe, expect, it } from 'vitest';
import {
  formatRomeDateTime,
  fromRomeDateTimeInputToIso,
  toRomeDateTimeInput,
} from './rome-timezone.util';

describe('rome-timezone.util', () => {
  it('formats UTC values in Europe/Rome and respects DST', () => {
    expect(formatRomeDateTime('2026-01-15T10:30:45.000Z')).toBe('15/01/2026 - 11:30:45');
    expect(formatRomeDateTime('2026-07-15T10:30:45.000Z')).toBe('15/07/2026 - 12:30:45');
  });

  it('converts Europe/Rome datetime-local values to UTC ISO', () => {
    expect(fromRomeDateTimeInputToIso('2026-01-15T11:30')).toBe('2026-01-15T10:30:00.000Z');
    expect(fromRomeDateTimeInputToIso('2026-07-15T12:30')).toBe('2026-07-15T10:30:00.000Z');
  });

  it('converts UTC ISO values to Europe/Rome datetime-local format', () => {
    expect(toRomeDateTimeInput('2026-01-15T10:30:45.000Z')).toBe('2026-01-15T11:30');
    expect(toRomeDateTimeInput('2026-07-15T10:30:45.000Z')).toBe('2026-07-15T12:30');
  });

  it('returns null/empty/undefined for invalid values', () => {
    expect(formatRomeDateTime('invalid')).toBeNull();
    expect(toRomeDateTimeInput('invalid')).toBe('');
    expect(fromRomeDateTimeInputToIso('invalid')).toBeUndefined();
  });
});
