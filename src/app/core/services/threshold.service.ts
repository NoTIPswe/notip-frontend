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

  setDefaultThreshold(sensorType: string, minValue?: number, maxValue?: number): Observable<void> {
    const body: SetThresholdDefaultTypeRequestDto = {
      sensor_type: sensorType,
      min_value: minValue ?? 0,
      max_value: maxValue ?? 0,
    };

    return this.thresholdsApi.thresholdsControllerSetDefaultThreshold(body).pipe(map(() => void 0));
  }

  setSensorThreshold(sensorId: string, minValue?: number, maxValue?: number): Observable<void> {
    const body: SetThresholdSensorRequestDto = {
      min_value: minValue ?? 0,
      max_value: maxValue ?? 0,
      sensor_type: '',
    };

    return this.thresholdsApi
      .thresholdsControllerSetSensorThreshold(sensorId, body)
      .pipe(map(() => void 0));
  }

  deleteSensorThreshold(sensorId: string): Observable<void> {
    return this.thresholdsApi
      .thresholdsControllerDeleteSensorThreshold(sensorId)
      .pipe(map(() => void 0));
  }

  deleteTypeThreshold(sensorType: string): Observable<void> {
    return this.thresholdsApi
      .thresholdsControllerDeleteThresholdType(sensorType)
      .pipe(map(() => void 0));
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
