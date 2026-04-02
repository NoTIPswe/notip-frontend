import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThresholdFormComponent } from './threshold-form.component';

describe('ThresholdFormComponent', () => {
  let component: ThresholdFormComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThresholdFormComponent],
    }).compileComponents();

    component = TestBed.createComponent(ThresholdFormComponent).componentInstance;
  });

  it('does not emit type threshold when sensor type is empty', () => {
    const event = { preventDefault: vi.fn() } as unknown as Event;
    const emitSpy = vi.spyOn(component.typeSubmitted, 'emit');

    component.submitType(event, '   ', '1', '2');

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('emits parsed type threshold payload', () => {
    const event = { preventDefault: vi.fn() } as unknown as Event;
    const emitSpy = vi.spyOn(component.typeSubmitted, 'emit');

    component.submitType(event, ' temperature ', '1.5', '9.5');

    expect(emitSpy).toHaveBeenCalledWith({
      sensorType: 'temperature',
      minValue: 1.5,
      maxValue: 9.5,
    });
  });

  it('omits undefined numeric fields in type threshold payload', () => {
    const event = { preventDefault: vi.fn() } as unknown as Event;
    const emitSpy = vi.spyOn(component.typeSubmitted, 'emit');

    component.submitType(event, 'temperature', 'not-number', '');

    expect(emitSpy).toHaveBeenCalledWith({
      sensorType: 'temperature',
    });
  });

  it('emits parsed sensor threshold payload', () => {
    const event = { preventDefault: vi.fn() } as unknown as Event;
    const emitSpy = vi.spyOn(component.sensorSubmitted, 'emit');

    component.submitSensor(event, ' sensor-1 ', '2', 'not-number');

    expect(emitSpy).toHaveBeenCalledWith({
      sensorId: 'sensor-1',
      minValue: 2,
    });
  });
});
