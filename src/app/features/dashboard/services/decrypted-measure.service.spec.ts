import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { firstValueFrom, take, toArray } from 'rxjs';
import {
  DecryptedEnvelope,
  ExportParameters,
  QueryParameters,
  StreamParameters,
} from '../../../core/models/measure';
import { AuthService } from '../../../core/services/auth.service';

let DecryptedMeasureServiceToken: typeof import('./decrypted-measure.service').DecryptedMeasureService;

type TestPlaintextMeasure = {
  gatewayId: string;
  sensorId: string;
  sensorType: string;
  timestamp: string;
  value: number;
  unit: string;
};

type TestQueryResponsePage = {
  data: TestPlaintextMeasure[];
  nextCursor?: string;
  hasMore: boolean;
};

const constructorMock = vi.fn();
const queryMeasuresMock = vi.fn();
const streamMeasuresMock = vi.fn();
const exportMeasuresMock = vi.fn();

vi.mock('@notip/crypto-sdk', () => {
  class SdkError extends Error {}
  class ApiError extends SdkError {}
  class ValidationError extends SdkError {}
  class DecryptionError extends SdkError {}

  class DataApiService {
    constructor(config: unknown) {
      constructorMock(config);
    }

    queryMeasures = queryMeasuresMock;
    streamMeasures = streamMeasuresMock;
    exportMeasures = exportMeasuresMock;
  }

  return {
    ApiError,
    DataApiService,
    DecryptionError,
    SdkError,
    ValidationError,
  };
});

