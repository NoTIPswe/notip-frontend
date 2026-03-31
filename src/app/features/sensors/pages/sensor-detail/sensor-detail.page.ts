import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, filter, map } from 'rxjs';
import { StreamStatus } from '../../../../core/models/enums';
import { Sensor } from '../../../../core/models/sensor';
import { MeasureFacade } from '../../../dashboard/facades/measure.facade';
import { TelemetryChartComponent } from '../../../dashboard/components/telemetry-chart/telemetry-chart.component';
import { TelemetryTableComponent } from '../../../dashboard/components/telemetry-table/telemetry-table.component';
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
  private readonly sensorService = inject(SensorService);
  private readonly measureFacade = inject(MeasureFacade);

  readonly sensorId = signal<string>('');
  readonly sensor = signal<Sensor | null>(null);
  readonly errorMessage = signal<string | null>(null);

  readonly telemetry = this.measureFacade.processedMeasures();
  readonly isTelemetryLoading = this.measureFacade.isLoading();
  readonly streamStatus = toSignal(this.measureFacade.streamStatus(), {
    initialValue: StreamStatus.closed,
  });

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

        this.measureFacade.closeStream();
        this.measureFacade.openStream({
          gatewayIds: [],
          sensorIds: [id],
          sensorTypes: [],
        });
      });
  }

  ngOnDestroy(): void {
    this.measureFacade.closeStream();
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
}
