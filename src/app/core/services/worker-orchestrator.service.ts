import { Injectable, Signal, inject, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { SESSION_LIFECYCLE, SessionLifeCycle } from '../auth/contracts';
import {
  DecryptedBatchProgress,
  DecryptedTelemetry,
  GatewayKeyMap,
  KeyVersionMismatchEvent,
  TelemetryEnvelope,
  WorkerError,
} from '../models/measure';

@Injectable({ providedIn: 'root' })
export class WorkerOrchestratorService {
  private readonly ready = signal(false);
  private readonly keysReady = signal(false);
  private readonly workerErrorSubject = new Subject<WorkerError>();
  private readonly keyVersionMismatchSubject = new Subject<KeyVersionMismatchEvent>();

  readonly workerError$: Observable<WorkerError> = this.workerErrorSubject.asObservable();
  readonly keyVersionMismatch$: Observable<KeyVersionMismatchEvent> =
    this.keyVersionMismatchSubject.asObservable();
  private readonly slc = inject<SessionLifeCycle>(SESSION_LIFECYCLE);

  constructor() {
    this.slc.logout$.subscribe(() => {
      this.ready.set(false);
      this.keysReady.set(false);
    });
  }

  createOrchestrator(): Promise<void> {
    this.ready.set(true);
    return Promise.resolve();
  }

  spawnWorker(): void {
    this.ready.set(true);
  }

  isReady(): Signal<boolean> {
    return this.ready.asReadonly();
  }

  keysInitialized(): Signal<boolean> {
    return this.keysReady.asReadonly();
  }

  initializeKeys(keys: GatewayKeyMap): Observable<void> {
    return new Observable<void>((subscriber) => {
      const hasInitPayload = Object.keys(keys).length > 0;
      this.keysReady.set(hasInitPayload);
      subscriber.next();
      subscriber.complete();
    });
  }

  decryptEnvelope(envelope: TelemetryEnvelope): Promise<DecryptedTelemetry> {
    if (!this.keysReady()) {
      const error = new Error('WORKER_NOT_READY');
      return Promise.reject<DecryptedTelemetry>(error);
    }

    // Placeholder adapter while integrating @notip/crypto-sdk.
    return Promise.resolve({
      gatewayId: envelope.gatewayId,
      sensorId: envelope.sensorId,
      sensorType: envelope.sensorType,
      timestamp: envelope.timestamp,
      value: Number.NaN,
    });
  }

  decryptBatch(envelopes: TelemetryEnvelope[]): Observable<DecryptedBatchProgress> {
    return new Observable<DecryptedBatchProgress>((subscriber) => {
      let completed = 0;

      for (const envelope of envelopes) {
        completed += 1;
        subscriber.next({
          total: envelopes.length,
          completed,
          failed: 0,
          lastDecrypted: {
            gatewayId: envelope.gatewayId,
            sensorId: envelope.sensorId,
            sensorType: envelope.sensorType,
            timestamp: envelope.timestamp,
            value: Number.NaN,
          },
        });
      }

      subscriber.complete();
    });
  }

  ping(): Promise<boolean> {
    return Promise.resolve(this.ready());
  }
}
