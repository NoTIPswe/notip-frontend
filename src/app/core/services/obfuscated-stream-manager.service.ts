// TODO: Refactor this service because it has been made by Copilot

import { fetchEventSource, type EventSourceMessage } from '@microsoft/fetch-event-source';
import { Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { StreamParameters, TelemetryEnvelope } from '../models/measure';
import { AuthService } from './auth.service';

interface ObservableChannel<T> {
  push: (value: T) => void;
  error: (err: unknown) => void;
  close: () => void;
  stream$: Observable<T>;
}

function createObservableChannel<T>(): ObservableChannel<T> {
  const subject = new Subject<T>();

  return {
    push: (value: T) => subject.next(value),
    error: (err: unknown) => {
      const error = err instanceof Error ? err : new Error('SSE channel error');
      subject.error(error);
    },
    close: () => subject.complete(),
    stream$: subject.asObservable(),
  };
}

@Injectable({ providedIn: 'root' })
export class ObfuscatedStreamManagerService {
  private readonly auth = inject(AuthService);
  private readonly maxConsecutiveMalformedMessages = 3;

  private abortController: AbortController | null = null;
  private channel: ObservableChannel<TelemetryEnvelope> | null = null;
  private streamSessionId = 0;

  openStream(sp: StreamParameters): Observable<TelemetryEnvelope> {
    this.closeStream();

    const abortController = new AbortController();
    const channel = createObservableChannel<TelemetryEnvelope>();
    const sessionId = ++this.streamSessionId;
    this.abortController = abortController;
    this.channel = channel;

    void this.startStream(sp, sessionId, abortController, channel);

    return new Observable<TelemetryEnvelope>((subscriber) => {
      const subscription = channel.stream$.subscribe(subscriber);

      return () => {
        subscription.unsubscribe();
        if (this.channel === channel) {
          this.closeStream();
        }
      };
    });
  }

  closeStream(): void {
    this.streamSessionId += 1;

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  }

  private async startStream(
    sp: StreamParameters,
    sessionId: number,
    abortController: AbortController,
    channel: ObservableChannel<TelemetryEnvelope>,
  ): Promise<void> {
    const query = this.buildQuery(sp);
    const token = await this.auth.getToken();

    if (!this.isActiveSession(sessionId, abortController)) {
      channel.close();
      return;
    }

    if (!token) {
      this.auth.login();
      channel.error(new Error('Missing auth token for SSE stream'));
      return;
    }

    let consecutiveMalformedMessages = 0;

    try {
      await fetchEventSource(`/api/data/measures/stream?${query.toString()}`, {
        signal: abortController.signal,
        openWhenHidden: true,
        headers: { Authorization: `Bearer ${token}` },
        onopen: (response) => {
          if (!response.ok) {
            return Promise.reject(new Error(`SSE handshake failed with status ${response.status}`));
          }

          return Promise.resolve();
        },
        onmessage: (event: EventSourceMessage) => {
          if (!this.isActiveSession(sessionId, abortController)) {
            return;
          }

          if (!event.data) {
            this.handleMalformedMessage(
              ++consecutiveMalformedMessages,
              abortController,
              channel,
              'Empty SSE payload',
            );
            return;
          }

          try {
            const envelope = this.parseTelemetryEnvelope(event.data);
            consecutiveMalformedMessages = 0;
            channel.push(envelope);
          } catch (error) {
            this.handleMalformedMessage(
              ++consecutiveMalformedMessages,
              abortController,
              channel,
              error,
            );
          }
        },
        onclose: () => {
          channel.close();
        },
        onerror: (error) => {
          if (!this.isActiveSession(sessionId, abortController)) {
            return;
          }

          channel.error(this.toError(error, 'SSE stream error'));
          abortController.abort();
          return undefined;
        },
      });
    } catch (error) {
      if (!this.isActiveSession(sessionId, abortController)) {
        return;
      }

      channel.error(this.toError(error, 'SSE stream error'));
    } finally {
      if (this.abortController === abortController) {
        this.abortController = null;
      }

      if (this.channel === channel) {
        this.channel = null;
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

  private parseTelemetryEnvelope(raw: string): TelemetryEnvelope {
    let parsed: unknown;

    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      throw new Error('Invalid JSON payload in SSE message');
    }

    if (this.isTokenExpiredEvent(parsed)) {
      throw new Error('SSE token expired');
    }

    if (!this.isTelemetryEnvelope(parsed)) {
      throw new Error('Invalid telemetry envelope payload');
    }

    return parsed;
  }

  private handleMalformedMessage(
    count: number,
    abortController: AbortController,
    channel: ObservableChannel<TelemetryEnvelope>,
    reason: unknown,
  ): void {
    if (count < this.maxConsecutiveMalformedMessages) {
      return;
    }

    channel.error(
      this.toError(
        reason,
        `Too many malformed SSE messages: ${count} consecutive payloads rejected`,
      ),
    );
    abortController.abort();
  }

  private isActiveSession(sessionId: number, abortController: AbortController): boolean {
    return !abortController.signal.aborted && this.streamSessionId === sessionId;
  }

  private toError(value: unknown, fallbackMessage: string): Error {
    if (value instanceof Error) {
      return value;
    }

    return new Error(fallbackMessage);
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
