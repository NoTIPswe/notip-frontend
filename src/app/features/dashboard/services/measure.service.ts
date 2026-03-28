import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, scan } from 'rxjs';
import { SESSION_LIFECYCLE, SessionLifeCycle } from '../../../core/auth/contracts';
import { StreamStatus } from '../../../core/models/enums';
import {
  DecryptedEnvelope,
  ExportParameters,
  MeasurePage,
  ObfuscatedEnvelope,
  ProcessedEnvelope,
  QueryParameters,
  StreamParameters,
  TelemetryEnvelope,
} from '../../../core/models/measure';
import { MeasureStreamManagerService } from '../../../core/services/measure-stream-manager.service';
import { WorkerOrchestratorService } from '../../../core/services/worker-orchestrator.service';

@Injectable({ providedIn: 'root' })
export class MeasureService {
  private readonly http = inject(HttpClient);
  private readonly msm = inject(MeasureStreamManagerService);
  private readonly os = inject(WorkerOrchestratorService);

  constructor() {
    const slc = inject<SessionLifeCycle>(SESSION_LIFECYCLE);

    slc.logout$.subscribe(() => {
      this.closeStream();
    });
  }

  openStream(sp: StreamParameters): Observable<ProcessedEnvelope[]> {
    this.msm.openStream(sp);

    return this.msm.stream$().pipe(
      map((envelope) => this.mapEnvelope(envelope)),
      scan((acc, current) => [...acc, current], [] as ProcessedEnvelope[]),
    );
  }

  query(qp: QueryParameters): Observable<MeasurePage> {
    let params = new HttpParams()
      .set('from', qp.from)
      .set('to', qp.to)
      .set('limit', String(qp.limit ?? 100));

    if (qp.cursor) {
      params = params.set('cursor', qp.cursor);
    }

    for (const gatewayId of qp.gatewayIds ?? []) {
      params = params.append('gatewayId', gatewayId);
    }

    for (const sensorType of qp.sensorTypes ?? []) {
      params = params.append('sensorType', sensorType);
    }

    for (const sensorId of qp.sensorIds ?? []) {
      params = params.append('sensorId', sensorId);
    }

    return this.http.get<MeasurePage>('/api/data/measures/query', { params });
  }

  export(dp: ExportParameters): Observable<ProcessedEnvelope[]> {
    let params = new HttpParams().set('from', dp.from).set('to', dp.to);

    for (const gatewayId of dp.gatewayIds ?? []) {
      params = params.append('gatewayId', gatewayId);
    }

    for (const sensorType of dp.sensorTypes ?? []) {
      params = params.append('sensorType', sensorType);
    }

    for (const sensorId of dp.sensorIds ?? []) {
      params = params.append('sensorId', sensorId);
    }

    return this.http
      .get<TelemetryEnvelope[]>('/api/data/measures/export', { params })
      .pipe(map((rows) => rows.map((row) => this.mapEnvelope(row))));
  }

  closeStream(): void {
    this.msm.closeStream();
  }

  streamStatus(): Observable<StreamStatus> {
    return this.msm.streamStatus();
  }

  mapEnvelope(envelope: TelemetryEnvelope): ProcessedEnvelope {
    if (!this.os.keysInitialized()()) {
      const obfuscated: ObfuscatedEnvelope = {
        type: 'obfuscated',
        gatewayId: envelope.gatewayId,
        sensorId: envelope.sensorId,
        sensorType: envelope.sensorType,
        timestamp: envelope.timestamp,
      };

      return obfuscated;
    }

    const decrypted: DecryptedEnvelope = {
      type: 'decrypted',
      gatewayId: envelope.gatewayId,
      sensorId: envelope.sensorId,
      sensorType: envelope.sensorType,
      timestamp: envelope.timestamp,
      value: Number.NaN,
      unit: '',
      isOutOfBounds: false,
    };

    return decrypted;
  }
}
