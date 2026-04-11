import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AlertFilterPanelComponent } from './alert-filter-panel.component';

describe('AlertFilterPanelComponent', () => {
  let component: AlertFilterPanelComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertFilterPanelComponent],
    }).compileComponents();

    component = TestBed.createComponent(AlertFilterPanelComponent).componentInstance;
  });

  it('submits trimmed values and prevents default form action', () => {
    const preventDefault = vi.fn();
    const event = { preventDefault } as unknown as Event;
    const emitSpy = vi.spyOn(component.filterSubmitted, 'emit');

    component.onGatewaySelectionChanged([' gw-1 ', 'gw-2']);
    component.submit(event, ' 2026-04-01 ', ' 2026-04-02 ');

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith({
      from: '2026-04-01',
      to: '2026-04-02',
      gatewayIds: ['gw-1', 'gw-2'],
    });
  });

  it('emits reset requested event', () => {
    const emitSpy = vi.spyOn(component.resetRequested, 'emit');

    component.reset();

    expect(emitSpy).toHaveBeenCalledOnce();
  });
});
