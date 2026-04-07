import { Component, input, output } from '@angular/core';
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

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  templateUrl: './filter-panel.component.html',
  styleUrl: './filter-panel.component.css',
})
export class FilterPanelComponent {
  readonly mode = input<DashboardFilterMode>('stream');
  readonly gatewayOptions = input<string[]>([]);
  readonly sensorTypeOptions = input<string[]>([]);
  readonly sensorOptions = input<string[]>([]);
  readonly defaultFilters = input<DashboardFilters>({
    gatewayIds: [],
    sensorTypes: [],
    sensorIds: [],
  });

  readonly filtersApplied = output<DashboardFilters>();
  readonly clearRequested = output<void>();

  applyFilters(
    event: Event,
    gatewaySelect: HTMLSelectElement,
    sensorTypeSelect: HTMLSelectElement,
    sensorSelect: HTMLSelectElement,
    fromRaw?: string,
    toRaw?: string,
  ): void {
    event.preventDefault();

    const filters: DashboardFilters = {
      gatewayIds: this.selectedValues(gatewaySelect),
      sensorTypes: this.selectedValues(sensorTypeSelect),
      sensorIds: this.selectedValues(sensorSelect),
    };

    if (this.mode() === 'query') {
      const from = this.normalizeDateTime(fromRaw);
      const to = this.normalizeDateTime(toRaw);

      if (from) {
        filters.from = from;
      }

      if (to) {
        filters.to = to;
      }
    }

    this.filtersApplied.emit(filters);
  }

  clearFilters(
    gatewaySelect: HTMLSelectElement,
    sensorTypeSelect: HTMLSelectElement,
    sensorSelect: HTMLSelectElement,
    fromInput?: HTMLInputElement,
    toInput?: HTMLInputElement,
  ): void {
    this.clearSelect(gatewaySelect);
    this.clearSelect(sensorTypeSelect);
    this.clearSelect(sensorSelect);

    const defaults = this.defaultFilters();

    if (fromInput) {
      fromInput.value = this.toLocalDateTimeInput(defaults.from);
    }

    if (toInput) {
      toInput.value = this.toLocalDateTimeInput(defaults.to);
    }

    this.clearRequested.emit();
  }

  isSelected(value: string, selectedValues?: string[]): boolean {
    return Array.isArray(selectedValues) ? selectedValues.includes(value) : false;
  }

  toLocalDateTimeInput(value?: string): string {
    return toRomeDateTimeInput(value);
  }

  private selectedValues(select: HTMLSelectElement): string[] {
    return Array.from(select.selectedOptions)
      .map((option) => option.value)
      .filter((value) => value.length > 0);
  }

  private clearSelect(select: HTMLSelectElement): void {
    Array.from(select.options).forEach((option) => {
      option.selected = false;
    });
  }

  private normalizeDateTime(value?: string): string | undefined {
    return fromRomeDateTimeInputToIso(value);
  }
}
