import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, Subscription } from 'rxjs';
import {
  CheckedEnvelope,
  ObfuscatedEnvelope,
  QueryParameters,
  StreamParameters,
} from '../../../../core/models/measure';
import { DashboardDataMode } from '../../../../core/resolvers/dashboard.resolver';
import {
  DashboardFilters,
  FilterPanelComponent,
} from '../../components/filter-panel/filter-panel.component';
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
  private static readonly DEFAULT_HISTORY_WINDOW_HOURS = 24;
  private static readonly HISTORY_PAGE_LIMIT = 999;
  private static readonly HISTORY_MAX_PAGES = 10;

  private readonly route = inject(ActivatedRoute);
  private readonly obfuscatedMeasureService = inject(ObfuscatedMeasureService);
  private readonly validatedMeasureFacadeService = inject(ValidatedMeasureFacadeService);

  private streamSubscription: Subscription | null = null;
  private runId = 0;

  readonly measures = signal<Array<CheckedEnvelope | ObfuscatedEnvelope>>([]);
  readonly isLoading = signal(false);

  readonly currentFilters = signal<DashboardFilters>({
    gatewayIds: [],
    sensorIds: [],
    sensorTypes: [],
    historyWindowHours: DataDashboardPageComponent.DEFAULT_HISTORY_WINDOW_HOURS,
  });

  readonly dataMode = signal<DashboardDataMode>('clear');

  ngOnInit(): void {
    const mode = this.asDataMode(this.route.snapshot.data['dataMode']);
    this.dataMode.set(mode === 'obfuscated' ? 'obfuscated' : 'clear');
    this.startStream(this.currentFilters());
  }

  ngOnDestroy(): void {
    this.runId += 1;
    this.stopStream();
  }

  onFiltersApplied(filters: DashboardFilters): void {
    this.currentFilters.set(filters);
    this.startStream(filters);
  }

  onFiltersCleared(): void {
    const emptyFilters: DashboardFilters = {
      gatewayIds: [],
      sensorIds: [],
      sensorTypes: [],
      historyWindowHours: DataDashboardPageComponent.DEFAULT_HISTORY_WINDOW_HOURS,
    };

    this.currentFilters.set(emptyFilters);
    this.startStream(emptyFilters);
  }

  private startStream(params: DashboardFilters): void {
    const runId = ++this.runId;
    this.stopStream();
    this.measures.set([]);
    this.isLoading.set(true);

    void this.loadHistoryAndOpenStream(params, runId);
  }

  private async loadHistoryAndOpenStream(params: DashboardFilters, runId: number): Promise<void> {
    try {
      const historicalRows = await this.loadHistoricalMeasures(params, runId);
      if (!this.isRunCurrent(runId)) {
        return;
      }

      this.measures.set(historicalRows);
    } catch {
      if (!this.isRunCurrent(runId)) {
        return;
      }
    }

    if (!this.isRunCurrent(runId)) {
      return;
    }

    this.openRealtimeStream(params, runId);
    this.isLoading.set(false);
  }

  private async loadHistoricalMeasures(
    params: DashboardFilters,
    runId: number,
  ): Promise<Array<CheckedEnvelope | ObfuscatedEnvelope>> {
    const { from, to } = this.historyWindow(params.historyWindowHours);

    if (this.dataMode() === 'obfuscated') {
      return this.loadObfuscatedHistory(params, from, to, runId);
    }

    return this.loadClearHistory(params, from, to, runId);
  }

  private async loadObfuscatedHistory(
    params: StreamParameters,
    from: string,
    to: string,
    runId: number,
  ): Promise<ObfuscatedEnvelope[]> {
    const rows: ObfuscatedEnvelope[] = [];
    let cursor: string | undefined;

    for (
      let pageIndex = 0;
      pageIndex < DataDashboardPageComponent.HISTORY_MAX_PAGES;
      pageIndex += 1
    ) {
      if (!this.isRunCurrent(runId)) {
        return rows;
      }

      const page = await firstValueFrom(
        this.obfuscatedMeasureService.query(this.buildQueryParameters(params, from, to, cursor)),
      );

      rows.push(...page.data);

      if (!page.hasMore || !page.nextCursor) {
        break;
      }

      cursor = page.nextCursor;
    }

    return rows;
  }

  private async loadClearHistory(
    params: StreamParameters,
    from: string,
    to: string,
    runId: number,
  ): Promise<CheckedEnvelope[]> {
    const rows: CheckedEnvelope[] = [];
    let cursor: string | undefined;

    for (
      let pageIndex = 0;
      pageIndex < DataDashboardPageComponent.HISTORY_MAX_PAGES;
      pageIndex += 1
    ) {
      if (!this.isRunCurrent(runId)) {
        return rows;
      }

      const page = await firstValueFrom(
        this.validatedMeasureFacadeService.query(
          this.buildQueryParameters(params, from, to, cursor),
        ),
      );

      rows.push(...page.data);

      if (!page.hasMore || !page.nextCursor) {
        break;
      }

      cursor = page.nextCursor;
    }

    return rows;
  }

  private buildQueryParameters(
    params: StreamParameters,
    from: string,
    to: string,
    cursor?: string,
  ): QueryParameters {
    const query: QueryParameters = {
      from,
      to,
      limit: DataDashboardPageComponent.HISTORY_PAGE_LIMIT,
    };

    if (cursor) {
      query.cursor = cursor;
    }

    if (params.gatewayIds && params.gatewayIds.length > 0) {
      query.gatewayIds = params.gatewayIds;
    }

    if (params.sensorIds && params.sensorIds.length > 0) {
      query.sensorIds = params.sensorIds;
    }

    if (params.sensorTypes && params.sensorTypes.length > 0) {
      query.sensorTypes = params.sensorTypes;
    }

    return query;
  }

  private historyWindow(historyWindowHours: number): { from: string; to: string } {
    const toDate = new Date();
    const fromDate = new Date(toDate.getTime() - historyWindowHours * 60 * 60 * 1000);

    return {
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
    };
  }

  private openRealtimeStream(params: StreamParameters, runId: number): void {
    if (this.dataMode() === 'obfuscated') {
      this.streamSubscription = this.obfuscatedMeasureService.openStream(params).subscribe({
        next: (batch) => {
          if (!this.isRunCurrent(runId)) {
            return;
          }

          this.measures.update((rows) => [...rows, ...batch]);
        },
        error: () => {
          if (!this.isRunCurrent(runId)) {
            return;
          }

          this.isLoading.set(false);
        },
      });
      return;
    }

    this.streamSubscription = this.validatedMeasureFacadeService.openStream(params).subscribe({
      next: (row) => {
        if (!this.isRunCurrent(runId)) {
          return;
        }

        this.measures.update((rows) => [...rows, row]);
      },
      error: () => {
        if (!this.isRunCurrent(runId)) {
          return;
        }

        this.isLoading.set(false);
      },
    });
  }

  private isRunCurrent(runId: number): boolean {
    return this.runId === runId;
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
