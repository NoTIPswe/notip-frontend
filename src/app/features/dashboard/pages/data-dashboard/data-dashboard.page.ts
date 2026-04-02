import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  CheckedEnvelope,
  ObfuscatedEnvelope,
  StreamParameters,
} from '../../../../core/models/measure';
import { DashboardDataMode } from '../../../../core/resolvers/dashboard.resolver';
import { FilterPanelComponent } from '../../components/filter-panel/filter-panel.component';
import { TelemetryChartComponent } from '../../components/telemetry-chart/telemetry-chart.component';
import { TelemetryTableComponent } from '../../components/telemetry-table/telemetry-table.component';
import { ObfuscatedMeasureService } from '../../services/obfuscated-measure.service';
import { ValidatedMeasureFacadeService } from '../../services/validated-measure-facade.service';

@Component({
  selector: 'app-data-dashboard-page',
  standalone: true,
  imports: [FilterPanelComponent, TelemetryTableComponent, TelemetryChartComponent],
  templateUrl: './data-dashboard.page.html',
  styleUrl: './data-dashboard.page.css',
})
export class DataDashboardPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly obfuscatedMeasureService = inject(ObfuscatedMeasureService);
  private readonly validatedMeasureFacadeService = inject(ValidatedMeasureFacadeService);

  private streamSubscription: Subscription | null = null;

  readonly measures = signal<Array<CheckedEnvelope | ObfuscatedEnvelope>>([]);
  readonly isLoading = signal(false);

  readonly currentFilters = signal<StreamParameters>({
    gatewayIds: [],
    sensorIds: [],
    sensorTypes: [],
  });

  readonly dataMode = signal<DashboardDataMode>('clear');

  ngOnInit(): void {
    const mode = this.asDataMode(this.route.snapshot.data['dataMode']);
    this.dataMode.set(mode === 'obfuscated' ? 'obfuscated' : 'clear');
    this.startStream(this.currentFilters());
  }

  ngOnDestroy(): void {
    this.stopStream();
  }

  onFiltersApplied(filters: StreamParameters): void {
    this.currentFilters.set(filters);
    this.startStream(filters);
  }

  onFiltersCleared(): void {
    const emptyFilters: StreamParameters = {
      gatewayIds: [],
      sensorIds: [],
      sensorTypes: [],
    };

    this.currentFilters.set(emptyFilters);
    this.startStream(emptyFilters);
  }

  private startStream(params: StreamParameters): void {
    this.stopStream();
    this.measures.set([]);
    this.isLoading.set(true);

    if (this.dataMode() === 'obfuscated') {
      this.streamSubscription = this.obfuscatedMeasureService.openStream(params).subscribe({
        next: (batch) => {
          this.measures.update((rows) => [...rows, ...batch]);
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
        },
      });
      return;
    }

    this.streamSubscription = this.validatedMeasureFacadeService.openStream(params).subscribe({
      next: (row) => {
        this.measures.update((rows) => [...rows, row]);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      },
    });
  }

  private stopStream(): void {
    if (this.streamSubscription) {
      this.streamSubscription.unsubscribe();
      this.streamSubscription = null;
    }

    this.obfuscatedMeasureService.closeStream();
    this.validatedMeasureFacadeService.closeStream();
    this.isLoading.set(false);
  }

  private asDataMode(value: unknown): DashboardDataMode {
    return value === 'obfuscated' ? 'obfuscated' : 'clear';
  }
}
