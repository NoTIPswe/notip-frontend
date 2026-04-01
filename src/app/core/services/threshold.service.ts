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
      sensor_type: '',
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
    return rows.map((row) => {
      const mapped: Partial<ThresholdConfig> = {
        minValue: typeof row['min_value'] === 'number' ? row['min_value'] : null,
        maxValue: typeof row['max_value'] === 'number' ? row['max_value'] : null,
      };

      if (row['type'] == 'sensorId' && typeof row['sensor_id'] === 'string') {
        (mapped as unknown as { sensorId?: string }).sensorId = row['sensor_id'];
        (mapped as unknown as { type?: string }).type = 'sensorId';
      }

      if (row['type'] === 'sensorType' && typeof row['sensor_type'] === 'string') {
        (mapped as unknown as { sensorType?: string }).sensorType = row['sensor_type'];
        (mapped as unknown as { type?: string }).type = 'sensorType';
      }

      return mapped as ThresholdConfig;
    });
  }
}
