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

  it('formats values without seconds when requested', () => {
    expect(formatRomeDateTime('2026-01-15T10:30:45.000Z', false)).toBe('15/01/2026 - 11:30');
  });

  it('converts Europe/Rome datetime-local values to UTC ISO', () => {
    expect(fromRomeDateTimeInputToIso('2026-01-15T11:30')).toBe('2026-01-15T10:30:00.000Z');
    expect(fromRomeDateTimeInputToIso('2026-07-15T12:30')).toBe('2026-07-15T10:30:00.000Z');
    expect(fromRomeDateTimeInputToIso('2026-01-15T11:30:45')).toBe('2026-01-15T10:30:45.000Z');
  });

  it('converts UTC ISO values to Europe/Rome datetime-local format', () => {
    expect(toRomeDateTimeInput('2026-01-15T10:30:45.000Z')).toBe('2026-01-15T11:30');
    expect(toRomeDateTimeInput('2026-07-15T10:30:45.000Z')).toBe('2026-07-15T12:30');
    expect(toRomeDateTimeInput(new Date('2026-01-15T10:30:45.000Z'))).toBe('2026-01-15T11:30');
    expect(toRomeDateTimeInput(Date.parse('2026-07-15T10:30:45.000Z'))).toBe('2026-07-15T12:30');
  });

  it('returns null/empty/undefined for invalid values', () => {
    expect(formatRomeDateTime('invalid')).toBeNull();
    expect(formatRomeDateTime('')).toBeNull();
    expect(formatRomeDateTime(null)).toBeNull();
    expect(toRomeDateTimeInput('invalid')).toBe('');
    expect(toRomeDateTimeInput('')).toBe('');
    expect(toRomeDateTimeInput(undefined)).toBe('');
    expect(fromRomeDateTimeInputToIso('invalid')).toBeUndefined();
    expect(fromRomeDateTimeInputToIso('   ')).toBeUndefined();
    expect(fromRomeDateTimeInputToIso()).toBeUndefined();
  });

  it('returns undefined for invalid datetime-local ranges', () => {
    expect(fromRomeDateTimeInputToIso('2026-13-15T11:30')).toBeUndefined();
    expect(fromRomeDateTimeInputToIso('2026-00-15T11:30')).toBeUndefined();
    expect(fromRomeDateTimeInputToIso('2026-01-00T11:30')).toBeUndefined();
    expect(fromRomeDateTimeInputToIso('2026-01-15T24:00')).toBeUndefined();
    expect(fromRomeDateTimeInputToIso('2026-01-15T11:60')).toBeUndefined();
    expect(fromRomeDateTimeInputToIso('2026-01-15T11:30:60')).toBeUndefined();
  });
});
