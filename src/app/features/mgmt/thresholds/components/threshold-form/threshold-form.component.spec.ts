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

  it('does not emit sensor threshold when sensor id is empty', () => {
    const event = { preventDefault: vi.fn() } as unknown as Event;
    const emitSpy = vi.spyOn(component.sensorSubmitted, 'emit');

    component.submitSensor(event, '   ', '1', '2');

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('accepts sensor type and sensor id options', () => {
    const fixture = TestBed.createComponent(ThresholdFormComponent);
    fixture.componentRef.setInput('sensorTypes', ['temperature', 'humidity']);
    fixture.componentRef.setInput('sensorIds', ['sensor-1', 'sensor-2']);
    fixture.detectChanges();

    expect(fixture.componentInstance.sensorTypes()).toEqual(['temperature', 'humidity']);
    expect(fixture.componentInstance.sensorIds()).toEqual(['sensor-1', 'sensor-2']);
  });

  it('switches mode when requested and options exist', () => {
    const fixture = TestBed.createComponent(ThresholdFormComponent);
    fixture.componentRef.setInput('sensorTypes', ['temperature']);
    fixture.componentRef.setInput('sensorIds', ['sensor-1']);
    fixture.detectChanges();

    fixture.componentInstance.selectMode('sensor');

    expect(fixture.componentInstance.selectedMode()).toBe('sensor');
  });

  it('keeps type mode when sensor options are missing', () => {
    const fixture = TestBed.createComponent(ThresholdFormComponent);
    fixture.componentRef.setInput('sensorTypes', ['temperature']);
    fixture.componentRef.setInput('sensorIds', []);
    fixture.detectChanges();

    fixture.componentInstance.selectMode('sensor');

    expect(fixture.componentInstance.selectedMode()).toBe('type');
  });

  it('keeps sensor mode when type options are missing', () => {
    const fixture = TestBed.createComponent(ThresholdFormComponent);
    fixture.componentRef.setInput('sensorTypes', []);
    fixture.componentRef.setInput('sensorIds', ['sensor-1']);
    fixture.detectChanges();

    fixture.componentInstance.selectMode('type');

    expect(fixture.componentInstance.selectedMode()).toBe('sensor');
  });

  it('auto-falls back to sensor mode when no type options are available', () => {
    const fixture = TestBed.createComponent(ThresholdFormComponent);
    fixture.componentRef.setInput('sensorTypes', []);
    fixture.componentRef.setInput('sensorIds', ['sensor-1']);
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedMode()).toBe('sensor');
  });

  it('auto-falls back to type mode when no sensor options are available', () => {
    const fixture = TestBed.createComponent(ThresholdFormComponent);
    fixture.componentRef.setInput('sensorTypes', ['temperature']);
    fixture.componentRef.setInput('sensorIds', ['sensor-1']);
    fixture.detectChanges();

    fixture.componentInstance.selectMode('sensor');
    fixture.componentRef.setInput('sensorIds', []);
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedMode()).toBe('type');
  });

  it('emits cancel event', () => {
    const emitSpy = vi.spyOn(component.cancelRequested, 'emit');

    component.cancel();

    expect(emitSpy).toHaveBeenCalledOnce();
  });
});
