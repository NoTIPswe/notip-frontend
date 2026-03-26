import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { Sensor } from '../../../core/models/sensor';

interface SensorDto {
  id: string;
  gateway_id?: string;
  type: string;
  unit?: string;
}

@Injectable({ providedIn: 'root' })
export class SensorService {
  private readonly http = inject(HttpClient);

  getAllSensors(): Observable<Sensor[]> {
    return this.http
      .get<SensorDto[]>('/api/data/sensors')
      .pipe(map((rows) => rows.map((row) => this.toSensor(row))));
  }

  getGatewaySensors(id: string): Observable<Sensor[]> {
    const params = new HttpParams().set('gatewayId', id);
    return this.http
      .get<SensorDto[]>('/api/data/sensors', { params })
      .pipe(map((rows) => rows.map((row) => this.toSensor(row))));
  }

  private toSensor(row: SensorDto): Sensor {
    const mapped: Sensor = {
      id: row.id,
      gatewayId: row.gateway_id ?? '',
      type: row.type,
    };

    if (row.unit) {
      mapped.unit = row.unit;
    }

    return mapped;
  }
}
