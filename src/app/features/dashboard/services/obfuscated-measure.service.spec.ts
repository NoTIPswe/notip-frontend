import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, Subject, take, toArray } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TelemetryEnvelope } from '../../../core/models/measure';
import { ObfuscatedStreamManagerService } from '../../../core/services/obfuscated-stream-manager.service';
import { MeasuresService as DataApiMeasuresService } from '../../../generated/openapi/notip-data-api-openapi/api/measures.service';
import { ObfuscatedMeasureService } from './obfuscated-measure.service';

describe('MeasureService', () => {
  let service: ObfuscatedMeasureService;

  const measuresApiMock = {
    measureControllerQuery: vi.fn(),
  };

  const msmMock = {
    openStream: vi.fn(),
    closeStream: vi.fn(),
  };

  const baseEnvelope: TelemetryEnvelope = {
    gatewayId: 'gw-1',
    sensorId: 's-1',
    sensorType: 'temperature',
    timestamp: '2026-03-31T10:00:00.000Z',
    keyVersion: 1,
    encryptedData: 'enc',
    iv: 'iv',
    authTag: 'tag',
  };

  beforeEach(async () => {
    measuresApiMock.measureControllerQuery.mockReset();
    msmMock.openStream.mockReset();
    msmMock.closeStream.mockReset();

    const freshStream$ = new Subject<TelemetryEnvelope>();
    msmMock.openStream.mockReturnValue(freshStream$.asObservable());

    await TestBed.configureTestingModule({
      providers: [
        ObfuscatedMeasureService,
        { provide: DataApiMeasuresService, useValue: measuresApiMock },
        { provide: ObfuscatedStreamManagerService, useValue: msmMock },
      ],
    }).compileComponents();

    service = TestBed.inject(ObfuscatedMeasureService);
    msmMock.openStream.mockReturnValue(freshStream$.asObservable());
  });

  it('maps streamed envelopes to obfuscated rows', async () => {
    const streamSubject = new Subject<TelemetryEnvelope>();
    msmMock.openStream.mockReturnValue(streamSubject.asObservable());

    const resultPromise = firstValueFrom(
      service.openStream({ gatewayIds: ['gw-1'] }).pipe(take(2), toArray()),
    );

    const secondEnvelope: TelemetryEnvelope = { ...baseEnvelope, sensorId: 's-2', timestamp: 't2' };
    streamSubject.next(baseEnvelope);
    streamSubject.next(secondEnvelope);

    const emitted = await resultPromise;

    expect(msmMock.openStream).toHaveBeenCalledWith({ gatewayIds: ['gw-1'] });
    expect(emitted[0]).toEqual([
      {
        gatewayId: 'gw-1',
        sensorId: 's-1',
        sensorType: 'temperature',
        timestamp: '2026-03-31T10:00:00.000Z',
      },
    ]);
    expect(emitted[1][0]).toEqual({
      gatewayId: 'gw-1',
      sensorId: 's-2',
      sensorType: 'temperature',
      timestamp: 't2',
    });
  });

  it('queries and maps page with nextCursor', async () => {
    measuresApiMock.measureControllerQuery.mockReturnValue(
      of({ data: [baseEnvelope], nextCursor: 'next-1', hasMore: true }),
    );

    const page = await firstValueFrom(
      service.query({ from: 'from', to: 'to', limit: 50, gatewayIds: ['gw-1'] }),
    );

    expect(page.hasMore).toBe(true);
    expect(page.nextCursor).toBe('next-1');
    expect(page.data[0]).toMatchObject({
      gatewayId: 'gw-1',
      sensorId: 's-1',
      sensorType: 'temperature',
      timestamp: '2026-03-31T10:00:00.000Z',
    });
  });

  it('queries and maps page without nextCursor', async () => {
    measuresApiMock.measureControllerQuery.mockReturnValue(
      of({ data: [baseEnvelope], hasMore: false }),
    );

    const page = await firstValueFrom(service.query({ from: 'from', to: 'to', limit: 10 }));

    expect(page.hasMore).toBe(false);
    expect(page.nextCursor).toBeUndefined();
    expect(page.data).toHaveLength(1);
    expect(page.data[0]).toMatchObject({
      gatewayId: 'gw-1',
      sensorId: 's-1',
      sensorType: 'temperature',
      timestamp: '2026-03-31T10:00:00.000Z',
    });
  });

  it('queries and maps array-wrapped page response', async () => {
    measuresApiMock.measureControllerQuery.mockReturnValue(
      of([{ data: [baseEnvelope], nextCursor: 'next-2', hasMore: true }]),
    );

    const page = await firstValueFrom(service.query({ from: 'from', to: 'to', limit: 10 }));

    expect(page.hasMore).toBe(true);
    expect(page.nextCursor).toBe('next-2');
    expect(page.data).toHaveLength(1);
    expect(page.data[0]).toMatchObject({
      gatewayId: 'gw-1',
      sensorId: 's-1',
      sensorType: 'temperature',
      timestamp: '2026-03-31T10:00:00.000Z',
    });
  });

  it('queries and maps non-array payload to empty data', async () => {
    measuresApiMock.measureControllerQuery.mockReturnValue(
      of({ data: { not: 'an-array' }, hasMore: false }),
    );

    const page = await firstValueFrom(service.query({ from: 'from', to: 'to', limit: 10 }));

    expect(page.data).toEqual([]);
    expect(page.hasMore).toBe(false);
  });

  it('delegates closeStream', () => {
    service.closeStream();
    expect(msmMock.closeStream).toHaveBeenCalledOnce();
  });
});
