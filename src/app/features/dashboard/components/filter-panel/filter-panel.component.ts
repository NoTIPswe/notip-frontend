import { Component, output } from '@angular/core';
import { StreamParameters } from '../../../../core/models/measure';

export type HistoryWindowHours = 24 | 168 | 720;

export interface DashboardFilters extends StreamParameters {
  historyWindowHours: HistoryWindowHours;
}

const DEFAULT_HISTORY_WINDOW_HOURS: HistoryWindowHours = 24;

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  templateUrl: './filter-panel.component.html',
  styleUrl: './filter-panel.component.css',
})
export class FilterPanelComponent {
  readonly filtersApplied = output<DashboardFilters>();
  readonly clearRequested = output<void>();

  applyFilters(
    event: Event,
    gatewayIdsRaw: string,
    sensorIdsRaw: string,
    sensorTypesRaw: string,
    historyWindowRaw: string,
  ): void {
    event.preventDefault();

    const gatewayIds = this.parseCsv(gatewayIdsRaw);
    const sensorIds = this.parseCsv(sensorIdsRaw);
    const sensorTypes = this.parseCsv(sensorTypesRaw);

    this.filtersApplied.emit({
      gatewayIds,
      sensorIds,
      sensorTypes,
      historyWindowHours: this.parseHistoryWindowHours(historyWindowRaw),
    });
  }

  clearFilters(
    gatewayInput: HTMLInputElement,
    sensorInput: HTMLInputElement,
    typeInput: HTMLInputElement,
    historyWindowInput: HTMLSelectElement,
  ): void {
    gatewayInput.value = '';
    sensorInput.value = '';
    typeInput.value = '';
    historyWindowInput.value = String(DEFAULT_HISTORY_WINDOW_HOURS);
    this.clearRequested.emit();
  }

  private parseHistoryWindowHours(value: string): HistoryWindowHours {
    if (value === '168') {
      return 168;
    }

    if (value === '720') {
      return 720;
    }

    return DEFAULT_HISTORY_WINDOW_HOURS;
  }

  private parseCsv(value: string): string[] {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
}
