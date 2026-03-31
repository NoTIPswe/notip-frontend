import { Injectable, inject } from '@angular/core';
import { map, Observable, switchMap, timer } from 'rxjs';
import { Sensor } from '../../../core/models/sensor';
import { SensorService as DataApiSensorService } from '../../../generated/openapi/notip-data-api-openapi/api/sensor.service';
import { SensorDto } from '../../../generated/openapi/notip-data-api-openapi/model/sensor-dto';

const DEFAULT_SENSORS_REFRESH_MS = 10_000;

@Injectable({ providedIn: 'root' })
export class SensorService {
  private readonly sensorApi = inject(DataApiSensorService);

  getAllSensors(refreshMs = DEFAULT_SENSORS_REFRESH_MS): Observable<Sensor[]> {
    return this.withRefresh(refreshMs, () => this.fetchSensors());
  }

  getGatewaySensors(id: string, refreshMs = DEFAULT_SENSORS_REFRESH_MS): Observable<Sensor[]> {
    return this.withRefresh(refreshMs, () => this.fetchSensors(id));
  }

  private withRefresh(
    refreshMs: number,
    fetchFn: () => Observable<Sensor[]>,
  ): Observable<Sensor[]> {
    if (refreshMs <= 0) {
      return fetchFn();
    }

    return timer(0, refreshMs).pipe(switchMap(() => fetchFn()));
  }

  private fetchSensors(gatewayId?: string): Observable<Sensor[]> {
    return this.sensorApi
      .sensorControllerGetSensors(gatewayId)
      .pipe(map((rows) => rows.map((row) => this.toSensor(row))));
  }

  private toSensor(row: SensorDto): Sensor {
    return {
      sensorId: row.sensorId,
      gatewayId: row.gatewayId,
      sensorType: row.sensorType,
      lastSeen: row.lastSeen,
    };
  }
}
