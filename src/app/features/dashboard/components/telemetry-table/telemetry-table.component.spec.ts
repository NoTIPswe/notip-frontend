import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { CheckedEnvelope, ObfuscatedEnvelope } from '../../../../core/models/measure';
import { TelemetryTableComponent } from './telemetry-table.component';

describe('TelemetryTableComponent', () => {
  let component: TelemetryTableComponent;

  const checked: CheckedEnvelope = {
    gatewayId: 'gw-1',
    sensorId: 'sensor-1',
    sensorType: 'temperature',
    timestamp: '2026-04-02T10:00:00.000Z',
    value: 12.3456,
    unit: 'C',
    isOutofBounds: true,
  };

  const obfuscated: ObfuscatedEnvelope = {
    gatewayId: 'gw-1',
    sensorId: 'sensor-2',
    sensorType: 'humidity',
    timestamp: '2026-04-02T10:00:00.000Z',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TelemetryTableComponent],
    }).compileComponents();

    component = TestBed.createComponent(TelemetryTableComponent).componentInstance;
  });

  it('formats obfuscated value as masked text', () => {
    expect(component.formatValue(obfuscated)).toBe('*** OBFUSCATED ***');
  });

  it('formats finite checked value with fixed precision', () => {
    expect(component.formatValue(checked)).toBe('12.35 C');
  });

  it('formats non finite checked value as n/a', () => {
    const nonFiniteRow: CheckedEnvelope = {
      ...checked,
      value: Number.NaN,
    };

    expect(component.formatValue(nonFiniteRow)).toBe('n/a C');
  });

  it('returns row-alert class only for out-of-bounds checked rows', () => {
    const inRangeRow: CheckedEnvelope = {
      ...checked,
      isOutofBounds: false,
    };

    expect(component.rowClass(checked)).toBe('row-alert');
    expect(component.rowClass(inRangeRow)).toBe('');
    expect(component.rowClass(obfuscated)).toBe('');
  });
});
