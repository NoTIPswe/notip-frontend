import { Component, DestroyRef, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, distinctUntilChanged, filter, firstValueFrom, map } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { Sensor } from '../../../../core/models/sensor';
import {
  CheckedEnvelope,
  ObfuscatedEnvelope,
  QueryParameters,
  StreamParameters,
} from '../../../../core/models/measure';
import { TelemetryChartComponent } from '../../../dashboard/components/telemetry-chart/telemetry-chart.component';
import { TelemetryTableComponent } from '../../../dashboard/components/telemetry-table/telemetry-table.component';
import { ObfuscatedMeasureService } from '../../../dashboard/services/obfuscated-measure.service';
import { ValidatedMeasureFacadeService } from '../../../dashboard/services/validated-measure-facade.service';
import { SensorService } from '../../services/sensor.service';
import { RomeDateTimePipe } from '../../../../shared/pipes/rome-date-time.pipe';

@Component({
  selector: 'app-sensor-detail-page',
  standalone: true,
  imports: [TelemetryTableComponent, TelemetryChartComponent, RomeDateTimePipe],
  templateUrl: './sensor-detail.page.html',
  styleUrl: './sensor-detail.page.css',
})
export class SensorDetailPageComponent implements OnInit, OnDestroy {
  private static readonly QUERY_PAGE_SIZE = 20;
  private static readonly DEFAULT_QUERY_WINDOW_HOURS = 24;

  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly sensorService = inject(SensorService);
  private readonly obfuscatedMeasureService = inject(ObfuscatedMeasureService);
  private readonly validatedMeasureFacadeService = inject(ValidatedMeasureFacadeService);
  private readonly destroyRef = inject(DestroyRef);

  private streamSubscription: Subscription | null = null;
  private telemetryRunId = 0;

  readonly sensorId = signal<string>('');
  readonly sensor = signal<Sensor | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly telemetry = signal<Array<CheckedEnvelope | ObfuscatedEnvelope>>([]);
  readonly isTelemetryLoading = signal(false);

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('id') ?? ''),
        filter((id) => id.length > 0),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((id) => {
        this.sensorId.set(id);
        this.loadSensor(id);
        this.startTelemetryStream(id);
      });
  }

  ngOnDestroy(): void {
    this.telemetryRunId += 1;
    this.stopTelemetryStream();
  }

  private loadSensor(sensorId: string): void {
    this.errorMessage.set(null);

    this.sensorService
      .getAllSensors(0)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows) => {
          const selected = rows.find((row) => row.sensorId === sensorId) ?? null;
          this.sensor.set(selected);

          if (!selected) {
            this.errorMessage.set('Sensor not found.');
          }
        },
        error: () => {
          this.errorMessage.set('Unable to load sensor details.');
        },
      });
  }

  private startTelemetryStream(sensorId: string): void {
    const runId = ++this.telemetryRunId;
    this.stopTelemetryStream();
    this.telemetry.set([]);
    this.isTelemetryLoading.set(true);

    const streamFilters: StreamParameters = {
      gatewayIds: [],
      sensorIds: [sensorId],
      sensorTypes: [],
    };

    const queryFilters: QueryParameters = {
      ...streamFilters,
      ...this.defaultQueryWindow(),
      limit: SensorDetailPageComponent.QUERY_PAGE_SIZE,
    };

    void this.loadHistoryAndAttachStream(queryFilters, streamFilters, runId);
  }

  private async loadHistoryAndAttachStream(
    queryFilters: QueryParameters,
    streamFilters: StreamParameters,
    runId: number,
  ): Promise<void> {
    try {
      if (this.authService.isImpersonating()) {
        const page = await firstValueFrom(this.obfuscatedMeasureService.query(queryFilters));

        if (!this.isCurrentTelemetryRun(runId)) {
          return;
        }

        this.telemetry.set(page.data);
        this.openObfuscatedStream(streamFilters, runId);
        return;
      }

      const page = await firstValueFrom(this.validatedMeasureFacadeService.query(queryFilters));

      if (!this.isCurrentTelemetryRun(runId)) {
        return;
      }

      this.telemetry.set(page.data);
      this.openValidatedStream(streamFilters, runId);
    } catch {
      if (!this.isCurrentTelemetryRun(runId)) {
        return;
      }

      this.telemetry.set([]);

      if (this.authService.isImpersonating()) {
        this.openObfuscatedStream(streamFilters, runId);
      } else {
        this.openValidatedStream(streamFilters, runId);
      }
    } finally {
      if (this.isCurrentTelemetryRun(runId)) {
        this.isTelemetryLoading.set(false);
      }
    }
  }

  private openObfuscatedStream(filters: StreamParameters, runId: number): void {
    if (this.authService.isImpersonating()) {
      this.streamSubscription = this.obfuscatedMeasureService.openStream(filters).subscribe({
        next: (batch) => {
          if (!this.isCurrentTelemetryRun(runId)) {
            return;
          }

          this.telemetry.update((rows) => [...rows, ...batch]);
          this.isTelemetryLoading.set(false);
        },
        error: () => {
          if (!this.isCurrentTelemetryRun(runId)) {
            return;
          }

          this.isTelemetryLoading.set(false);
          this.errorMessage.set('Unable to receive telemetry stream.');
        },
      });
      return;
    }
  }

  private openValidatedStream(filters: StreamParameters, runId: number): void {
    this.streamSubscription = this.validatedMeasureFacadeService.openStream(filters).subscribe({
      next: (row) => {
        if (!this.isCurrentTelemetryRun(runId)) {
          return;
        }

        this.telemetry.update((rows) => [...rows, row]);
        this.isTelemetryLoading.set(false);
      },
      error: () => {
        if (!this.isCurrentTelemetryRun(runId)) {
          return;
        }

        this.isTelemetryLoading.set(false);
        this.errorMessage.set('Unable to receive telemetry stream.');
      },
    });
  }

  private stopTelemetryStream(): void {
    if (this.streamSubscription) {
      this.streamSubscription.unsubscribe();
      this.streamSubscription = null;
    }

    this.obfuscatedMeasureService.closeStream();
    this.validatedMeasureFacadeService.closeStream();
    this.isTelemetryLoading.set(false);
  }

  private defaultQueryWindow(): Pick<QueryParameters, 'from' | 'to'> {
    const toDate = new Date();
    const fromDate = new Date(
      toDate.getTime() - SensorDetailPageComponent.DEFAULT_QUERY_WINDOW_HOURS * 60 * 60 * 1000,
    );

    return {
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
    };
  }

  private isCurrentTelemetryRun(runId: number): boolean {
    return this.telemetryRunId === runId;
  }
}
