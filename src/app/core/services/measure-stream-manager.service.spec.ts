import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventSourceMessage, fetchEventSource } from '@microsoft/fetch-event-source';
import { StreamStatus } from '../models/enums';
import { TelemetryEnvelope } from '../models/measure';
import { AuthService } from './auth.service';
import { MeasureStreamManagerService } from './measure-stream-manager.service';

vi.mock('@microsoft/fetch-event-source', () => ({
  fetchEventSource: vi.fn(),
}));

describe('MeasureStreamManagerService', () => {
  let service: MeasureStreamManagerService;
  const fetchEventSourceMock = vi.mocked(fetchEventSource);

  const authMock = {
    getToken: vi.fn(),
    login: vi.fn(),
  };

  const envelope: TelemetryEnvelope = {
    gatewayId: 'gw-1',
    sensorId: 'sensor-1',
    sensorType: 'temperature',
    timestamp: '2026-03-31T10:00:00.000Z',
    keyVersion: 1,
    encryptedData: 'enc',
    iv: 'iv',
    authTag: 'tag',
    unit: 'C',
  };

  const flushMicrotasks = async (): Promise<void> => {
    await Promise.resolve();
    await Promise.resolve();
  };

  beforeEach(async () => {
    authMock.getToken.mockReset();
    authMock.login.mockReset();
    fetchEventSourceMock.mockReset();

    await TestBed.configureTestingModule({
      providers: [MeasureStreamManagerService, { provide: AuthService, useValue: authMock }],
    }).compileComponents();

    service = TestBed.inject(MeasureStreamManagerService);
  });

  it('emits error and triggers login when token is missing', async () => {
    const statuses: StreamStatus[] = [];
    service.streamStatus().subscribe((status) => statuses.push(status));

    authMock.getToken.mockResolvedValue('');

    service.openStream({ gatewayIds: ['gw-1'] });
    await flushMicrotasks();

    expect(statuses).toContain(StreamStatus.error);
    expect(authMock.login).toHaveBeenCalledOnce();
    expect(fetchEventSourceMock).not.toHaveBeenCalled();
  });

  it('opens stream, emits connected status and telemetry envelopes', async () => {
    const statuses: StreamStatus[] = [];
    service.streamStatus().subscribe((status) => statuses.push(status));

    authMock.getToken.mockResolvedValue('token-1');

    fetchEventSourceMock.mockImplementation(async (_input, init) => {
      if (!init) {
        return;
      }
      const options = init;
      await options.onopen?.(new Response(null, { status: 200 }));
      options.onmessage?.({ data: JSON.stringify(envelope) } as EventSourceMessage);

      await new Promise<void>((resolve) => {
        const signal = options.signal;
        if (!signal || signal.aborted) {
          resolve();
          return;
        }
        signal.addEventListener('abort', () => resolve(), { once: true });
      });
    });

    const firstEnvelopePromise = firstValueFrom(service.stream$());

    service.openStream({
      gatewayIds: ['gw-1'],
      sensorTypes: ['temperature'],
      sensorIds: ['sensor-1'],
    });

    const received = await firstEnvelopePromise;
    service.closeStream();
    await flushMicrotasks();

    expect(received).toEqual(envelope);
    expect(statuses).toContain(StreamStatus.connected);

    const call = fetchEventSourceMock.mock.calls[0];
    const input = call[0];
    let streamUrl: string;
    if (typeof input === 'string') {
      streamUrl = input;
    } else if (input instanceof URL) {
      streamUrl = input.toString();
    } else {
      streamUrl = input.url;
    }

    expect(streamUrl).toContain('/api/data/measures/stream?');
    expect(streamUrl).toContain('gatewayId=gw-1');
    expect(streamUrl).toContain('sensorType=temperature');
    expect(streamUrl).toContain('sensorId=sensor-1');

    const options = call[1];
    expect(options.headers).toEqual({ Authorization: 'Bearer token-1' });
  });

  it('emits error when too many malformed messages are received', async () => {
    const statuses: StreamStatus[] = [];
    service.streamStatus().subscribe((status) => statuses.push(status));

    authMock.getToken.mockResolvedValue('token-2');

    fetchEventSourceMock.mockImplementation(async (_input, init) => {
      if (!init) {
        return;
      }
      const options = init;
      await options.onopen?.(new Response(null, { status: 200 }));
      options.onmessage?.({ data: 'not-json' } as EventSourceMessage);
      options.onmessage?.({ data: 'still-not-json' } as EventSourceMessage);
      options.onmessage?.({ data: 'again-not-json' } as EventSourceMessage);
    });

    service.openStream({});
    await flushMicrotasks();

    expect(statuses).toContain(StreamStatus.error);

    service.closeStream();
    await flushMicrotasks();
    expect(statuses).toContain(StreamStatus.closed);
  });
});
