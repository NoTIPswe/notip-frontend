import { Component, input, output } from '@angular/core';

export type TypeThresholdPayload = {
  sensorType: string;
  minValue?: number;
  maxValue?: number;
};

export type SensorThresholdPayload = {
  sensorId: string;
  minValue?: number;
  maxValue?: number;
};

@Component({
  selector: 'app-threshold-form',
  standalone: true,
  templateUrl: './threshold-form.component.html',
  styleUrl: './threshold-form.component.css',
})
export class ThresholdFormComponent {
  readonly isSaving = input<boolean>(false);

  readonly typeSubmitted = output<TypeThresholdPayload>();
  readonly sensorSubmitted = output<SensorThresholdPayload>();
  readonly cancelRequested = output<void>();

  submitType(event: Event, sensorType: string, minRaw: string, maxRaw: string): void {
    event.preventDefault();

    const cleanSensorType = sensorType.trim();
    if (!cleanSensorType) {
      return;
    }

    const minValue = this.parseNumber(minRaw);
    const maxValue = this.parseNumber(maxRaw);

    this.typeSubmitted.emit({
      sensorType: cleanSensorType,
      ...(minValue === undefined ? {} : { minValue }),
      ...(maxValue === undefined ? {} : { maxValue }),
    });
  }

  submitSensor(event: Event, sensorId: string, minRaw: string, maxRaw: string): void {
    event.preventDefault();

    const cleanSensorId = sensorId.trim();
    if (!cleanSensorId) {
      return;
    }

    const minValue = this.parseNumber(minRaw);
    const maxValue = this.parseNumber(maxRaw);

    this.sensorSubmitted.emit({
      sensorId: cleanSensorId,
      ...(minValue === undefined ? {} : { minValue }),
      ...(maxValue === undefined ? {} : { maxValue }),
    });
  }

  cancel(): void {
    this.cancelRequested.emit();
  }

  private parseNumber(value: string): number | undefined {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
}
