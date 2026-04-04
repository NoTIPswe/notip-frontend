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

    component.applyFilters(event, ' gw-1, gw-2 ,, ', ' s-1, ,s-2 ', ' temp, humidity ', '168');

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith({
      gatewayIds: ['gw-1', 'gw-2'],
      sensorIds: ['s-1', 's-2'],
      sensorTypes: ['temp', 'humidity'],
      historyWindowHours: 168,
    });
  });

  it('clears input values and emits clear event', () => {
    const gatewayInput = document.createElement('input');
    const sensorInput = document.createElement('input');
    const typeInput = document.createElement('input');
    const historyWindowInput = document.createElement('select');
    const option24 = document.createElement('option');
    option24.value = '24';
    option24.textContent = '24h';
    const option720 = document.createElement('option');
    option720.value = '720';
    option720.textContent = '30d';
    historyWindowInput.append(option24, option720);
    gatewayInput.value = 'gw-1';
    sensorInput.value = 's-1';
    typeInput.value = 'temp';
    historyWindowInput.value = '720';
    const emitSpy = vi.spyOn(component.clearRequested, 'emit');

    component.clearFilters(gatewayInput, sensorInput, typeInput, historyWindowInput);

    expect(gatewayInput.value).toBe('');
    expect(sensorInput.value).toBe('');
    expect(typeInput.value).toBe('');
    expect(historyWindowInput.value).toBe('24');
    expect(emitSpy).toHaveBeenCalledOnce();
  });

  it('falls back to default history window for invalid select values', () => {
    const preventDefault = vi.fn();
    const event = { preventDefault } as unknown as Event;
    const emitSpy = vi.spyOn(component.filtersApplied, 'emit');

    component.applyFilters(event, '', '', '', 'invalid');

    expect(emitSpy).toHaveBeenCalledWith({
      gatewayIds: [],
      sensorIds: [],
      sensorTypes: [],
      historyWindowHours: 24,
    });
  });
});
