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
