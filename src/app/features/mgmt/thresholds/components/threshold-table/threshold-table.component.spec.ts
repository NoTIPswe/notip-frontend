import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SensorThreshold, TypeThreshold } from '../../../../../core/models/threshold';
import { ThresholdTableComponent } from './threshold-table.component';

describe('ThresholdTableComponent', () => {
  let component: ThresholdTableComponent;

  const sensorThreshold: SensorThreshold = {
    type: 'sensorId',
    sensorId: 'sensor-1',
    minValue: 10,
    maxValue: 20,
  };

  const typeThreshold: TypeThreshold = {
    type: 'sensorType',
    sensorType: 'temperature',
    minValue: 0,
    maxValue: 100,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThresholdTableComponent],
    }).compileComponents();

    component = TestBed.createComponent(ThresholdTableComponent).componentInstance;
  });

  it('returns proper key and scope labels', () => {
    expect(component.keyOf(sensorThreshold)).toBe('sensor-1');
    expect(component.scopeOf(sensorThreshold)).toBe('Sensor ID');

    expect(component.keyOf(typeThreshold)).toBe('temperature');
    expect(component.scopeOf(typeThreshold)).toBe('Sensor Type');
  });

  it('emits delete payload using derived key', () => {
    const emitSpy = vi.spyOn(component.deleteRequested, 'emit');

    component.requestDelete(sensorThreshold);

    expect(emitSpy).toHaveBeenCalledWith({
      type: 'sensorId',
      key: 'sensor-1',
    });
  });
});
