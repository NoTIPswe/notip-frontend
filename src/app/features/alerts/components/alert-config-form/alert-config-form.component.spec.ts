import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AlertConfigFormComponent } from './alert-config-form.component';

describe('AlertConfigFormComponent', () => {
  let fixture: ComponentFixture<AlertConfigFormComponent>;
  let component: AlertConfigFormComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertConfigFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AlertConfigFormComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('availableGatewayIds', ['gw-1', 'gw-9']);
    fixture.detectChanges();
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
    component.submitGateway(event, 'gw-2', '1500');

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('does not emit gateway timeout when no gateway options are available', () => {
    fixture.componentRef.setInput('availableGatewayIds', []);
    fixture.detectChanges();

    const preventDefault = vi.fn();
    const event = { preventDefault } as unknown as Event;
    const emitSpy = vi.spyOn(component.gatewaySubmitted, 'emit');

    component.submitGateway(event, 'gw-1', '1500');

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('emits gateway delete request', () => {
    const emitSpy = vi.spyOn(component.gatewayDeleteRequested, 'emit');

    component.deleteGatewayOverride('gw-9');

    expect(emitSpy).toHaveBeenCalledWith('gw-9');
  });

  it('resets timeout input when gateway selection is empty', () => {
    const timeoutInput = { value: '1500' } as HTMLInputElement;

    component.onGatewaySelectionChanged('   ', timeoutInput);

    expect(component.selectedGatewayCurrentTimeoutMs()).toBeNull();
    expect(timeoutInput.value).toBe('');
  });

  it('uses gateway override timeout when available', () => {
    fixture.componentRef.setInput('defaultTimeoutMs', 1200);
    fixture.componentRef.setInput('gatewayOverrides', [{ gatewayId: 'gw-1', timeoutMs: 2200 }]);
    fixture.detectChanges();

    const timeoutInput = { value: '' } as HTMLInputElement;

    component.onGatewaySelectionChanged(' gw-1 ', timeoutInput);

    expect(component.selectedGatewayCurrentTimeoutMs()).toBe(2200);
    expect(timeoutInput.value).toBe('2200');
  });

  it('falls back to default timeout when gateway override is missing', () => {
    fixture.componentRef.setInput('defaultTimeoutMs', 1800);
    fixture.componentRef.setInput('gatewayOverrides', [{ gatewayId: 'gw-1', timeoutMs: 2200 }]);
    fixture.detectChanges();

    const timeoutInput = { value: '' } as HTMLInputElement;

    component.onGatewaySelectionChanged('gw-9', timeoutInput);

    expect(component.selectedGatewayCurrentTimeoutMs()).toBe(1800);
    expect(timeoutInput.value).toBe('1800');
  });

  it('emits cancel request', () => {
    const emitSpy = vi.spyOn(component.cancelRequested, 'emit');

    component.cancel();

    expect(emitSpy).toHaveBeenCalledOnce();
  });
});
