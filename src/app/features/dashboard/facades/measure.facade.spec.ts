import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of, Subject, throwError } from 'rxjs';
import { StreamStatus } from '../../../core/models/enums';
import {
  DecryptedEnvelope,
  ExportParameters,
  MeasurePage,
  ObfuscatedEnvelope,
  QueryParameters,
  StreamParameters,
} from '../../../core/models/measure';
import { DataEvaluationService } from '../../../core/services/data-evaluation.service';
import { MeasureService } from '../services/measure.service';
import { MeasureFacade } from './measure.facade';

describe('MeasureFacade', () => {
  let facade: MeasureFacade;

  const measureServiceMock = {
    openStream: vi.fn(),
    query: vi.fn(),
    export: vi.fn(),
    closeStream: vi.fn(),
    streamStatus: vi.fn(),
  };

  const dataEvaluationServiceMock = {
    evaluate: vi.fn(),
  };

  const decryptedRow: DecryptedEnvelope = {
    type: 'decrypted',
    gatewayId: 'gw-1',
    sensorId: 'sensor-1',
    sensorType: 'temperature',
    timestamp: '2026-03-31T10:00:00.000Z',
    value: 42,
    unit: 'C',
    isOutOfBounds: false,
  };

  const obfuscatedRow: ObfuscatedEnvelope = {
    type: 'obfuscated',
    gatewayId: 'gw-2',
    sensorId: 'sensor-2',
    sensorType: 'humidity',
    timestamp: '2026-03-31T10:01:00.000Z',
  };

  beforeEach(async () => {
    measureServiceMock.openStream.mockReset();
    measureServiceMock.query.mockReset();
    measureServiceMock.export.mockReset();
    measureServiceMock.closeStream.mockReset();
    measureServiceMock.streamStatus.mockReset();
    dataEvaluationServiceMock.evaluate.mockReset();

    await TestBed.configureTestingModule({
      providers: [
        MeasureFacade,
        { provide: MeasureService, useValue: measureServiceMock },
        { provide: DataEvaluationService, useValue: dataEvaluationServiceMock },
      ],
    }).compileComponents();

    facade = TestBed.inject(MeasureFacade);
  });

  it('evaluates decrypted rows and updates state when querying', () => {
    const qp: QueryParameters = {
      from: '2026-03-01T00:00:00.000Z',
      to: '2026-03-31T23:59:59.999Z',
      limit: 50,
    };
    const query$ = new Subject<MeasurePage>();
    dataEvaluationServiceMock.evaluate.mockReturnValue(true);
    measureServiceMock.query.mockReturnValue(query$.asObservable());

    let result: MeasurePage | undefined;
    facade.query(qp).subscribe((page) => {
      result = page;
    });

    expect(facade.isLoading()()).toBe(true);

    query$.next({ data: [decryptedRow, obfuscatedRow], hasMore: false });
    query$.complete();

    expect(dataEvaluationServiceMock.evaluate).toHaveBeenCalledOnce();
    expect(dataEvaluationServiceMock.evaluate).toHaveBeenCalledWith(decryptedRow);
    expect(result?.data[0]).toMatchObject({ type: 'decrypted', isOutOfBounds: true });
    expect(result?.data[1]).toEqual(obfuscatedRow);
    expect(facade.processedMeasures()()).toEqual(result?.data);
    expect(facade.isLoading()()).toBe(false);
  });

  it('resets loading when query fails', () => {
    const qp: QueryParameters = {
      from: '2026-03-01T00:00:00.000Z',
      to: '2026-03-31T23:59:59.999Z',
      limit: 50,
    };
    measureServiceMock.query.mockReturnValue(throwError(() => new Error('query failed')));

    facade.query(qp).subscribe({
      error: () => undefined,
    });

    expect(facade.isLoading()()).toBe(false);
  });

  it('evaluates stream rows and resets loading on openStream success', () => {
    const sp: StreamParameters = { gatewayIds: ['gw-1'] };
    dataEvaluationServiceMock.evaluate.mockReturnValue(false);
    measureServiceMock.openStream.mockReturnValue(of([decryptedRow, obfuscatedRow]));

    facade.openStream(sp);

    expect(measureServiceMock.openStream).toHaveBeenCalledWith(sp);
    expect(dataEvaluationServiceMock.evaluate).toHaveBeenCalledOnce();
    expect(facade.processedMeasures()()).toEqual([
      { ...decryptedRow, isOutOfBounds: false },
      obfuscatedRow,
    ]);
    expect(facade.isLoading()()).toBe(false);
  });

  it('resets loading when openStream fails', () => {
    measureServiceMock.openStream.mockReturnValue(throwError(() => new Error('stream failed')));

    facade.openStream({});

    expect(facade.isLoading()()).toBe(false);
  });

  it('evaluates exported rows and resets loading', () => {
    const dp: ExportParameters = {
      from: '2026-03-01T00:00:00.000Z',
      to: '2026-03-31T23:59:59.999Z',
    };
    dataEvaluationServiceMock.evaluate.mockReturnValue(true);
    measureServiceMock.export.mockReturnValue(of([decryptedRow, obfuscatedRow]));

    facade.export(dp);

    expect(measureServiceMock.export).toHaveBeenCalledWith(dp);
    expect(dataEvaluationServiceMock.evaluate).toHaveBeenCalledOnce();
    expect(facade.processedMeasures()()[0]).toMatchObject({
      type: 'decrypted',
      isOutOfBounds: true,
    });
    expect(facade.isLoading()()).toBe(false);
  });

  it('delegates closeStream and streamStatus to MeasureService', () => {
    const status$ = of(StreamStatus.connected);
    measureServiceMock.streamStatus.mockReturnValue(status$);

    facade.closeStream();

    expect(measureServiceMock.closeStream).toHaveBeenCalledOnce();
    expect(facade.streamStatus()).toBe(status$);
  });
});
