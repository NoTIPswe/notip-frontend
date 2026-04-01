import { Injectable, inject } from '@angular/core';
import { Observable, map, of, switchMap } from 'rxjs';
import {
  ObfuscatedQueryResPage,
  ObfuscatedEnvelope,
  QueryParameters,
  StreamParameters,
  TelemetryEnvelope,
} from '../../../core/models/measure';
import { MeasuresService as DataApiMeasuresService } from '../../../generated/openapi/notip-data-api-openapi/api/measures.service';
import { ObfuscatedStreamManagerService } from '../../../core/services/obfuscated-stream-manager.service';

@Injectable({ providedIn: 'root' })
export class ObfuscatedMeasureService {
  private readonly measuresApi = inject(DataApiMeasuresService);
  private readonly msm = inject(ObfuscatedStreamManagerService);

  openStream(sp: StreamParameters): Observable<ObfuscatedEnvelope[]> {
    return this.msm.openStream(sp).pipe(map((envelope) => [this.toObfuscatedEnvelope(envelope)]));
  }

  query(qp: QueryParameters): Observable<ObfuscatedQueryResPage> {
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
      .pipe(switchMap((response) => this.toObfuscatedQueryResPage(response as unknown)));
  }

  closeStream(): void {
    this.msm.closeStream();
  }

  private toObfuscatedQueryResPage(response: unknown): Observable<ObfuscatedQueryResPage> {
    const page = this.asRecord(response);
    const data = Array.isArray(page['data']) ? (page['data'] as TelemetryEnvelope[]) : [];
    const rows = data.map((envelope) => this.toObfuscatedEnvelope(envelope));
    const nextCursor = this.asOptionalString(page['nextCursor']);

    if (nextCursor) {
      return of({
        data: rows,
        nextCursor,
        hasMore: Boolean(page['hasMore']),
      });
    }

    return of({
      data: rows,
      hasMore: Boolean(page['hasMore']),
    });
  }

  private toObfuscatedEnvelope(envelope: TelemetryEnvelope): ObfuscatedEnvelope {
    return {
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
