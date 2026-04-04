import { Component, OnInit, inject, signal } from '@angular/core';
import {
  SensorThresholdPayload,
  ThresholdFormComponent,
  TypeThresholdPayload,
} from '../../components/threshold-form/threshold-form.component';
import {
  ThresholdDeletePayload,
  ThresholdTableComponent,
} from '../../components/threshold-table/threshold-table.component';
import { ThresholdConfig } from '../../../../../core/models/threshold';
import { ThresholdService } from '../../../../../core/services/threshold.service';
import { SensorService } from '../../../../sensors/services/sensor.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { UserRole } from '../../../../../core/models/enums';

@Component({
  selector: 'app-threshold-settings-page',
  standalone: true,
  imports: [ThresholdTableComponent, ThresholdFormComponent],
  templateUrl: './threshold-settings.page.html',
  styleUrl: './threshold-settings.page.css',
})
export class ThresholdSettingsPageComponent implements OnInit {
  private readonly thresholdService = inject(ThresholdService);
  private readonly sensorService = inject(SensorService);
  private readonly authService = inject(AuthService);

  readonly thresholds = signal<ThresholdConfig[]>([]);
  readonly sensorTypeOptions = signal<string[]>([]);
  readonly sensorIdOptions = signal<string[]>([]);
  readonly showForm = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly infoMessage = signal<string | null>(null);
  readonly canEditThresholds = this.authService.getRole() === UserRole.tenant_admin;

  ngOnInit(): void {
    this.loadThresholds();
    this.loadSensorOptions();
  }

  toggleForm(): void {
    if (!this.canEditThresholds) {
      return;
    }

    this.showForm.set(!this.showForm());
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  saveTypeThreshold(payload: TypeThresholdPayload): void {
    if (!this.canEditThresholds) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.infoMessage.set(null);

    this.thresholdService
      .setDefaultThreshold(payload.sensorType, payload.minValue, payload.maxValue)
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.showForm.set(false);
          this.infoMessage.set(`Soglia per type ${payload.sensorType} salvata.`);
          this.loadThresholds();
        },
        error: () => {
          this.isSaving.set(false);
          this.errorMessage.set('Impossibile salvare la soglia per type.');
        },
      });
  }

  saveSensorThreshold(payload: SensorThresholdPayload): void {
    if (!this.canEditThresholds) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.infoMessage.set(null);

    this.thresholdService
      .setSensorThreshold(payload.sensorId, payload.minValue, payload.maxValue)
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.showForm.set(false);
          this.infoMessage.set(`Soglia per sensore ${payload.sensorId} salvata.`);
          this.loadThresholds();
        },
        error: () => {
          this.isSaving.set(false);
          this.errorMessage.set('Impossibile salvare la soglia per sensore.');
        },
      });
  }

  deleteThreshold(payload: ThresholdDeletePayload): void {
    if (!this.canEditThresholds) {
      return;
    }

    const confirmed = globalThis.confirm('Confermi eliminazione soglia selezionata?');
    if (!confirmed) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.infoMessage.set(null);

    const request =
      payload.type === 'sensorId'
        ? this.thresholdService.deleteSensorThreshold(payload.key)
        : this.thresholdService.deleteTypeThreshold(payload.key);

    request.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.infoMessage.set(`Soglia eliminata: ${payload.key}`);
        this.loadThresholds();
      },
      error: () => {
        this.isSaving.set(false);
        this.errorMessage.set('Impossibile eliminare la soglia.');
      },
    });
  }

  private loadThresholds(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.thresholdService.fetchThresholds().subscribe({
      next: (rows) => {
        this.isLoading.set(false);
        this.thresholds.set(rows);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Impossibile caricare la lista soglie.');
      },
    });
  }

  private loadSensorOptions(): void {
    this.sensorService.getAllSensors(0).subscribe({
      next: (rows) => {
        const sensorTypes = Array.from(
          new Set(rows.map((row) => row.sensorType).filter((sensorType) => sensorType.length > 0)),
        ).sort((a, b) => a.localeCompare(b));

        const sensorIds = Array.from(
          new Set(rows.map((row) => row.sensorId).filter((sensorId) => sensorId.length > 0)),
        ).sort((a, b) => a.localeCompare(b));

        this.sensorTypeOptions.set(sensorTypes);
        this.sensorIdOptions.set(sensorIds);
      },
      error: () => {
        this.sensorTypeOptions.set([]);
        this.sensorIdOptions.set([]);
      },
    });
  }
}
