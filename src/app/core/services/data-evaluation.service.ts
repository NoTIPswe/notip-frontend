import { Injectable, inject } from '@angular/core';
import { DecryptedEnvelope } from '../models/measure';
import { ThresholdService } from './threshold.service';

@Injectable({ providedIn: 'root' })
export class DataEvaluationService {
  private readonly thresholds = inject(ThresholdService);

  evaluate(envelope: DecryptedEnvelope): boolean {
    const cached = this.thresholds.getCached();
    const bySensorId = cached.find((item) => item.sensorId === envelope.sensorId);
    const bySensorType = cached.find((item) => item.sensorType === envelope.sensorType);
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
