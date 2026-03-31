import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { StreamStatus } from '../../../../core/models/enums';
import { StreamParameters } from '../../../../core/models/measure';
import { MeasureFacade } from '../../facades/measure.facade';
import { FilterPanelComponent } from '../../components/filter-panel/filter-panel.component';
import { TelemetryChartComponent } from '../../components/telemetry-chart/telemetry-chart.component';
import { TelemetryTableComponent } from '../../components/telemetry-table/telemetry-table.component';

@Component({
  selector: 'app-data-dashboard-page',
  standalone: true,
  imports: [FilterPanelComponent, TelemetryTableComponent, TelemetryChartComponent],
  templateUrl: './data-dashboard.page.html',
  styleUrl: './data-dashboard.page.css',
})
export class DataDashboardPageComponent implements OnInit, OnDestroy {
  private readonly facade = inject(MeasureFacade);

  readonly currentFilters = signal<StreamParameters>({
    gatewayIds: [],
    sensorIds: [],
    sensorTypes: [],
  });

  readonly isLoading = this.facade.isLoading();
  readonly measures = this.facade.processedMeasures();
  readonly streamStatus = toSignal(this.facade.streamStatus(), {
    initialValue: StreamStatus.closed,
  });

  ngOnInit(): void {
    this.facade.openStream(this.currentFilters());
  }

  ngOnDestroy(): void {
    this.facade.closeStream();
  }

  onFiltersApplied(filters: StreamParameters): void {
    this.currentFilters.set(filters);
    this.facade.closeStream();
    this.facade.openStream(filters);
  }

  onFiltersCleared(): void {
    const emptyFilters: StreamParameters = {
      gatewayIds: [],
      sensorIds: [],
      sensorTypes: [],
    };

    this.currentFilters.set(emptyFilters);
    this.facade.closeStream();
    this.facade.openStream(emptyFilters);
  }
}
