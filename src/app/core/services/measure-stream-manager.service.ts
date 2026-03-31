import { fetchEventSource, type EventSourceMessage } from '@microsoft/fetch-event-source';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { StreamStatus } from '../models/enums';
import { StreamParameters, TelemetryEnvelope } from '../models/measure';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class MeasureStreamManagerService {
  private readonly auth = inject(AuthService);
  private readonly envelopeSubject = new Subject<TelemetryEnvelope>();
  private readonly statusSubject = new Subject<StreamStatus>();
  private readonly retryDelayMs = 1500;
  private readonly maxConsecutiveMalformedMessages = 3;

  private abortController: AbortController | null = null;
  private streamSessionId = 0;

  openStream(sp: StreamParameters): void {
    this.closeStream();

    const abortController = new AbortController();
    const sessionId = ++this.streamSessionId;
    this.abortController = abortController;

    void this.startStreamLoop(sp, sessionId, abortController);
  }

  closeStream(): void {
    this.streamSessionId += 1;

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    this.statusSubject.next(StreamStatus.closed);
  }

  streamStatus(): Observable<StreamStatus> {
    return this.statusSubject.asObservable();
  }

  stream$(): Observable<TelemetryEnvelope> {
    return this.envelopeSubject.asObservable();
  }

  private async startStreamLoop(
    sp: StreamParameters,
    sessionId: number,
    abortController: AbortController,
  ): Promise<void> {
    while (!abortController.signal.aborted && this.streamSessionId === sessionId) {
      const query = this.buildQuery(sp);
      const token = await this.auth.getToken();

      if (abortController.signal.aborted || this.streamSessionId !== sessionId) {
        return;
      }

      if (!token) {
        this.statusSubject.next(StreamStatus.error);
        this.auth.login();
        return;
      }

      let consecutiveMalformedMessages = 0;

      try {
        await fetchEventSource(`/api/data/measures/stream?${query.toString()}`, {
          signal: abortController.signal,
          openWhenHidden: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          onopen: (response) => {
            if (!response.ok) {
              return Promise.reject(
                new Error(`SSE handshake failed with status ${response.status}`),
              );
            }

            this.statusSubject.next(StreamStatus.connected);
            return Promise.resolve();
          },
          onmessage: (event: EventSourceMessage) => {
            const raw: unknown = event.data;
            if (typeof raw !== 'string') {
              consecutiveMalformedMessages += 1;
              this.throwIfTooManyMalformedMessages(consecutiveMalformedMessages);
              return;
            }

            let parsed: unknown;
            try {
              parsed = JSON.parse(raw) as unknown;
            } catch {
              consecutiveMalformedMessages += 1;
              this.throwIfTooManyMalformedMessages(consecutiveMalformedMessages);
              return;
            }

            if (this.isTokenExpiredEvent(parsed)) {
              throw new Error('SSE token expired');
            }

            if (!this.isTelemetryEnvelope(parsed)) {
              consecutiveMalformedMessages += 1;
              this.throwIfTooManyMalformedMessages(consecutiveMalformedMessages);
              return;
            }

            consecutiveMalformedMessages = 0;
            this.envelopeSubject.next(parsed);
          },
          onclose: () => {
            throw new Error('SSE connection closed');
          },
          onerror: (error) => {
            if (abortController.signal.aborted || this.streamSessionId !== sessionId) {
              return;
            }

            throw error;
          },
        });
      } catch {
        if (abortController.signal.aborted || this.streamSessionId !== sessionId) {
          return;
        }

        this.statusSubject.next(StreamStatus.error);
        await this.waitBeforeRetry(abortController.signal);
      }
    }
  }

  private buildQuery(sp: StreamParameters): URLSearchParams {
    const query = new URLSearchParams();

    for (const gatewayId of sp.gatewayIds ?? []) {
      query.append('gatewayId', gatewayId);
    }

    for (const sensorType of sp.sensorTypes ?? []) {
      query.append('sensorType', sensorType);
    }

    for (const sensorId of sp.sensorIds ?? []) {
      query.append('sensorId', sensorId);
    }

    return query;
  }

  private waitBeforeRetry(signal: AbortSignal): Promise<void> {
    return new Promise((resolve) => {
      if (signal.aborted) {
        resolve();
        return;
      }

      const onAbort = () => {
        clearTimeout(timeoutId);
        resolve();
      };

      const timeoutId = setTimeout(() => {
        signal.removeEventListener('abort', onAbort);
        resolve();
      }, this.retryDelayMs);

      signal.addEventListener('abort', onAbort, { once: true });
    });
  }

  private throwIfTooManyMalformedMessages(count: number): void {
    if (count >= this.maxConsecutiveMalformedMessages) {
      throw new Error(`Too many malformed SSE messages: ${count} consecutive payloads rejected`);
    }
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
      typeof row.keyVersion === 'number' &&
      typeof row.unit === 'string'
    );
  }

  private isTokenExpiredEvent(value: unknown): boolean {
    if (typeof value !== 'object' || value === null) {
      return false;
    }

    const payload = value as Record<string, unknown>;
    return payload['type'] === 'error' && payload['reason'] === 'token_expired';
  }
}
