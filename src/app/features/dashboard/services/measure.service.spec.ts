import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, Subject, take, toArray } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SESSION_LIFECYCLE } from '../../../core/auth/contracts';
import { StreamStatus } from '../../../core/models/enums';
import { TelemetryEnvelope } from '../../../core/models/measure';
import { MeasureStreamManagerService } from '../../../core/services/measure-stream-manager.service';
import { WorkerOrchestratorService } from '../../../core/services/worker-orchestrator.service';
import { MeasuresService as DataApiMeasuresService } from '../../../generated/openapi/notip-data-api-openapi/api/measures.service';
import { MeasureService } from './measure.service';

describe('MeasureService', () => {
  let service: MeasureService;
  let sessionLogout$: Subject<void>;

  const measuresApiMock = {
    measureControllerQuery: vi.fn(),
    measureControllerExport: vi.fn(),
  };

  const msmMock = {
    openStream: vi.fn(),
    closeStream: vi.fn(),
    streamStatus: vi.fn(),
    stream$: vi.fn(),
  };

  const wosMock = {
    decryptEnvelope: vi.fn(),
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
    unit: 'C',
  };

  beforeEach(async () => {
    measuresApiMock.measureControllerQuery.mockReset();
    measuresApiMock.measureControllerExport.mockReset();
    msmMock.openStream.mockReset();
    msmMock.closeStream.mockReset();
    msmMock.streamStatus.mockReset();
    msmMock.stream$.mockReset();
    wosMock.decryptEnvelope.mockReset();

    sessionLogout$ = new Subject<void>();
    const freshStream$ = new Subject<TelemetryEnvelope>();
    msmMock.stream$.mockReturnValue(freshStream$.asObservable());
    msmMock.streamStatus.mockReturnValue(of(StreamStatus.connected));

    await TestBed.configureTestingModule({
      providers: [
        MeasureService,
        { provide: DataApiMeasuresService, useValue: measuresApiMock },
        { provide: MeasureStreamManagerService, useValue: msmMock },
        { provide: WorkerOrchestratorService, useValue: wosMock },
        { provide: SESSION_LIFECYCLE, useValue: { logout$: sessionLogout$, logout: vi.fn() } },
      ],
    }).compileComponents();

    service = TestBed.inject(MeasureService);
    msmMock.stream$.mockReturnValue(freshStream$.asObservable());
  });

  it('decrypts streamed envelopes and falls back to obfuscated on failures', async () => {
    const streamSubject = new Subject<TelemetryEnvelope>();
    msmMock.stream$.mockReturnValue(streamSubject.asObservable());

    wosMock.decryptEnvelope
      .mockResolvedValueOnce({
        gatewayId: 'gw-1',
        sensorId: 's-1',
        sensorType: 'temperature',
        timestamp: '2026-03-31T10:00:00.000Z',
        value: 20,
        unit: 'C',
      })
      .mockRejectedValueOnce(new Error('decrypt failed'));

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
        type: 'decrypted',
        gatewayId: 'gw-1',
        sensorId: 's-1',
        sensorType: 'temperature',
        timestamp: '2026-03-31T10:00:00.000Z',
        value: 20,
        unit: 'C',
        isOutOfBounds: false,
      },
    ]);
    expect(emitted[1][1]).toEqual({
      type: 'obfuscated',
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
    wosMock.decryptEnvelope.mockResolvedValue({
      gatewayId: 'gw-1',
      sensorId: 's-1',
      sensorType: 'temperature',
      timestamp: '2026-03-31T10:00:00.000Z',
      value: 22,
      unit: 'C',
    });

    const page = await firstValueFrom(
      service.query({ from: 'from', to: 'to', limit: 50, gatewayIds: ['gw-1'] }),
    );

    expect(page.hasMore).toBe(true);
    expect(page.nextCursor).toBe('next-1');
    expect(page.data[0]).toMatchObject({ type: 'decrypted', value: 22 });
  });

  it('queries and maps page without nextCursor', async () => {
    measuresApiMock.measureControllerQuery.mockReturnValue(
      of({ data: [baseEnvelope], hasMore: false }),
    );
    wosMock.decryptEnvelope.mockResolvedValue({
      gatewayId: 'gw-1',
      sensorId: 's-1',
      sensorType: 'temperature',
      timestamp: '2026-03-31T10:00:00.000Z',
      value: 10,
      unit: 'C',
    });

    const page = await firstValueFrom(service.query({ from: 'from', to: 'to', limit: 10 }));

    expect(page.hasMore).toBe(false);
    expect(page.nextCursor).toBeUndefined();
  });

  it('exports and maps empty arrays safely', async () => {
    measuresApiMock.measureControllerExport.mockReturnValue(of([]));

    await expect(
      firstValueFrom(service.export({ from: 'from', to: 'to', sensorIds: ['s-1'] })),
    ).resolves.toEqual([]);
  });

  it('exports and handles non-array API payload as empty data', async () => {
    measuresApiMock.measureControllerExport.mockReturnValue(of({ unexpected: true }));

    await expect(firstValueFrom(service.export({ from: 'from', to: 'to' }))).resolves.toEqual([]);
  });

  it('delegates closeStream and streamStatus', async () => {
    service.closeStream();
    expect(msmMock.closeStream).toHaveBeenCalledOnce();

    await expect(firstValueFrom(service.streamStatus())).resolves.toBe(StreamStatus.connected);
  });

  it('closes stream when session logout is emitted', () => {
    sessionLogout$.next();

    expect(msmMock.closeStream).toHaveBeenCalledOnce();
  });
});
