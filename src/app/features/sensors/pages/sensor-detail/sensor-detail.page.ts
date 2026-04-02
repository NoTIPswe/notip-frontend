import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, distinctUntilChanged, filter, map } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';
import { Sensor } from '../../../../core/models/sensor';
import { CheckedEnvelope, ObfuscatedEnvelope } from '../../../../core/models/measure';
import { TelemetryChartComponent } from '../../../dashboard/components/telemetry-chart/telemetry-chart.component';
import { TelemetryTableComponent } from '../../../dashboard/components/telemetry-table/telemetry-table.component';
import { ObfuscatedMeasureService } from '../../../dashboard/services/obfuscated-measure.service';
import { ValidatedMeasureFacadeService } from '../../../dashboard/services/validated-measure-facade.service';
import { SensorService } from '../../services/sensor.service';

@Component({
  selector: 'app-sensor-detail-page',
  standalone: true,
  imports: [TelemetryTableComponent, TelemetryChartComponent],
  templateUrl: './sensor-detail.page.html',
  styleUrl: './sensor-detail.page.css',
})
export class SensorDetailPageComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly authService = inject(AuthService);
  private readonly sensorService = inject(SensorService);
  private readonly obfuscatedMeasureService = inject(ObfuscatedMeasureService);
  private readonly validatedMeasureFacadeService = inject(ValidatedMeasureFacadeService);

  private streamSubscription: Subscription | null = null;

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
        takeUntilDestroyed(),
      )
      .subscribe((id) => {
        this.sensorId.set(id);
        this.loadSensor(id);
        this.startTelemetryStream(id);
      });
  }

  ngOnDestroy(): void {
    this.stopTelemetryStream();
  }

  private loadSensor(sensorId: string): void {
    this.errorMessage.set(null);

    this.sensorService
      .getAllSensors(0)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (rows) => {
          const selected = rows.find((row) => row.sensorId === sensorId) ?? null;
          this.sensor.set(selected);

          if (!selected) {
            this.errorMessage.set('Sensore non trovato.');
          }
        },
        error: () => {
          this.errorMessage.set('Impossibile caricare il dettaglio sensore.');
        },
      });
  }

  private startTelemetryStream(sensorId: string): void {
    this.stopTelemetryStream();
    this.telemetry.set([]);
    this.isTelemetryLoading.set(true);

    const filters = {
      gatewayIds: [],
      sensorIds: [sensorId],
      sensorTypes: [],
    };

    if (this.authService.isImpersonating()) {
      this.streamSubscription = this.obfuscatedMeasureService.openStream(filters).subscribe({
        next: (batch) => {
          this.telemetry.update((rows) => [...rows, ...batch]);
          this.isTelemetryLoading.set(false);
        },
        error: () => {
          this.isTelemetryLoading.set(false);
          this.errorMessage.set('Impossibile ricevere stream telemetria.');
        },
      });
      return;
    }

    this.streamSubscription = this.validatedMeasureFacadeService.openStream(filters).subscribe({
      next: (row) => {
        this.telemetry.update((rows) => [...rows, row]);
        this.isTelemetryLoading.set(false);
      },
      error: () => {
        this.isTelemetryLoading.set(false);
        this.errorMessage.set('Impossibile ricevere stream telemetria.');
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
}
