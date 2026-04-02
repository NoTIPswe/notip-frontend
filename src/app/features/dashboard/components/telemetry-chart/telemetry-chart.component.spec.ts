import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { CheckedEnvelope, ObfuscatedEnvelope } from '../../../../core/models/measure';
import { TelemetryChartComponent } from './telemetry-chart.component';

describe('TelemetryChartComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TelemetryChartComponent>>;
  let component: TelemetryChartComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TelemetryChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TelemetryChartComponent);
    component = fixture.componentInstance;
  });

  it('returns empty points when max absolute value is zero', () => {
    const zeroValueRows: CheckedEnvelope[] = [
      {
        gatewayId: 'gw-1',
        sensorId: 'sensor-1',
        sensorType: 'temperature',
        timestamp: '2026-04-02T10:00:00.000Z',
        value: 0,
        unit: 'C',
        isOutofBounds: false,
      },
    ];

    fixture.componentRef.setInput('measures', zeroValueRows);

    expect(component.points()).toEqual([]);
  });

  it('builds normalized points from the last 10 finite decrypted rows', () => {
    const decryptedRows: CheckedEnvelope[] = Array.from({ length: 12 }, (_value, index) => ({
      gatewayId: 'gw-1',
      sensorId: `sensor-${index + 1}`,
      sensorType: 'temperature',
      timestamp: `2026-04-02T10:00:${String(index).padStart(2, '0')}.000Z`,
      value: index + 1,
      unit: 'C',
      isOutofBounds: false,
    }));

    const withInvalidAndObfuscated: Array<CheckedEnvelope | ObfuscatedEnvelope> = [
      ...decryptedRows,
      {
        ...decryptedRows[0],
        sensorId: 'invalid',
        value: Number.NaN,
      },
      {
        gatewayId: 'gw-1',
        sensorId: 'obf-1',
        sensorType: 'humidity',
        timestamp: '2026-04-02T10:20:00.000Z',
      },
    ];

    fixture.componentRef.setInput('measures', withInvalidAndObfuscated);

    const points = component.points();
    expect(points).toHaveLength(10);
    expect(points[0]).toMatchObject({
      sensorId: 'sensor-3',
      value: 3,
      widthPct: 25,
    });
    expect(points[9]).toMatchObject({
      sensorId: 'sensor-12',
      value: 12,
      widthPct: 100,
    });
  });

  it('counts obfuscated rows only', () => {
    const rows: Array<CheckedEnvelope | ObfuscatedEnvelope> = [
      {
        gatewayId: 'gw-1',
        sensorId: 'sensor-1',
        sensorType: 'temperature',
        timestamp: '2026-04-02T10:00:00.000Z',
        value: 10,
        unit: 'C',
        isOutofBounds: false,
      },
      {
        gatewayId: 'gw-1',
        sensorId: 'obf-1',
        sensorType: 'humidity',
        timestamp: '2026-04-02T10:01:00.000Z',
      },
      {
        gatewayId: 'gw-2',
        sensorId: 'obf-2',
        sensorType: 'humidity',
        timestamp: '2026-04-02T10:02:00.000Z',
      },
    ];

    fixture.componentRef.setInput('measures', rows);

    expect(component.obfuscatedCount()).toBe(2);
  });
});
