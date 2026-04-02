import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FilterPanelComponent } from './filter-panel.component';

describe('FilterPanelComponent', () => {
  let component: FilterPanelComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterPanelComponent],
    }).compileComponents();

    component = TestBed.createComponent(FilterPanelComponent).componentInstance;
  });

  it('parses CSV values and emits filters', () => {
    const preventDefault = vi.fn();
    const event = { preventDefault } as unknown as Event;
    const emitSpy = vi.spyOn(component.filtersApplied, 'emit');

    component.applyFilters(event, ' gw-1, gw-2 ,, ', ' s-1, ,s-2 ', ' temp, humidity ');

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith({
      gatewayIds: ['gw-1', 'gw-2'],
      sensorIds: ['s-1', 's-2'],
      sensorTypes: ['temp', 'humidity'],
    });
  });

  it('clears input values and emits clear event', () => {
    const gatewayInput = document.createElement('input');
    const sensorInput = document.createElement('input');
    const typeInput = document.createElement('input');
    gatewayInput.value = 'gw-1';
    sensorInput.value = 's-1';
    typeInput.value = 'temp';
    const emitSpy = vi.spyOn(component.clearRequested, 'emit');

    component.clearFilters(gatewayInput, sensorInput, typeInput);

    expect(gatewayInput.value).toBe('');
    expect(sensorInput.value).toBe('');
    expect(typeInput.value).toBe('');
    expect(emitSpy).toHaveBeenCalledOnce();
  });
});
