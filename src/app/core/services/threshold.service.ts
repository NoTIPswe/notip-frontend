import { Injectable, inject } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import {
  SetThresholdDefaultTypeRequestDto,
  SetThresholdSensorRequestDto,
  ThresholdsService,
} from '../../generated/openapi/notip-management-api-openapi';
import { ThresholdConfig } from '../models/threshold';

@Injectable({ providedIn: 'root' })
export class ThresholdService {
  private readonly thresholdsApi = inject(ThresholdsService);

  private cache: ThresholdConfig[] = [];

  fetchThresholds(): Observable<ThresholdConfig[]> {
    return this.thresholdsApi.thresholdsControllerGetThresholds().pipe(
      map((rows) => this.toThresholds(rows as Record<string, unknown>[])),
      tap((rows) => {
        this.cache = rows;
      }),
    );
  }

  getCached(): ThresholdConfig[] {
    return this.cache;
  }

  invalidateCache(): void {
    this.cache = [];
  }

  refreshThresholds(): Observable<ThresholdConfig[]> {
    this.invalidateCache();
    return this.fetchThresholds();
  }

  setDefaultThreshold(
    sensorType: string,
    minValue?: number | null,
    maxValue?: number | null,
  ): Observable<void> {
    const existing = this.getTypeThreshold(sensorType);
    const bounds = this.resolveBounds(minValue, maxValue, existing);

    const body = {
      sensor_type: sensorType,
      min_value: bounds.min,
      max_value: bounds.max,
    } as unknown as SetThresholdDefaultTypeRequestDto;

    return this.thresholdsApi
      .thresholdsControllerSetDefaultThreshold(body)
      .pipe(map(() => undefined));
  }

  setSensorThreshold(
    sensorId: string,
    minValue?: number | null,
    maxValue?: number | null,
  ): Observable<void> {
    const existing = this.getSensorThreshold(sensorId);
    const bounds = this.resolveBounds(minValue, maxValue, existing);

    const body = {
      min_value: bounds.min,
      max_value: bounds.max,
      sensor_type: null,
    } as unknown as SetThresholdSensorRequestDto;

    return this.thresholdsApi
      .thresholdsControllerSetSensorThreshold(sensorId, body)
      .pipe(map(() => undefined));
  }

  deleteSensorThreshold(sensorId: string): Observable<void> {
    return this.thresholdsApi
      .thresholdsControllerDeleteSensorThreshold(sensorId)
      .pipe(map(() => undefined));
  }

  deleteTypeThreshold(sensorType: string): Observable<void> {
    return this.thresholdsApi
      .thresholdsControllerDeleteThresholdType(sensorType)
      .pipe(map(() => undefined));
  }

  private getSensorThreshold(sensorId: string): ThresholdConfig | undefined {
    return this.cache.find((row) => row.type === 'sensorId' && row.sensorId === sensorId);
  }

  private getTypeThreshold(sensorType: string): ThresholdConfig | undefined {
    return this.cache.find((row) => row.type === 'sensorType' && row.sensorType === sensorType);
  }

  private resolveBounds(
    minValue: number | null | undefined,
    maxValue: number | null | undefined,
    existing?: ThresholdConfig,
  ): { min: number | null; max: number | null } {
    const resolvedMin = minValue ?? existing?.minValue ?? null;
    const resolvedMax = maxValue ?? existing?.maxValue ?? null;

    return {
      min: typeof resolvedMin === 'number' ? resolvedMin : null,
      max: typeof resolvedMax === 'number' ? resolvedMax : null,
    };
  }

  private toThresholds(rows: Record<string, unknown>[]): ThresholdConfig[] {
    return rows.flatMap<ThresholdConfig>((row) => {
      const minValue = this.toNullableNumber(row['min_value'] ?? row['minValue']);
      const maxValue = this.toNullableNumber(row['max_value'] ?? row['maxValue']);
      const type = this.normalizeType(row['type']);
      const sensorId = this.toNonEmptyString(row['sensor_id'] ?? row['sensorId']);
      const sensorType = this.toNonEmptyString(row['sensor_type'] ?? row['sensorType']);

      if (type === 'sensorId') {
        if (sensorId) {
          return [{ type: 'sensorId', sensorId, minValue, maxValue }];
        }

        return sensorType ? [{ type: 'sensorType', sensorType, minValue, maxValue }] : [];
      }

      if (type === 'sensorType') {
        if (sensorType) {
          return [{ type: 'sensorType', sensorType, minValue, maxValue }];
        }

        return sensorId ? [{ type: 'sensorId', sensorId, minValue, maxValue }] : [];
      }

      if (sensorId) {
        return [{ type: 'sensorId', sensorId, minValue, maxValue }];
      }

      if (sensorType) {
        return [{ type: 'sensorType', sensorType, minValue, maxValue }];
      }

      return [];
    });
  }

  private normalizeType(type: unknown): 'sensorId' | 'sensorType' | null {
    if (type === 'sensorId' || type === 'sensor_id') {
      return 'sensorId';
    }

    if (type === 'sensorType' || type === 'sensor_type') {
      return 'sensorType';
    }

    return null;
  }

  private toNullableNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number.parseFloat(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return null;
  }

  private toNonEmptyString(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
}
