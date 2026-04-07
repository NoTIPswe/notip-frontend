import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fromRomeDateTimeInputToIso } from '../../../../shared/utils/rome-timezone.util';
import { FilterPanelComponent } from './filter-panel.component';

describe('FilterPanelComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<FilterPanelComponent>>;
  let component: FilterPanelComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterPanelComponent);
    component = fixture.componentInstance;
  });

  it('emits selected gateway/sensor ids and query date range', () => {
    fixture.componentRef.setInput('mode', 'query');

    const preventDefault = vi.fn();
    const event = { preventDefault } as unknown as Event;
    const emitSpy = vi.spyOn(component.filtersApplied, 'emit');

    const gatewaySelect = document.createElement('select');
    gatewaySelect.multiple = true;
    const gw1 = new Option('gw-1', 'gw-1', false, true);
    const gw2 = new Option('gw-2', 'gw-2', false, true);
    gatewaySelect.append(gw1, gw2);

    const sensorSelect = document.createElement('select');
    sensorSelect.multiple = true;
    const s1 = new Option('s-1', 's-1', false, true);
    const s2 = new Option('s-2', 's-2', false, false);
    sensorSelect.append(s1, s2);

    const sensorTypeSelect = document.createElement('select');
    sensorTypeSelect.multiple = true;
    const t1 = new Option('temperature', 'temperature', false, true);
    const t2 = new Option('humidity', 'humidity', false, true);
    sensorTypeSelect.append(t1, t2);

    const fromRaw = '2026-04-04T10:00';
    const toRaw = '2026-04-04T11:00';

    component.applyFilters(event, gatewaySelect, sensorTypeSelect, sensorSelect, fromRaw, toRaw);

    const payload = emitSpy.mock.calls[0][0] as {
      gatewayIds?: string[];
      sensorTypes?: string[];
      sensorIds?: string[];
      from?: string;
      to?: string;
    };

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(payload.gatewayIds).toEqual(['gw-1', 'gw-2']);
    expect(payload.sensorTypes).toEqual(['temperature', 'humidity']);
    expect(payload.sensorIds).toEqual(['s-1']);
    expect(payload.from).toBe(fromRomeDateTimeInputToIso(fromRaw));
    expect(payload.to).toBe(fromRomeDateTimeInputToIso(toRaw));
  });

  it('clears selected options, restores default range and emits clear event', () => {
    const defaultFrom = '2026-04-03T00:00:00.000Z';
    const defaultTo = '2026-04-04T00:00:00.000Z';

    fixture.componentRef.setInput('defaultFilters', {
      gatewayIds: [],
      sensorTypes: [],
      sensorIds: [],
      from: defaultFrom,
      to: defaultTo,
    });

    const gatewaySelect = document.createElement('select');
    gatewaySelect.multiple = true;
    const gw1 = new Option('gw-1', 'gw-1', false, true);
    gatewaySelect.append(gw1);

    const sensorSelect = document.createElement('select');
    sensorSelect.multiple = true;
    const s1 = new Option('s-1', 's-1', false, true);
    sensorSelect.append(s1);

    const sensorTypeSelect = document.createElement('select');
    sensorTypeSelect.multiple = true;
    const t1 = new Option('temperature', 'temperature', false, true);
    sensorTypeSelect.append(t1);

    const fromInput = document.createElement('input');
    const toInput = document.createElement('input');
    fromInput.value = '2026-04-04T09:00';
    toInput.value = '2026-04-04T10:00';

    const emitSpy = vi.spyOn(component.clearRequested, 'emit');

    component.clearFilters(gatewaySelect, sensorTypeSelect, sensorSelect, fromInput, toInput);

    expect(gw1.selected).toBe(false);
    expect(t1.selected).toBe(false);
    expect(s1.selected).toBe(false);
    expect(fromInput.value).toBe(component.toLocalDateTimeInput(defaultFrom));
    expect(toInput.value).toBe(component.toLocalDateTimeInput(defaultTo));
    expect(emitSpy).toHaveBeenCalledOnce();
  });

  it('ignores date range when filter mode is stream', () => {
    fixture.componentRef.setInput('mode', 'stream');

    const preventDefault = vi.fn();
    const event = { preventDefault } as unknown as Event;
    const emitSpy = vi.spyOn(component.filtersApplied, 'emit');

    const gatewaySelect = document.createElement('select');
    gatewaySelect.multiple = true;
    gatewaySelect.append(new Option('gw-1', 'gw-1', false, true));

    const sensorSelect = document.createElement('select');
    sensorSelect.multiple = true;
    sensorSelect.append(new Option('s-1', 's-1', false, true));

    const sensorTypeSelect = document.createElement('select');
    sensorTypeSelect.multiple = true;
    sensorTypeSelect.append(new Option('temperature', 'temperature', false, true));

    component.applyFilters(
      event,
      gatewaySelect,
      sensorTypeSelect,
      sensorSelect,
      'invalid',
      'invalid',
    );

    expect(emitSpy).toHaveBeenCalledWith({
      gatewayIds: ['gw-1'],
      sensorTypes: ['temperature'],
      sensorIds: ['s-1'],
    });
  });
});
