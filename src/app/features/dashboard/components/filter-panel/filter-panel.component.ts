import { Component, output } from '@angular/core';
import { StreamParameters } from '../../../../core/models/measure';

@Component({
  selector: 'app-filter-panel',
  standalone: true,
  templateUrl: './filter-panel.component.html',
  styleUrl: './filter-panel.component.css',
})
export class FilterPanelComponent {
  readonly filtersApplied = output<StreamParameters>();
  readonly clearRequested = output<void>();

  applyFilters(
    event: Event,
    gatewayIdsRaw: string,
    sensorIdsRaw: string,
    sensorTypesRaw: string,
  ): void {
    event.preventDefault();

    const gatewayIds = this.parseCsv(gatewayIdsRaw);
    const sensorIds = this.parseCsv(sensorIdsRaw);
    const sensorTypes = this.parseCsv(sensorTypesRaw);

    this.filtersApplied.emit({
      gatewayIds,
      sensorIds,
      sensorTypes,
    });
  }

  clearFilters(
    gatewayInput: HTMLInputElement,
    sensorInput: HTMLInputElement,
    typeInput: HTMLInputElement,
  ): void {
    gatewayInput.value = '';
    sensorInput.value = '';
    typeInput.value = '';
    this.clearRequested.emit();
  }

  private parseCsv(value: string): string[] {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
}