describe('DecryptedMeasureService', () => {
  let service: import('./decrypted-measure.service').DecryptedMeasureService;

  const authMock = {
    getToken: vi.fn(),
  };

  const plain1: TestPlaintextMeasure = {
    gatewayId: 'gw-1',
    sensorId: 'sensor-1',
    sensorType: 'temperature',
    timestamp: '2026-03-31T10:00:00.000Z',
    value: 42,
    unit: 'C',
  };

  const plain2: TestPlaintextMeasure = {
    gatewayId: 'gw-1',
    sensorId: 'sensor-2',
    sensorType: 'humidity',
    timestamp: '2026-03-31T10:01:00.000Z',
    value: 58,
    unit: '%',
  };

  beforeEach(async () => {
    const module = await import('./decrypted-measure.service');
    DecryptedMeasureServiceToken = module.DecryptedMeasureService;

    constructorMock.mockReset();
    queryMeasuresMock.mockReset();
    streamMeasuresMock.mockReset();
    exportMeasuresMock.mockReset();
    authMock.getToken.mockReset();

    authMock.getToken.mockResolvedValue('token-1');

    await TestBed.configureTestingModule({
      providers: [DecryptedMeasureServiceToken, { provide: AuthService, useValue: authMock }],
    }).compileComponents();

    service = TestBed.inject(DecryptedMeasureServiceToken);
  });

  it('queries and maps page into decrypted envelopes', async () => {
    const qp: QueryParameters = {
      from: '2026-03-01T00:00:00.000Z',
      to: '2026-03-31T23:59:59.999Z',
      limit: 50,
      cursor: 'cur-1',
      gatewayIds: ['gw-1'],
      sensorIds: ['sensor-1'],
      sensorTypes: ['temperature'],
    };

    const sdkPage: TestQueryResponsePage = {
      data: [plain1],
      nextCursor: 'cur-2',
      hasMore: true,
    };
    queryMeasuresMock.mockResolvedValue(sdkPage);

    const result = await firstValueFrom(service.query(qp));

    expect(queryMeasuresMock).toHaveBeenCalledWith({
      from: qp.from,
      to: qp.to,
      limit: qp.limit,
      cursor: qp.cursor,
      gatewayId: qp.gatewayIds,
      sensorId: qp.sensorIds,
      sensorType: qp.sensorTypes,
    });
    expect(result).toEqual({
      data: [
        {
          gatewayId: 'gw-1',
          sensorId: 'sensor-1',
          sensorType: 'temperature',
          timestamp: '2026-03-31T10:00:00.000Z',
          value: 42,
          unit: 'C',
        },
      ],
      nextCursor: 'cur-2',
      hasMore: true,
    });
  });

  it('streams decrypted envelopes one-by-one', async () => {
    const sp: StreamParameters = {
      gatewayIds: ['gw-1'],
      sensorIds: ['sensor-1', 'sensor-2'],
      sensorTypes: ['temperature', 'humidity'],
    };

    streamMeasuresMock.mockReturnValue(
      (async function* () {
        await Promise.resolve();
        yield plain1;
        yield plain2;
      })(),
    );

    const emitted = await firstValueFrom(service.openStream(sp).pipe(take(2), toArray()));

    expect(streamMeasuresMock).toHaveBeenCalledOnce();
    const [streamModel, signal] = streamMeasuresMock.mock.calls[0] as [
      Record<string, unknown>,
      AbortSignal,
    ];
    expect(streamModel).toEqual({
      gatewayId: ['gw-1'],
      sensorId: ['sensor-1', 'sensor-2'],
      sensorType: ['temperature', 'humidity'],
    });
    expect(signal).toBeInstanceOf(AbortSignal);
    expect(emitted).toEqual<DecryptedEnvelope[]>([
      {
        gatewayId: 'gw-1',
        sensorId: 'sensor-1',
        sensorType: 'temperature',
        timestamp: '2026-03-31T10:00:00.000Z',
        value: 42,
        unit: 'C',
      },
      {
        gatewayId: 'gw-1',
        sensorId: 'sensor-2',
        sensorType: 'humidity',
        timestamp: '2026-03-31T10:01:00.000Z',
        value: 58,
        unit: '%',
      },
    ]);
  });

  it('exports decrypted envelopes one-by-one', async () => {
    const ep: ExportParameters = {
      from: '2026-03-01T00:00:00.000Z',
      to: '2026-03-31T23:59:59.999Z',
      gatewayIds: ['gw-1'],
      sensorIds: ['sensor-1'],
      sensorTypes: ['temperature'],
    };

    exportMeasuresMock.mockReturnValue(
      (async function* () {
        await Promise.resolve();
        yield plain1;
      })(),
    );

    const emitted = await firstValueFrom(service.export(ep).pipe(take(1), toArray()));

    expect(exportMeasuresMock).toHaveBeenCalledWith({
      from: ep.from,
      to: ep.to,
      gatewayId: ['gw-1'],
      sensorId: ['sensor-1'],
      sensorType: ['temperature'],
    });
    expect(emitted).toEqual<DecryptedEnvelope[]>([
      {
        gatewayId: 'gw-1',
        sensorId: 'sensor-1',
        sensorType: 'temperature',
        timestamp: '2026-03-31T10:00:00.000Z',
        value: 42,
        unit: 'C',
      },
    ]);
  });

  it('aborts previous stream when opening a new one', () => {
    streamMeasuresMock
      .mockReturnValueOnce(
        (async function* () {
          await new Promise(() => undefined);
          yield plain1;
        })(),
      )
      .mockReturnValueOnce(
        (async function* () {
          await Promise.resolve();
          yield plain1;
        })(),
      );

    service.openStream({ gatewayIds: ['gw-1'] });
    const [, firstSignal] = streamMeasuresMock.mock.calls[0] as [
      Record<string, unknown>,
      AbortSignal,
    ];

    service.openStream({ gatewayIds: ['gw-2'] });

    expect(firstSignal.aborted).toBe(true);
  });

  it('closes stream safely when no active stream exists', () => {
    expect(() => service.closeStream()).not.toThrow();
  });

  it('creates sdk with api base and token provider', async () => {
    expect(constructorMock).toHaveBeenCalledOnce();
    const [config] = constructorMock.mock.calls[0] as [
      { baseUrl: string; tokenProvider: () => Promise<string> },
    ];

    expect(config.baseUrl).toBe('/api');
    await expect(config.tokenProvider()).resolves.toBe('token-1');
    expect(authMock.getToken).toHaveBeenCalled();
  });
});
