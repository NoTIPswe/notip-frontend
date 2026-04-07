import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom, Subscription, toArray } from 'rxjs';
import {
  CheckedEnvelope,
  ExportParameters,
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
import { GatewayService } from '../../../gateways/services/gateway.service';
import { SensorService } from '../../../sensors/services/sensor.service';
import { ObfuscatedMeasureService } from '../../services/obfuscated-measure.service';
import { ValidatedMeasureFacadeService } from '../../services/validated-measure-facade.service';
import { AdminGatewayService } from '../../../admin/services/admin-gateway.service';
import { AuthService } from '../../../../core/services/auth.service';

type DashboardViewMode = 'stream' | 'query';

@Component({
  selector: 'app-data-dashboard-page',
  standalone: true,
  imports: [FilterPanelComponent, TelemetryTableComponent, TelemetryChartComponent],
  templateUrl: './data-dashboard.page.html',
  styleUrl: './data-dashboard.page.css',
})
export class DataDashboardPageComponent implements OnInit, OnDestroy {
  private static readonly QUERY_PAGE_SIZE = 20;
  private static readonly STREAM_PAGE_SIZE = 20;
  private static readonly DEFAULT_QUERY_WINDOW_HOURS = 24;

  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly gatewayService = inject(GatewayService);
  private readonly adminGatewayService = inject(AdminGatewayService);
  private readonly sensorService = inject(SensorService);
  private readonly obfuscatedMeasureService = inject(ObfuscatedMeasureService);
  private readonly validatedMeasureFacadeService = inject(ValidatedMeasureFacadeService);

  private streamSubscription: Subscription | null = null;
  private streamRunId = 0;
  private queryRunId = 0;

  private queryInitialized = false;
  private queryCurrentCursor: string | undefined;
  private queryNextCursor: string | undefined;
  private queryPreviousCursors: Array<string | undefined> = [];

  readonly activeView = signal<DashboardViewMode>('stream');
  readonly dataMode = signal<DashboardDataMode>('clear');

  readonly gatewayOptions = signal<string[]>([]);
  readonly sensorTypeOptions = signal<string[]>([]);
  readonly sensorOptions = signal<string[]>([]);

  readonly streamFilters = signal<DashboardFilters>({
    gatewayIds: [],
    sensorTypes: [],
    sensorIds: [],
  });

  readonly queryFilters = signal<DashboardFilters>(this.defaultQueryFilters());

  readonly streamMeasures = signal<Array<CheckedEnvelope | ObfuscatedEnvelope>>([]);
  readonly queryMeasures = signal<Array<CheckedEnvelope | ObfuscatedEnvelope>>([]);

  readonly isStreamLoading = signal(false);
  readonly isQueryLoading = signal(false);
  readonly isExporting = signal(false);

  readonly queryPage = signal(1);
  readonly queryHasNextPage = signal(false);

  ngOnInit(): void {
    // If impersonation is active, force obfuscated mode
    const isImpersonating = this.authService.isImpersonating();
    const mode = isImpersonating
      ? 'obfuscated'
      : this.asDataMode(this.route.snapshot.data['dataMode']);
    this.dataMode.set(mode);

    void this.loadFilterOptions();
    this.startStream(this.toStreamParameters(this.streamFilters()));
  }

  ngOnDestroy(): void {
    this.streamRunId += 1;
    this.queryRunId += 1;
    this.stopStream();
  }

  setActiveView(view: DashboardViewMode): void {
    if (view === this.activeView()) {
      return;
    }

    this.activeView.set(view);

    if (view === 'stream') {
      this.startStream(this.toStreamParameters(this.streamFilters()));
      return;
    }

    this.stopStream();

    if (!this.queryInitialized) {
      void this.resetQueryAndLoad();
    }
  }

  onFiltersApplied(filters: DashboardFilters): void {
    if (this.activeView() === 'stream') {
      const nextFilters = this.normalizeStreamFilters(filters);
      this.streamFilters.set(nextFilters);
      this.startStream(this.toStreamParameters(nextFilters));
      return;
    }

    const nextFilters = this.normalizeQueryFilters(filters);
    this.queryFilters.set(nextFilters);
    void this.resetQueryAndLoad();
  }

  onFiltersCleared(): void {
    if (this.activeView() === 'stream') {
      const emptyFilters: DashboardFilters = {
        gatewayIds: [],
        sensorTypes: [],
        sensorIds: [],
      };

      this.streamFilters.set(emptyFilters);
      this.startStream(this.toStreamParameters(emptyFilters));
      return;
    }

    const defaults = this.defaultQueryFilters();
    this.queryFilters.set(defaults);
    void this.resetQueryAndLoad();
  }

  onNextQueryPage(): void {
    if (!this.canGoToNextQueryPage() || !this.queryNextCursor) {
      return;
    }

    this.queryPreviousCursors.push(this.queryCurrentCursor);
    this.queryCurrentCursor = this.queryNextCursor;
    this.queryPage.update((page) => page + 1);
    void this.loadQueryPage(this.queryCurrentCursor);
  }

  onPreviousQueryPage(): void {
    if (!this.canGoToPreviousQueryPage()) {
      return;
    }

    this.queryCurrentCursor = this.queryPreviousCursors.pop();
    this.queryPage.update((page) => Math.max(1, page - 1));
    void this.loadQueryPage(this.queryCurrentCursor);
  }

  canGoToPreviousQueryPage(): boolean {
    return !this.isQueryLoading() && this.queryPreviousCursors.length > 0;
  }

  canGoToNextQueryPage(): boolean {
    return !this.isQueryLoading() && this.queryHasNextPage() && Boolean(this.queryNextCursor);
  }

  canExportQuery(): boolean {
    return this.dataMode() === 'clear';
  }

  async onExportQuery(): Promise<void> {
    if (!this.canExportQuery() || this.isExporting()) {
      return;
    }

    const filters = this.normalizeQueryFilters(this.queryFilters());
    const exportParams: ExportParameters = {
      from: filters.from ?? '',
      to: filters.to ?? '',
      ...this.toStreamParameters(filters),
    };

    this.isExporting.set(true);

    try {
      const rows = await firstValueFrom(
        this.validatedMeasureFacadeService.export(exportParams).pipe(toArray()),
      );

      this.downloadAsCsv(rows);
    } finally {
      this.isExporting.set(false);
    }
  }

  private async loadFilterOptions(): Promise<void> {
    try {
      const sensorsPromise = firstValueFrom(this.sensorService.getAllSensors(0));
      // During impersonation, even if dataMode is 'obfuscated', DO NOT use AdminGatewayService (403)
      const gatewaysPromise = firstValueFrom(this.gatewayService.getGateways());

      const [gateways, sensors] = await Promise.all([gatewaysPromise, sensorsPromise]);

      this.gatewayOptions.set(this.uniqueSorted(gateways.map((gateway) => gateway.gatewayId)));
      this.sensorTypeOptions.set(
        this.uniqueSorted(
          sensors
            .map((sensor) => sensor.sensorType)
            .filter((sensorType) => typeof sensorType === 'string' && sensorType.length > 0),
        ),
      );
      this.sensorOptions.set(
        this.uniqueSorted(
          sensors
            .map((sensor) => sensor.sensorId)
            .filter((sensorId) => typeof sensorId === 'string' && sensorId.length > 0),
        ),
      );
    } catch {
      this.gatewayOptions.set([]);
      this.sensorTypeOptions.set([]);
      this.sensorOptions.set([]);
    }
  }

  private startStream(params: StreamParameters): void {
    const runId = ++this.streamRunId;
    this.stopStream();
    this.streamMeasures.set([]);
    this.isStreamLoading.set(true);

    if (this.dataMode() === 'obfuscated') {
      this.streamSubscription = this.obfuscatedMeasureService.openStream(params).subscribe({
        next: (batch) => {
          if (!this.isStreamRunCurrent(runId)) {
            return;
          }

          this.streamMeasures.update((rows) => this.takeLastRows([...rows, ...batch]));
        },
        error: () => {
          if (!this.isStreamRunCurrent(runId)) {
            return;
          }

          this.isStreamLoading.set(false);
        },
      });

      this.isStreamLoading.set(false);
      return;
    }

    this.streamSubscription = this.validatedMeasureFacadeService.openStream(params).subscribe({
      next: (row) => {
        if (!this.isStreamRunCurrent(runId)) {
          return;
        }

        this.streamMeasures.update((rows) => this.takeLastRows([...rows, row]));
      },
      error: () => {
        if (!this.isStreamRunCurrent(runId)) {
          return;
        }

        this.isStreamLoading.set(false);
      },
    });

    this.isStreamLoading.set(false);
  }

  private async resetQueryAndLoad(): Promise<void> {
    const normalized = this.normalizeQueryFilters(this.queryFilters());
    this.queryFilters.set(normalized);

    this.queryCurrentCursor = undefined;
    this.queryNextCursor = undefined;
    this.queryPreviousCursors = [];
    this.queryPage.set(1);
    this.queryMeasures.set([]);

    await this.loadQueryPage();
    this.queryInitialized = true;
  }

  private async loadQueryPage(cursor?: string): Promise<void> {
    const runId = ++this.queryRunId;
    this.isQueryLoading.set(true);

    const params = this.buildQueryParameters(this.queryFilters(), cursor);

    try {
      const page =
        this.dataMode() === 'obfuscated'
          ? await firstValueFrom(this.obfuscatedMeasureService.query(params))
          : await firstValueFrom(this.validatedMeasureFacadeService.query(params));

      if (!this.isQueryRunCurrent(runId)) {
        return;
      }

      this.queryMeasures.set(this.sortByTimestampAsc(page.data));
      this.queryNextCursor = page.nextCursor;
      this.queryHasNextPage.set(Boolean(page.hasMore && page.nextCursor));
    } catch {
      if (!this.isQueryRunCurrent(runId)) {
        return;
      }

      this.queryMeasures.set([]);
      this.queryNextCursor = undefined;
      this.queryHasNextPage.set(false);
    } finally {
      if (this.isQueryRunCurrent(runId)) {
        this.isQueryLoading.set(false);
      }
    }
  }

  private buildQueryParameters(filters: DashboardFilters, cursor?: string): QueryParameters {
    const normalized = this.normalizeQueryFilters(filters);

    const query: QueryParameters = {
      from: normalized.from ?? '',
      to: normalized.to ?? '',
      limit: DataDashboardPageComponent.QUERY_PAGE_SIZE,
    };

    if (cursor) {
      query.cursor = cursor;
    }

    if (normalized.gatewayIds && normalized.gatewayIds.length > 0) {
      query.gatewayIds = normalized.gatewayIds;
    }

    if (normalized.sensorTypes && normalized.sensorTypes.length > 0) {
      query.sensorTypes = normalized.sensorTypes;
    }

    if (normalized.sensorIds && normalized.sensorIds.length > 0) {
      query.sensorIds = normalized.sensorIds;
    }

    return query;
  }

  private normalizeStreamFilters(filters: DashboardFilters): DashboardFilters {
    return {
      gatewayIds: this.asArray(filters.gatewayIds),
      sensorTypes: this.asArray(filters.sensorTypes),
      sensorIds: this.asArray(filters.sensorIds),
    };
  }

  private normalizeQueryFilters(filters: DashboardFilters): DashboardFilters {
    const current = this.queryFilters();
    const defaults = this.defaultQueryFilters();
    const nowIso = new Date().toISOString();
    const from = filters.from ?? current.from ?? defaults.from ?? nowIso;
    const to = filters.to ?? current.to ?? defaults.to ?? nowIso;

    return {
      gatewayIds: this.asArray(filters.gatewayIds),
      sensorTypes: this.asArray(filters.sensorTypes),
      sensorIds: this.asArray(filters.sensorIds),
      from,
      to,
    };
  }

  private toStreamParameters(filters: DashboardFilters): StreamParameters {
    const stream: StreamParameters = {};

    if (filters.gatewayIds && filters.gatewayIds.length > 0) {
      stream.gatewayIds = filters.gatewayIds;
    }

    if (filters.sensorTypes && filters.sensorTypes.length > 0) {
      stream.sensorTypes = filters.sensorTypes;
    }

    if (filters.sensorIds && filters.sensorIds.length > 0) {
      stream.sensorIds = filters.sensorIds;
    }

    return stream;
  }

  private defaultQueryFilters(): DashboardFilters {
    const toDate = new Date();
    const fromDate = new Date(
      toDate.getTime() - DataDashboardPageComponent.DEFAULT_QUERY_WINDOW_HOURS * 60 * 60 * 1000,
    );

    return {
      gatewayIds: [],
      sensorTypes: [],
      sensorIds: [],
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
    };
  }

  private takeLastRows(
    rows: Array<CheckedEnvelope | ObfuscatedEnvelope>,
  ): Array<CheckedEnvelope | ObfuscatedEnvelope> {
    if (rows.length <= DataDashboardPageComponent.STREAM_PAGE_SIZE) {
      return rows;
    }

    return rows.slice(-DataDashboardPageComponent.STREAM_PAGE_SIZE);
  }

  private asArray(values?: string[]): string[] {
    if (!values || values.length === 0) {
      return [];
    }

    return [...values];
  }

  private uniqueSorted(values: string[]): string[] {
    return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
  }

  private sortByTimestampAsc(
    rows: Array<CheckedEnvelope | ObfuscatedEnvelope>,
  ): Array<CheckedEnvelope | ObfuscatedEnvelope> {
    return [...rows].sort((left, right) => {
      const leftMs = Date.parse(left.timestamp);
      const rightMs = Date.parse(right.timestamp);

      if (Number.isNaN(leftMs) || Number.isNaN(rightMs)) {
        return left.timestamp.localeCompare(right.timestamp);
      }

      return leftMs - rightMs;
    });
  }

  private downloadAsCsv(rows: CheckedEnvelope[]): void {
    const header = [
      'timestamp',
      'gatewayId',
      'sensorId',
      'sensorType',
      'value',
      'unit',
      'isOutOfBounds',
    ];

    const body = rows.map((row) => [
      row.timestamp,
      row.gatewayId,
      row.sensorId,
      row.sensorType,
      row.value,
      row.unit,
      row.isOutofBounds,
    ]);

    const csv = [
      header.join(','),
      ...body.map((line) => line.map((value) => this.escapeCsv(value)).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `query-export-${new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')}.csv`;
    anchor.click();

    URL.revokeObjectURL(url);
  }

  private escapeCsv(value: unknown): string {
    let raw = '';

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      raw = String(value);
    } else if (value != null) {
      raw = JSON.stringify(value);
    }

    if (!/[",\n]/.test(raw)) {
      return raw;
    }

    return `"${raw.replaceAll('"', '""')}"`;
  }

  private isStreamRunCurrent(runId: number): boolean {
    return this.streamRunId === runId;
  }

  private isQueryRunCurrent(runId: number): boolean {
    return this.queryRunId === runId;
  }

  private stopStream(): void {
    if (this.streamSubscription) {
      this.streamSubscription.unsubscribe();
      this.streamSubscription = null;
    }

    this.obfuscatedMeasureService.closeStream();
    this.validatedMeasureFacadeService.closeStream();
    this.isStreamLoading.set(false);
  }

  private asDataMode(value: unknown): DashboardDataMode {
    return value === 'obfuscated' ? 'obfuscated' : 'clear';
  }
}
