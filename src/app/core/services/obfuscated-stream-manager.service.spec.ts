import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EventSourceMessage, fetchEventSource } from '@microsoft/fetch-event-source';
import { TelemetryEnvelope } from '../models/measure';
import { AuthService } from './auth.service';
import { ObfuscatedStreamManagerService } from './obfuscated-stream-manager.service';

vi.mock('@microsoft/fetch-event-source', () => ({
  fetchEventSource: vi.fn(),
}));

describe('ObfuscatedStreamManagerService', () => {
  let service: ObfuscatedStreamManagerService;
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

  beforeEach(async () => {
    authMock.getToken.mockReset();
    authMock.login.mockReset();
    fetchEventSourceMock.mockReset();

    await TestBed.configureTestingModule({
      providers: [ObfuscatedStreamManagerService, { provide: AuthService, useValue: authMock }],
    }).compileComponents();

    service = TestBed.inject(ObfuscatedStreamManagerService);
  });

  it('emits observable error and triggers login when token is missing', async () => {
    authMock.getToken.mockResolvedValue('');

    await expect(firstValueFrom(service.openStream({ gatewayIds: ['gw-1'] }))).rejects.toThrow(
      'Missing auth token for SSE stream',
    );

    expect(authMock.login).toHaveBeenCalledOnce();
    expect(fetchEventSourceMock).not.toHaveBeenCalled();
  });

  it('opens stream and emits telemetry envelopes', async () => {
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

    const firstEnvelopePromise = firstValueFrom(
      service.openStream({
        gatewayIds: ['gw-1'],
        sensorTypes: ['temperature'],
        sensorIds: ['sensor-1'],
      }),
    );

    const received = await firstEnvelopePromise;
    service.closeStream();

    expect(received).toEqual(envelope);

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

  it('emits observable error on first malformed message', async () => {
    authMock.getToken.mockResolvedValue('token-2');

    fetchEventSourceMock.mockImplementation(async (_input, init) => {
      if (!init) {
        return;
      }
      const options = init;
      await options.onopen?.(new Response(null, { status: 200 }));
      options.onmessage?.({ data: 'not-json' } as EventSourceMessage);
    });

    await expect(firstValueFrom(service.openStream({}))).rejects.toThrow(
      'Malformed SSE message rejected',
    );
  });
});
