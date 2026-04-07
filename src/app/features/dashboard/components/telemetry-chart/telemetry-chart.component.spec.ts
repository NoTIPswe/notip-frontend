import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CheckedEnvelope, ObfuscatedEnvelope } from '../../../../core/models/measure';
import { TelemetryChartComponent } from './telemetry-chart.component';

// Mock for Chart.js
vi.mock('chart.js', () => {
  const Chart = class Chart {
    constructor(el: unknown, config: unknown) {
      void el;

      const chartConfig =
        (config as {
          data?: {
            labels?: unknown[];
            datasets?: Array<{ label?: string; data?: unknown[] }>;
          };
        }) ?? {};

      this.data = {
        labels: chartConfig.data?.labels ?? [],
        datasets: chartConfig.data?.datasets ?? [],
      };
    }
    update() {}
    destroy() {}
    data = {
      labels: [],
      datasets: [] as Array<{ label?: string; data?: unknown[] }>,
    };
    static register(...args: unknown[]) {
      void args;
    }
  };
  return {
    Chart,
    registerables: [],
  };
});

type ChartDataSnapshot = {
  labels: unknown[];
  datasets: Array<{ label?: string; data?: unknown[] }>;
};

type TelemetryChartComponentInternals = {
  chartInstance?: {
    data: ChartDataSnapshot;
    update: (mode?: string) => void;
    destroy: () => void;
  };
  formatTimestamp: (value: string) => string;
  withAlpha: (color: string, alpha: number) => string;
};

describe('TelemetryChartComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TelemetryChartComponent>>;
  let component: TelemetryChartComponent;

  const mockMeasures: Array<CheckedEnvelope | ObfuscatedEnvelope> = [
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
      sensorId: 'sensor-2',
      sensorType: 'humidity',
      timestamp: '2026-04-02T10:01:00.000Z',
      value: 55,
      unit: '%',
      isOutofBounds: false,
    },
    {
      gatewayId: 'gw-2',
      sensorId: 'sensor-1',
      timestamp: '2026-04-02T10:02:00.000Z',
      value: 12,
      unit: 'C',
      isOutofBounds: false,
      sensorType: 'temperature',
    },
    {
      gatewayId: 'gw-1',
      sensorId: 'obf-1',
      sensorType: 'humidity',
      timestamp: '2026-04-02T10:03:00.000Z',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TelemetryChartComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TelemetryChartComponent);
    component = fixture.componentInstance;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('computes unique decrypted sensor IDs only', () => {
    fixture.componentRef.setInput('measures', mockMeasures);
    fixture.detectChanges();
    expect(component.uniqueCheckedSensorIds()).toEqual(['sensor-1', 'sensor-2']);
  });

  it('renders one dataset for each decrypted sensor', () => {
    fixture.componentRef.setInput('measures', mockMeasures);
    fixture.detectChanges();

    const chartData = ((component as unknown as { chartInstance?: { data: unknown } }).chartInstance
      ?.data ?? {
      labels: [],
      datasets: [],
    }) as {
      labels: unknown[];
      datasets: Array<{ label?: string; data?: unknown[] }>;
    };

    expect(chartData.labels.length).toBeGreaterThan(0);
    expect(chartData.datasets).toHaveLength(2);
    expect(chartData.datasets.map((dataset) => dataset.label)).toEqual(['sensor-1', 'sensor-2']);
  });

  it('updates the existing chart instance when data changes', () => {
    fixture.componentRef.setInput('measures', mockMeasures);
    fixture.detectChanges();

    const internals = component as unknown as TelemetryChartComponentInternals;
    const existingChart = internals.chartInstance;
    expect(existingChart).toBeTruthy();

    const updateSpy = vi.spyOn(existingChart!, 'update');

    const newMeasures: Array<CheckedEnvelope | ObfuscatedEnvelope> = [
      ...mockMeasures,
      {
        gatewayId: 'gw-1',
        sensorId: 'sensor-2',
        sensorType: 'humidity',
        timestamp: '2026-04-02T10:05:00.000Z',
        value: 58,
        unit: '%',
        isOutofBounds: false,
      },
    ];

    fixture.componentRef.setInput('measures', newMeasures);
    fixture.detectChanges();

    expect(internals.chartInstance).toBe(existingChart);
    expect(updateSpy).toHaveBeenCalledWith('none');
  });

  it('falls back to lexicographic sorting when timestamps are invalid', () => {
    const invalidTimestampMeasures: Array<CheckedEnvelope | ObfuscatedEnvelope> = [
      {
        gatewayId: 'gw-1',
        sensorId: 'sensor-1',
        sensorType: 'temperature',
        timestamp: 'bad-z',
        value: 10,
        unit: 'C',
        isOutofBounds: false,
      },
      {
        gatewayId: 'gw-1',
        sensorId: 'sensor-1',
        sensorType: 'temperature',
        timestamp: 'bad-a',
        value: 12,
        unit: 'C',
        isOutofBounds: false,
      },
    ];

    fixture.componentRef.setInput('measures', invalidTimestampMeasures);
    fixture.detectChanges();

    const chartData = (component as unknown as TelemetryChartComponentInternals).chartInstance
      ?.data ?? {
      labels: [],
      datasets: [],
    };

    expect(chartData.labels).toEqual(['bad-a', 'bad-z']);
  });

  it('returns original value for unparseable timestamp formatting', () => {
    const internals = component as unknown as TelemetryChartComponentInternals;

    expect(internals.formatTimestamp('not-a-timestamp')).toBe('not-a-timestamp');
  });

  it('returns original color when withAlpha receives invalid hex color', () => {
    const internals = component as unknown as TelemetryChartComponentInternals;

    expect(internals.withAlpha('#123', 0.5)).toBe('#123');
  });

  it('reports no decrypted data when only obfuscated rows are available', () => {
    fixture.componentRef.setInput('measures', [mockMeasures[3]]);
    fixture.detectChanges();

    expect(component.hasDecryptedMeasures()).toBe(false);
  });

  it('counts obfuscated rows only', () => {
    fixture.componentRef.setInput('measures', mockMeasures);
    fixture.detectChanges();
    expect(component.obfuscatedCount()).toBe(1);
  });
});
