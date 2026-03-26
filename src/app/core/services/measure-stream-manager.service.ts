import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { StreamStatus } from '../models/enums';
import { StreamParameters, TelemetryEnvelope } from '../models/measure';

@Injectable({ providedIn: 'root' })
export class MeasureStreamManagerService {
  private readonly envelopeSubject = new Subject<TelemetryEnvelope>();
  private readonly statusSubject = new Subject<StreamStatus>();
  private eventSource: EventSource | null = null;

  openStream(sp: StreamParameters): void {
    this.closeStream();

    const query = new URLSearchParams();
    for (const gatewayId of sp.gatewayIds) {
      query.append('gatewayId', gatewayId);
    }
    for (const sensorType of sp.sensorTypes ?? []) {
      query.append('sensorType', sensorType);
    }
    if (sp.since) {
      query.set('since', sp.since);
    }

    this.eventSource = new EventSource(`/api/data/measures/stream?${query.toString()}`);
    this.statusSubject.next(StreamStatus.connected);

    this.eventSource.onmessage = (event) => {
      const raw: unknown = (event as MessageEvent<unknown>).data;
      if (typeof raw !== 'string') {
        return;
      }

      const parsed = JSON.parse(raw) as unknown;
      if (!this.isTelemetryEnvelope(parsed)) {
        return;
      }

      this.envelopeSubject.next(parsed);
    };

    this.eventSource.onerror = () => {
      this.statusSubject.next(StreamStatus.error);
    };
  }

  closeStream(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.statusSubject.next(StreamStatus.closed);
  }

  streamStatus(): Observable<StreamStatus> {
    return this.statusSubject.asObservable();
  }

  stream$(): Observable<TelemetryEnvelope> {
    return this.envelopeSubject.asObservable();
  }

  private isTelemetryEnvelope(value: unknown): value is TelemetryEnvelope {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const row = value as Partial<TelemetryEnvelope>;
    return (
      typeof row.gatewayId === 'string' &&
      typeof row.sensorId === 'string' &&
      typeof row.sensorType === 'string' &&
      typeof row.timestamp === 'string' &&
      typeof row.encryptedData === 'string' &&
      typeof row.iv === 'string' &&
      typeof row.authTag === 'string' &&
      typeof row.keyVersion === 'number'
    );
  }
}
