import { Injectable, inject } from '@angular/core';
import { DecryptedEnvelope } from '../models/measure';
import { ThresholdService } from './threshold.service';

@Injectable({ providedIn: 'root' })
export class DataEvaluationService {
  private readonly thresholds = inject(ThresholdService);

  evaluate(envelope: DecryptedEnvelope): boolean {
    const cached = this.thresholds.getCached();
    const isSensorIdItem = (item: unknown): item is { sensorId: string } =>
      typeof item === 'object' &&
      item !== null &&
      'sensorId' in item &&
      typeof (item as Record<string, unknown>)['sensorId'] === 'string';
    const isSensorTypeItem = (item: unknown): item is { sensorType: string } =>
      typeof item === 'object' &&
      item !== null &&
      'sensorType' in item &&
      typeof (item as Record<string, unknown>)['sensorType'] === 'string';

    const bySensorId = cached.find(
      (item) => isSensorIdItem(item) && item.sensorId === envelope.sensorId,
    );
    const bySensorType = cached.find(
      (item) => isSensorTypeItem(item) && item.sensorType === envelope.sensorType,
    );
    const selected = bySensorId ?? bySensorType;

    if (!selected) {
      return false;
    }

    const min = selected.minValue ?? null;
    const max = selected.maxValue ?? null;

    if (min === null && max === null) {
      return false;
    }

    if (min !== null && envelope.value < min) {
      return true;
    }

    if (max !== null && envelope.value > max) {
      return true;
    }

    return false;
  }
}
