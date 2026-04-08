import {
  Component,
  ElementRef,
  HostListener,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  fromRomeDateTimeInputToIso,
  toRomeDateTimeInput,
} from '../../../../shared/utils/rome-timezone.util';

export type DashboardFilterMode = 'stream' | 'query';

export interface DashboardFilters {
  gatewayIds?: string[];
  sensorTypes?: string[];
  sensorIds?: string[];
  from?: string;
  to?: string;
}

export interface DashboardSensorCatalogEntry {
  gatewayId: string;
  sensorType: string;
  sensorId: string;
}

type MultiSelectKey = 'gatewayIds' | 'sensorTypes' | 'sensorIds';

type MultiSelectState = Record<MultiSelectKey, string[]>;
type MultiSelectSearchState = Record<MultiSelectKey, string>;

const MAX_QUERY_WINDOW_MS = 24 * 60 * 60 * 1000;

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  templateUrl: './filter-panel.component.html',
  styleUrl: './filter-panel.component.css',
})
export class FilterPanelComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly mode = input<DashboardFilterMode>('stream');
  readonly gatewayOptions = input<string[]>([]);
  readonly sensorTypeOptions = input<string[]>([]);
  readonly sensorOptions = input<string[]>([]);
  readonly sensorCatalog = input<DashboardSensorCatalogEntry[]>([]);
  readonly defaultFilters = input<DashboardFilters>({
    gatewayIds: [],
    sensorTypes: [],
    sensorIds: [],
  });

  readonly filtersApplied = output<DashboardFilters>();
  readonly clearRequested = output<void>();

  readonly multiSelectFields: ReadonlyArray<{
    key: MultiSelectKey;
    label: string;
  }> = [
    { key: 'gatewayIds', label: 'Gateway' },
    { key: 'sensorTypes', label: 'Sensor type' },
    { key: 'sensorIds', label: 'Sensors' },
  ];

  readonly openDropdown = signal<MultiSelectKey | null>(null);
  readonly selectedFilters = signal<MultiSelectState>(this.emptyMultiSelectState());
  readonly searchTerms = signal<MultiSelectSearchState>(this.emptyMultiSelectSearchState());
  readonly queryFromRaw = signal('');
  readonly queryToRaw = signal('');

  constructor() {
    effect(() => {
      const defaults = this.defaultFilters();

      this.selectedFilters.set({
        gatewayIds: this.normalizeList(defaults.gatewayIds),
        sensorTypes: this.normalizeList(defaults.sensorTypes),
        sensorIds: this.normalizeList(defaults.sensorIds),
      });

      this.queryFromRaw.set(this.toLocalDateTimeInput(defaults.from));
      this.queryToRaw.set(this.toLocalDateTimeInput(defaults.to));
      this.searchTerms.set(this.emptyMultiSelectSearchState());
      this.openDropdown.set(null);
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target;

    if (!(target instanceof Node)) {
      return;
    }

    if (this.host.nativeElement.contains(target)) {
      return;
    }

    this.openDropdown.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.openDropdown.set(null);
  }

  applyFilters(event: Event): void {
    event.preventDefault();

    const selected = this.selectedFilters();

    const filters: DashboardFilters = {
      gatewayIds: [...selected.gatewayIds],
      sensorTypes: [...selected.sensorTypes],
      sensorIds: [...selected.sensorIds],
    };

    if (this.mode() === 'query') {
      this.enforceMaxQueryWindow();

      const from = this.normalizeDateTime(this.queryFromRaw());
      const to = this.normalizeDateTime(this.queryToRaw());

      if (from) {
        filters.from = from;
      }

      if (to) {
        filters.to = to;
      }
    }

    this.filtersApplied.emit(filters);
  }

  clearFilters(): void {
    this.selectedFilters.set(this.emptyMultiSelectState());
    this.searchTerms.set(this.emptyMultiSelectSearchState());
    this.openDropdown.set(null);

    const defaults = this.defaultFilters();
    this.queryFromRaw.set(this.toLocalDateTimeInput(defaults.from));
    this.queryToRaw.set(this.toLocalDateTimeInput(defaults.to));

    this.clearRequested.emit();
  }

  toggleDropdown(key: MultiSelectKey): void {
    this.openDropdown.update((current) => (current === key ? null : key));
  }

  isDropdownOpen(key: MultiSelectKey): boolean {
    return this.openDropdown() === key;
  }

  updateSearchTerm(key: MultiSelectKey, value: string): void {
    this.searchTerms.update((current) => ({ ...current, [key]: value }));
  }

  searchTerm(key: MultiSelectKey): string {
    return this.searchTerms()[key];
  }

  filteredOptions(key: MultiSelectKey): string[] {
    const search = this.searchTerms()[key].trim().toLowerCase();
    const options = this.optionsFor(key);

    if (!search) {
      return options;
    }

    return options.filter((option) => option.toLowerCase().includes(search));
  }

  toggleOption(key: MultiSelectKey, value: string): void {
    this.selectedFilters.update((current) => {
      const selected = current[key];
      const nextValues = selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value];

      const nextState: MultiSelectState = { ...current, [key]: nextValues };

      return this.normalizeSelection(nextState);
    });
  }

  isOptionSelected(key: MultiSelectKey, value: string): boolean {
    return this.selectedFilters()[key].includes(value);
  }

  selectionLabel(key: MultiSelectKey): string {
    const selected = this.selectedFilters()[key];

    if (selected.length === 0) {
      return this.placeholderFor(key);
    }

    if (selected.length === 1) {
      return selected[0];
    }

    return `${selected.length} selected`;
  }

  onQueryFromChanged(value: string): void {
    this.queryFromRaw.set(value);
    this.enforceMaxQueryWindow('from');
  }

  onQueryToChanged(value: string): void {
    this.queryToRaw.set(value);
    this.enforceMaxQueryWindow('to');
  }

  toLocalDateTimeInput(value?: string): string {
    return toRomeDateTimeInput(value);
  }

  private optionsFor(key: MultiSelectKey): string[] {
    if (key === 'gatewayIds') {
      return this.filteredGatewayOptions();
    }

    if (key === 'sensorTypes') {
      return this.filteredSensorTypeOptions();
    }

    return this.filteredSensorOptions();
  }

  private placeholderFor(key: MultiSelectKey): string {
    if (key === 'gatewayIds') {
      return 'Select gateway';
    }

    if (key === 'sensorTypes') {
      return 'Select sensor type';
    }

    return 'Select sensor';
  }

  private normalizeList(values?: string[]): string[] {
    if (!Array.isArray(values) || values.length === 0) {
      return [];
    }

    return values.filter((value) => typeof value === 'string' && value.length > 0);
  }

  private emptyMultiSelectState(): MultiSelectState {
    return {
      gatewayIds: [],
      sensorTypes: [],
      sensorIds: [],
    };
  }

  private emptyMultiSelectSearchState(): MultiSelectSearchState {
    return {
      gatewayIds: '',
      sensorTypes: '',
      sensorIds: '',
    };
  }

  private filteredGatewayOptions(): string[] {
    const catalog = this.normalizedCatalog();

    if (catalog.length === 0) {
      return this.gatewayOptions();
    }

    const selected = this.selectedFilters();

    if (selected.sensorTypes.length === 0 && selected.sensorIds.length === 0) {
      return this.gatewayOptions();
    }

    const allowed = new Set(
      catalog
        .filter((entry) => {
          if (selected.sensorTypes.length > 0 && !selected.sensorTypes.includes(entry.sensorType)) {
            return false;
          }

          if (selected.sensorIds.length > 0 && !selected.sensorIds.includes(entry.sensorId)) {
            return false;
          }

          return true;
        })
        .map((entry) => entry.gatewayId),
    );

    return this.gatewayOptions().filter((gatewayId) => allowed.has(gatewayId));
  }

  private filteredSensorTypeOptions(): string[] {
    const catalog = this.normalizedCatalog();

    if (catalog.length === 0) {
      return this.sensorTypeOptions();
    }

    const selected = this.selectedFilters();

    if (selected.gatewayIds.length === 0 && selected.sensorIds.length === 0) {
      return this.sensorTypeOptions();
    }

    const allowed = new Set(
      catalog
        .filter((entry) => {
          if (selected.gatewayIds.length > 0 && !selected.gatewayIds.includes(entry.gatewayId)) {
            return false;
          }

          if (selected.sensorIds.length > 0 && !selected.sensorIds.includes(entry.sensorId)) {
            return false;
          }

          return true;
        })
        .map((entry) => entry.sensorType),
    );

    return this.sensorTypeOptions().filter((sensorType) => allowed.has(sensorType));
  }

  private filteredSensorOptions(): string[] {
    const catalog = this.normalizedCatalog();

    if (catalog.length === 0) {
      return this.sensorOptions();
    }

    const selected = this.selectedFilters();
    const allowed = new Set(
      catalog
        .filter((entry) => {
          if (selected.gatewayIds.length > 0 && !selected.gatewayIds.includes(entry.gatewayId)) {
            return false;
          }

          if (selected.sensorTypes.length > 0 && !selected.sensorTypes.includes(entry.sensorType)) {
            return false;
          }

          return true;
        })
        .map((entry) => entry.sensorId),
    );

    return this.sensorOptions().filter((sensorId) => allowed.has(sensorId));
  }

  private normalizeSelection(state: MultiSelectState): MultiSelectState {
    const catalog = this.normalizedCatalog();

    if (catalog.length === 0) {
      return state;
    }

    const sensorIds = state.sensorIds.filter((sensorId) =>
      catalog.some((entry) => entry.sensorId === sensorId),
    );

    const sensorTypes = state.sensorTypes.filter((sensorType) => {
      return catalog.some((entry) => {
        if (entry.sensorType !== sensorType) {
          return false;
        }

        if (sensorIds.length > 0 && !sensorIds.includes(entry.sensorId)) {
          return false;
        }

        return true;
      });
    });

    const gatewayIds = state.gatewayIds.filter((gatewayId) => {
      return catalog.some((entry) => {
        if (entry.gatewayId !== gatewayId) {
          return false;
        }

        if (sensorIds.length > 0 && !sensorIds.includes(entry.sensorId)) {
          return false;
        }

        if (sensorTypes.length > 0 && !sensorTypes.includes(entry.sensorType)) {
          return false;
        }

        return true;
      });
    });

    return {
      gatewayIds,
      sensorTypes,
      sensorIds,
    };
  }

  private normalizedCatalog(): DashboardSensorCatalogEntry[] {
    return this.sensorCatalog().filter((entry) => {
      return (
        typeof entry.gatewayId === 'string' &&
        entry.gatewayId.length > 0 &&
        typeof entry.sensorType === 'string' &&
        entry.sensorType.length > 0 &&
        typeof entry.sensorId === 'string' &&
        entry.sensorId.length > 0
      );
    });
  }

  private normalizeDateTime(value?: string): string | undefined {
    return fromRomeDateTimeInputToIso(value);
  }

  private enforceMaxQueryWindow(changedField: 'from' | 'to' = 'to'): void {
    const from = this.normalizeDateTime(this.queryFromRaw());
    const to = this.normalizeDateTime(this.queryToRaw());

    if (!from || !to) {
      return;
    }

    const fromMs = Date.parse(from);
    const toMs = Date.parse(to);

    if (!Number.isFinite(fromMs) || !Number.isFinite(toMs)) {
      return;
    }

    if (toMs - fromMs <= MAX_QUERY_WINDOW_MS) {
      return;
    }

    if (changedField === 'from') {
      const adjustedTo = new Date(fromMs + MAX_QUERY_WINDOW_MS).toISOString();
      this.queryToRaw.set(this.toLocalDateTimeInput(adjustedTo));
      return;
    }

    const adjustedFrom = new Date(toMs - MAX_QUERY_WINDOW_MS).toISOString();
    this.queryFromRaw.set(this.toLocalDateTimeInput(adjustedFrom));
  }
}
