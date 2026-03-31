import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, from, map, mergeMap, of, scan, switchMap } from 'rxjs';
import { SESSION_LIFECYCLE, SessionLifeCycle } from '../../../core/auth/contracts';
import { StreamStatus } from '../../../core/models/enums';
import {
  DecryptedTelemetry,
  DecryptedEnvelope,
  ExportParameters,
  MeasurePage,
  ObfuscatedEnvelope,
  ProcessedEnvelope,
  QueryParameters,
  StreamParameters,
  TelemetryEnvelope,
} from '../../../core/models/measure';
import { MeasuresService as DataApiMeasuresService } from '../../../generated/openapi/notip-data-api-openapi/api/measures.service';
import { MeasureStreamManagerService } from '../../../core/services/measure-stream-manager.service';
import { WorkerOrchestratorService } from '../../../core/services/worker-orchestrator.service';

@Injectable({ providedIn: 'root' })
export class MeasureService {
  private readonly measuresApi = inject(DataApiMeasuresService);
  private readonly msm = inject(MeasureStreamManagerService);
  private readonly wos = inject(WorkerOrchestratorService);

  constructor() {
    const slc = inject<SessionLifeCycle>(SESSION_LIFECYCLE);

    slc.logout$.subscribe(() => {
      this.closeStream();
    });
  }

  openStream(sp: StreamParameters): Observable<ProcessedEnvelope[]> {
    this.msm.openStream(sp);

    return this.msm.stream$().pipe(
      mergeMap((envelope) => this.decryptEnvelope(envelope)),
      scan((acc, current) => [...acc, current], [] as ProcessedEnvelope[]),
    );
  }

  query(qp: QueryParameters): Observable<MeasurePage> {
    return this.measuresApi
      .measureControllerQuery(
        qp.from,
        qp.to,
        qp.limit ?? 100,
        qp.cursor,
        qp.gatewayIds,
        qp.sensorIds,
        qp.sensorTypes,
      )
      .pipe(switchMap((response) => this.toMeasurePage(response as unknown)));
  }

  export(dp: ExportParameters): Observable<ProcessedEnvelope[]> {
    return this.measuresApi
      .measureControllerExport(dp.from, dp.to, dp.gatewayIds, dp.sensorIds, dp.sensorTypes)
      .pipe(
        switchMap((rows) =>
          this.decryptEnvelopes(
            Array.isArray(rows) ? (rows as unknown as TelemetryEnvelope[]) : [],
          ),
        ),
      );
  }

  closeStream(): void {
    this.msm.closeStream();
  }

  streamStatus(): Observable<StreamStatus> {
    return this.msm.streamStatus();
  }

  private decryptEnvelope(envelope: TelemetryEnvelope): Observable<ProcessedEnvelope> {
    return from(this.wos.decryptEnvelope(envelope)).pipe(
      map((decrypted) => this.toDecryptedEnvelope(decrypted)),
      catchError(() => of(this.toObfuscatedEnvelope(envelope))),
    );
  }

  private decryptEnvelopes(envelopes: TelemetryEnvelope[]): Observable<ProcessedEnvelope[]> {
    if (envelopes.length === 0) {
      return of([]);
    }

    return forkJoin(envelopes.map((envelope) => this.decryptEnvelope(envelope)));
  }

  private toMeasurePage(response: unknown): Observable<MeasurePage> {
    const page = this.asRecord(response);
    const data = Array.isArray(page['data']) ? (page['data'] as TelemetryEnvelope[]) : [];

    return this.decryptEnvelopes(data).pipe(
      map((rows) => {
        const nextCursor = this.asOptionalString(page['nextCursor']);

        if (nextCursor) {
          return {
            data: rows,
            nextCursor,
            hasMore: Boolean(page['hasMore']),
          };
        }

        return {
          data: rows,
          hasMore: Boolean(page['hasMore']),
        };
      }),
    );
  }

  private toDecryptedEnvelope(decrypted: DecryptedTelemetry): DecryptedEnvelope {
    return {
      type: 'decrypted',
      gatewayId: decrypted.gatewayId,
      sensorId: decrypted.sensorId,
      sensorType: decrypted.sensorType,
      timestamp: decrypted.timestamp,
      value: decrypted.value,
      unit: decrypted.unit,
      isOutOfBounds: false,
    };
  }

  private toObfuscatedEnvelope(envelope: TelemetryEnvelope): ObfuscatedEnvelope {
    return {
      type: 'obfuscated',
      gatewayId: envelope.gatewayId,
      sensorId: envelope.sensorId,
      sensorType: envelope.sensorType,
      timestamp: envelope.timestamp,
    };
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  }

  private asOptionalString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
  }
}
