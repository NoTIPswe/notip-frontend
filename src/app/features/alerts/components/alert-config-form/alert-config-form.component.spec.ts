import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AlertConfigFormComponent } from './alert-config-form.component';

describe('AlertConfigFormComponent', () => {
  let component: AlertConfigFormComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertConfigFormComponent],
    }).compileComponents();

    component = TestBed.createComponent(AlertConfigFormComponent).componentInstance;
  });

  it('emits default timeout when value is valid', () => {
    const preventDefault = vi.fn();
    const event = { preventDefault } as unknown as Event;
    const emitSpy = vi.spyOn(component.defaultSubmitted, 'emit');

    component.submitDefault(event, '3000');

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith({ timeoutMs: 3000 });
  });

  it('does not emit default timeout for invalid values', () => {
    const preventDefault = vi.fn();
    const event = { preventDefault } as unknown as Event;
    const emitSpy = vi.spyOn(component.defaultSubmitted, 'emit');

    component.submitDefault(event, '0');
    component.submitDefault(event, 'abc');

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('emits gateway timeout for valid payload', () => {
    const preventDefault = vi.fn();
    const event = { preventDefault } as unknown as Event;
    const emitSpy = vi.spyOn(component.gatewaySubmitted, 'emit');

    component.submitGateway(event, ' gw-1 ', '1500');

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith({
      gatewayId: 'gw-1',
      timeoutMs: 1500,
    });
  });

  it('does not emit gateway timeout for invalid payload', () => {
    const preventDefault = vi.fn();
    const event = { preventDefault } as unknown as Event;
    const emitSpy = vi.spyOn(component.gatewaySubmitted, 'emit');

    component.submitGateway(event, ' ', '1500');
    component.submitGateway(event, 'gw-1', '0');
    component.submitGateway(event, 'gw-1', 'not-a-number');

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('emits gateway delete request', () => {
    const emitSpy = vi.spyOn(component.gatewayDeleteRequested, 'emit');

    component.deleteGatewayOverride('gw-9');

    expect(emitSpy).toHaveBeenCalledWith('gw-9');
  });
});
