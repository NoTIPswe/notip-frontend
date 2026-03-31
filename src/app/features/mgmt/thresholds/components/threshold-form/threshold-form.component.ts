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

  submitType(event: Event, sensorType: string, minRaw: string, maxRaw: string): void {
    event.preventDefault();

    const cleanSensorType = sensorType.trim();
    if (!cleanSensorType) {
      return;
    }

    this.typeSubmitted.emit({
      sensorType: cleanSensorType,
      minValue: this.parseNumber(minRaw),
      maxValue: this.parseNumber(maxRaw),
    });
  }

  submitSensor(event: Event, sensorId: string, minRaw: string, maxRaw: string): void {
    event.preventDefault();

    const cleanSensorId = sensorId.trim();
    if (!cleanSensorId) {
      return;
    }

    this.sensorSubmitted.emit({
      sensorId: cleanSensorId,
      minValue: this.parseNumber(minRaw),
      maxValue: this.parseNumber(maxRaw),
    });
  }

  private parseNumber(value: string): number | undefined {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
}
