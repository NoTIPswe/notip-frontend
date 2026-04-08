import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fromRomeDateTimeInputToIso } from '../../../../shared/utils/rome-timezone.util';
import { FilterPanelComponent } from './filter-panel.component';

describe('FilterPanelComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<FilterPanelComponent>>;
  let component: FilterPanelComponent;

  const sensorCatalog = [
    { gatewayId: 'gw-1', sensorType: 'temperature', sensorId: 's-1' },
    { gatewayId: 'gw-1', sensorType: 'humidity', sensorId: 's-2' },
    { gatewayId: 'gw-2', sensorType: 'temperature', sensorId: 's-3' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterPanelComponent);
    component = fixture.componentInstance;
  });

  it('emits selected gateway/sensor ids and query date range', () => {
    fixture.componentRef.setInput('mode', 'query');
    fixture.componentRef.setInput('defaultFilters', {
      gatewayIds: ['gw-1', 'gw-2'],
      sensorTypes: ['temperature', 'humidity'],
      sensorIds: ['s-1'],
    });
    fixture.detectChanges();

    const preventDefault = vi.fn();
    const event = { preventDefault } as unknown as Event;
    const emitSpy = vi.spyOn(component.filtersApplied, 'emit');

    const fromRaw = '2026-04-04T10:00';
    const toRaw = '2026-04-04T11:00';
    component.onQueryFromChanged(fromRaw);
    component.onQueryToChanged(toRaw);

    component.applyFilters(event);

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

  it('clamps from date to 24h before to date when query range exceeds max window', () => {
    fixture.componentRef.setInput('mode', 'query');
    fixture.detectChanges();

    component.onQueryFromChanged('2026-04-04T00:00');
    component.onQueryToChanged('2026-04-05T12:30');

    expect(component.queryFromRaw()).toBe('2026-04-04T12:30');

    const preventDefault = vi.fn();
    const event = { preventDefault } as unknown as Event;
    const emitSpy = vi.spyOn(component.filtersApplied, 'emit');

    component.applyFilters(event);

    const payload = emitSpy.mock.calls[0][0] as {
      from?: string;
      to?: string;
    };

    expect(payload.from).toBe(fromRomeDateTimeInputToIso('2026-04-04T12:30'));
    expect(payload.to).toBe(fromRomeDateTimeInputToIso('2026-04-05T12:30'));
  });

  it('clamps to date to 24h after from date when query range exceeds max window from from-change', () => {
    fixture.componentRef.setInput('mode', 'query');
    fixture.detectChanges();

    component.onQueryToChanged('2026-04-05T12:30');
    component.onQueryFromChanged('2026-04-03T08:00');

    expect(component.queryToRaw()).toBe('2026-04-04T08:00');

    const preventDefault = vi.fn();
    const event = { preventDefault } as unknown as Event;
    const emitSpy = vi.spyOn(component.filtersApplied, 'emit');

    component.applyFilters(event);

    const payload = emitSpy.mock.calls[0][0] as {
      from?: string;
      to?: string;
    };

    expect(payload.from).toBe(fromRomeDateTimeInputToIso('2026-04-03T08:00'));
    expect(payload.to).toBe(fromRomeDateTimeInputToIso('2026-04-04T08:00'));
  });

  it('clears selected options, restores default range and emits clear event', () => {
    const defaultFrom = '2026-04-03T00:00:00.000Z';
    const defaultTo = '2026-04-04T00:00:00.000Z';

    fixture.componentRef.setInput('mode', 'query');
    fixture.componentRef.setInput('defaultFilters', {
      gatewayIds: ['gw-1'],
      sensorTypes: ['temperature'],
      sensorIds: ['s-1'],
      from: defaultFrom,
      to: defaultTo,
    });
    fixture.detectChanges();

    component.onQueryFromChanged('2026-04-05T09:00');
    component.onQueryToChanged('2026-04-05T10:00');

    const clearSpy = vi.spyOn(component.clearRequested, 'emit');
    const applySpy = vi.spyOn(component.filtersApplied, 'emit');
    const preventDefault = vi.fn();
    const event = { preventDefault } as unknown as Event;

    component.clearFilters();
    component.applyFilters(event);

    const payload = applySpy.mock.calls[0][0] as {
      gatewayIds?: string[];
      sensorTypes?: string[];
      sensorIds?: string[];
      from?: string;
      to?: string;
    };

    expect(payload.gatewayIds).toEqual([]);
    expect(payload.sensorTypes).toEqual([]);
    expect(payload.sensorIds).toEqual([]);
    expect(payload.from).toBe(
      fromRomeDateTimeInputToIso(component.toLocalDateTimeInput(defaultFrom)),
    );
    expect(payload.to).toBe(fromRomeDateTimeInputToIso(component.toLocalDateTimeInput(defaultTo)));
    expect(clearSpy).toHaveBeenCalledOnce();
  });

  it('ignores date range when filter mode is stream', () => {
    fixture.componentRef.setInput('mode', 'stream');
    fixture.componentRef.setInput('defaultFilters', {
      gatewayIds: ['gw-1'],
      sensorTypes: ['temperature'],
      sensorIds: ['s-1'],
      from: '2026-04-04T00:00:00.000Z',
      to: '2026-04-05T00:00:00.000Z',
    });
    fixture.detectChanges();

    const preventDefault = vi.fn();
    const event = { preventDefault } as unknown as Event;
    const emitSpy = vi.spyOn(component.filtersApplied, 'emit');

    component.onQueryFromChanged('invalid');
    component.onQueryToChanged('invalid');

    component.applyFilters(event);

    expect(emitSpy).toHaveBeenCalledWith({
      gatewayIds: ['gw-1'],
      sensorTypes: ['temperature'],
      sensorIds: ['s-1'],
    });
  });

  it('toggles options with single click and summarizes multiple selections', () => {
    fixture.componentRef.setInput('defaultFilters', {
      gatewayIds: [],
      sensorTypes: [],
      sensorIds: [],
    });
    fixture.detectChanges();

    expect(component.selectionLabel('gatewayIds')).toBe('Select gateway');

    component.toggleOption('gatewayIds', 'gw-1');
    expect(component.isOptionSelected('gatewayIds', 'gw-1')).toBe(true);
    expect(component.selectionLabel('gatewayIds')).toBe('gw-1');

    component.toggleOption('gatewayIds', 'gw-2');
    expect(component.selectionLabel('gatewayIds')).toBe('2 selected');

    component.toggleOption('gatewayIds', 'gw-1');
    expect(component.isOptionSelected('gatewayIds', 'gw-1')).toBe(false);
    expect(component.selectionLabel('gatewayIds')).toBe('gw-2');
  });

  it('filters options by search term', () => {
    fixture.componentRef.setInput('sensorOptions', ['sensor-abc', 'sensor-def', 'abc-aux']);
    fixture.detectChanges();

    component.updateSearchTerm('sensorIds', 'abc');

    expect(component.filteredOptions('sensorIds')).toEqual(['sensor-abc', 'abc-aux']);
  });

  it('opens and closes dropdown with toggle and escape', () => {
    expect(component.isDropdownOpen('gatewayIds')).toBe(false);

    component.toggleDropdown('gatewayIds');
    expect(component.isDropdownOpen('gatewayIds')).toBe(true);

    component.toggleDropdown('gatewayIds');
    expect(component.isDropdownOpen('gatewayIds')).toBe(false);

    component.toggleDropdown('sensorIds');
    expect(component.isDropdownOpen('sensorIds')).toBe(true);

    component.onEscape();
    expect(component.isDropdownOpen('sensorIds')).toBe(false);
  });

  it('closes dropdown on outside document click and ignores invalid event target', () => {
    component.toggleDropdown('gatewayIds');
    expect(component.isDropdownOpen('gatewayIds')).toBe(true);

    component.onDocumentClick({ target: null } as unknown as MouseEvent);
    expect(component.isDropdownOpen('gatewayIds')).toBe(true);

    const nativeElement = fixture.nativeElement as HTMLElement;
    const insideTarget = nativeElement.querySelector('form') as Node;
    component.onDocumentClick({ target: insideTarget } as unknown as MouseEvent);
    expect(component.isDropdownOpen('gatewayIds')).toBe(true);

    const outsideTarget = document.createElement('div');
    document.body.appendChild(outsideTarget);
    try {
      component.onDocumentClick({ target: outsideTarget } as unknown as MouseEvent);
      expect(component.isDropdownOpen('gatewayIds')).toBe(false);
    } finally {
      outsideTarget.remove();
    }
  });

  it('shows dependent sensor type and sensor id options for selected gateway and type', () => {
    fixture.componentRef.setInput('gatewayOptions', ['gw-1', 'gw-2']);
    fixture.componentRef.setInput('sensorTypeOptions', ['temperature', 'humidity']);
    fixture.componentRef.setInput('sensorOptions', ['s-1', 's-2', 's-3']);
    fixture.componentRef.setInput('sensorCatalog', sensorCatalog);
    fixture.detectChanges();

    component.toggleOption('gatewayIds', 'gw-2');

    expect(component.filteredOptions('sensorTypes')).toEqual(['temperature']);
    expect(component.filteredOptions('sensorIds')).toEqual(['s-3']);

    component.toggleOption('gatewayIds', 'gw-1');
    component.toggleOption('sensorTypes', 'humidity');

    expect(component.filteredOptions('sensorIds')).toEqual(['s-2']);
  });

  it('removes incompatible parent selections when sensor id is already selected', () => {
    fixture.componentRef.setInput('gatewayOptions', ['gw-1', 'gw-2']);
    fixture.componentRef.setInput('sensorTypeOptions', ['temperature', 'humidity']);
    fixture.componentRef.setInput('sensorOptions', ['s-1', 's-2', 's-3']);
    fixture.componentRef.setInput('sensorCatalog', sensorCatalog);
    fixture.componentRef.setInput('defaultFilters', {
      gatewayIds: [],
      sensorTypes: [],
      sensorIds: ['s-1'],
    });
    fixture.detectChanges();

    component.toggleOption('gatewayIds', 'gw-2');
    component.toggleOption('sensorTypes', 'humidity');

    expect(component.isOptionSelected('sensorIds', 's-1')).toBe(true);
    expect(component.isOptionSelected('gatewayIds', 'gw-2')).toBe(false);
    expect(component.isOptionSelected('sensorTypes', 'humidity')).toBe(false);
  });

  it('removes incompatible gateway selection when sensor type is already selected', () => {
    fixture.componentRef.setInput('gatewayOptions', ['gw-1', 'gw-2']);
    fixture.componentRef.setInput('sensorTypeOptions', ['temperature', 'humidity']);
    fixture.componentRef.setInput('sensorOptions', ['s-1', 's-2', 's-3']);
    fixture.componentRef.setInput('sensorCatalog', sensorCatalog);
    fixture.componentRef.setInput('defaultFilters', {
      gatewayIds: [],
      sensorTypes: ['humidity'],
      sensorIds: [],
    });
    fixture.detectChanges();

    component.toggleOption('gatewayIds', 'gw-2');

    expect(component.isOptionSelected('sensorTypes', 'humidity')).toBe(true);
    expect(component.isOptionSelected('gatewayIds', 'gw-2')).toBe(false);
  });

  it('hides incompatible gateway and sensor type options when sensor id is selected', () => {
    fixture.componentRef.setInput('gatewayOptions', ['gw-1', 'gw-2']);
    fixture.componentRef.setInput('sensorTypeOptions', ['temperature', 'humidity']);
    fixture.componentRef.setInput('sensorOptions', ['s-1', 's-2', 's-3']);
    fixture.componentRef.setInput('sensorCatalog', sensorCatalog);
    fixture.detectChanges();

    component.toggleOption('sensorIds', 's-2');

    expect(component.filteredOptions('gatewayIds')).toEqual(['gw-1']);
    expect(component.filteredOptions('sensorTypes')).toEqual(['humidity']);
  });
});
