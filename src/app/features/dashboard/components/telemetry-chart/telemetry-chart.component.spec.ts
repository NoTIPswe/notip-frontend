import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CheckedEnvelope, ObfuscatedEnvelope } from '../../../../core/models/measure';
import { TelemetryChartComponent } from './telemetry-chart.component';

// Mock for Chart.js
vi.mock('chart.js', () => {
  const Chart = class Chart {
    constructor(el: unknown, config: unknown) {
      void el;
      void config;
    }
    update() {}
    destroy() {}
    data = {
      labels: [],
      datasets: [{ data: [] }],
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

  it('should compute unique sensor IDs', () => {
    fixture.componentRef.setInput('measures', mockMeasures);
    fixture.detectChanges();
    expect(component.uniqueSensorIds()).toEqual(['sensor-1', 'sensor-2', 'obf-1']);
  });

  it('should auto-select the first sensor', () => {
    expect(component.selectedSensorId()).toBeNull();
    fixture.componentRef.setInput('measures', mockMeasures);
    fixture.detectChanges(); // Trigger effects
    expect(component.selectedSensorId()).toBe('sensor-1');
  });

  it('should update selected sensor on user selection', () => {
    fixture.componentRef.setInput('measures', mockMeasures);
    fixture.detectChanges();
    const event = { target: { value: 'sensor-2' } } as unknown as Event;
    component.onSensorSelected(event);
    expect(component.selectedSensorId()).toBe('sensor-2');
  });

  it('counts obfuscated rows only', () => {
    fixture.componentRef.setInput('measures', mockMeasures);
    fixture.detectChanges();
    expect(component.obfuscatedCount()).toBe(1);
  });
});
