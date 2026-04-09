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
import { ModalLayerComponent } from '../../../../../shared/components/modal-layer/modal-layer.component';
import { DeleteConfirmModalComponent } from '../../../../../shared/components/delete-confirm-modal/delete-confirm-modal.component';

@Component({
  selector: 'app-threshold-settings-page',
  standalone: true,
  imports: [
    ThresholdTableComponent,
    ThresholdFormComponent,
    ModalLayerComponent,
    DeleteConfirmModalComponent,
  ],
  templateUrl: './threshold-settings.page.html',
  styleUrl: './threshold-settings.page.css',
})
export class ThresholdSettingsPageComponent implements OnInit {
  private readonly thresholdService = inject(ThresholdService);
  private readonly sensorService = inject(SensorService);
  private readonly authService = inject(AuthService);
  private readonly sensorTypeBySensorId = signal<Record<string, string>>({});

  readonly thresholds = signal<ThresholdConfig[]>([]);
  readonly sensorTypeOptions = signal<string[]>([]);
  readonly sensorIdOptions = signal<string[]>([]);
  readonly showForm = signal<boolean>(false);
  readonly deletingThreshold = signal<ThresholdDeletePayload | null>(null);
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
          this.infoMessage.set(`Threshold for type ${payload.sensorType} saved.`);
          this.loadThresholds();
        },
        error: () => {
          this.isSaving.set(false);
          this.errorMessage.set('Unable to save threshold by type.');
        },
      });
  }

  saveSensorThreshold(payload: SensorThresholdPayload): void {
    if (!this.canEditThresholds) {
      return;
    }

    const sensorType = this.sensorTypeBySensorId()[payload.sensorId];
    if (!sensorType) {
      this.errorMessage.set(`Unable to determine sensor type for sensor ${payload.sensorId}.`);
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.infoMessage.set(null);

    this.thresholdService
      .setSensorThreshold(payload.sensorId, sensorType, payload.minValue, payload.maxValue)
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.showForm.set(false);
          this.infoMessage.set(`Threshold for sensor ${payload.sensorId} saved.`);
          this.loadThresholds();
        },
        error: () => {
          this.isSaving.set(false);
          this.errorMessage.set('Unable to save threshold for sensor.');
        },
      });
  }

  deleteThreshold(payload: ThresholdDeletePayload): void {
    if (!this.canEditThresholds) {
      return;
    }

    this.deletingThreshold.set(payload);
  }

  cancelDeleteThreshold(): void {
    this.deletingThreshold.set(null);
  }

  confirmDeleteThreshold(): void {
    const payload = this.deletingThreshold();
    if (!payload || !this.canEditThresholds) {
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
        this.deletingThreshold.set(null);
        this.infoMessage.set(`Threshold deleted: ${payload.key}`);
        this.loadThresholds();
      },
      error: () => {
        this.isSaving.set(false);
        this.errorMessage.set('Unable to delete threshold.');
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
        this.errorMessage.set('Unable to load threshold list.');
      },
    });
  }

  private loadSensorOptions(): void {
    this.sensorService.getAllSensors(0).subscribe({
      next: (rows) => {
        const sensorTypeBySensorId = rows.reduce<Record<string, string>>((acc, row) => {
          const sensorId = row.sensorId.trim();
          const sensorType = row.sensorType.trim();

          if (sensorId.length > 0 && sensorType.length > 0) {
            acc[sensorId] = sensorType;
          }

          return acc;
        }, {});

        const sensorTypes = Array.from(
          new Set(rows.map((row) => row.sensorType).filter((sensorType) => sensorType.length > 0)),
        ).sort((a, b) => a.localeCompare(b));

        const sensorIds = Object.keys(sensorTypeBySensorId).sort((a, b) => a.localeCompare(b));

        this.sensorTypeBySensorId.set(sensorTypeBySensorId);
        this.sensorTypeOptions.set(sensorTypes);
        this.sensorIdOptions.set(sensorIds);
      },
      error: () => {
        this.sensorTypeBySensorId.set({});
        this.sensorTypeOptions.set([]);
        this.sensorIdOptions.set([]);
      },
    });
  }
}
