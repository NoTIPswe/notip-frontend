import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DecryptedEnvelope,
  ExportParameters,
  QueryParameters,
  QueryResPage,
  StreamParameters,
} from '../../../core/models/measure';
import { MeasureBoundsEvaluationService } from '../../../core/services/measure-bounds-evaluation.service';
import { DecryptedMeasureService } from './decrypted-measure.service';
import { ValidatedMeasureFacadeService } from './validated-measure-facade.service';

describe('ValidatedMeasureFacadeService', () => {
  let service: ValidatedMeasureFacadeService;

  const decryptedMeasureServiceMock = {
    openStream: vi.fn(),
    query: vi.fn(),
    export: vi.fn(),
    closeStream: vi.fn(),
  };

  const measureBoundsEvaluationServiceMock = {
    evaluate: vi.fn(),
  };

  const row1: DecryptedEnvelope = {
    gatewayId: 'gw-1',
    sensorId: 'sensor-1',
    sensorType: 'temperature',
    timestamp: '2026-03-31T10:00:00.000Z',
    value: 42,
    unit: 'C',
  };

  const row2: DecryptedEnvelope = {
    gatewayId: 'gw-2',
    sensorId: 'sensor-2',
    sensorType: 'humidity',
    timestamp: '2026-03-31T10:01:00.000Z',
    value: 58,
    unit: '%',
  };

  beforeEach(async () => {
    decryptedMeasureServiceMock.openStream.mockReset();
    decryptedMeasureServiceMock.query.mockReset();
    decryptedMeasureServiceMock.export.mockReset();
    decryptedMeasureServiceMock.closeStream.mockReset();
    measureBoundsEvaluationServiceMock.evaluate.mockReset();

    await TestBed.configureTestingModule({
      providers: [
        ValidatedMeasureFacadeService,
        { provide: DecryptedMeasureService, useValue: decryptedMeasureServiceMock },
        {
          provide: MeasureBoundsEvaluationService,
          useValue: measureBoundsEvaluationServiceMock,
        },
      ],
    }).compileComponents();

    service = TestBed.inject(ValidatedMeasureFacadeService);
  });

  it('maps openStream decrypted row to checked row', async () => {
    const sp: StreamParameters = { gatewayIds: ['gw-1'] };
    decryptedMeasureServiceMock.openStream.mockReturnValue(of(row1));
    measureBoundsEvaluationServiceMock.evaluate.mockReturnValue(true);

    const checked = await firstValueFrom(service.openStream(sp));

    expect(decryptedMeasureServiceMock.openStream).toHaveBeenCalledWith(sp);
    expect(measureBoundsEvaluationServiceMock.evaluate).toHaveBeenCalledWith(row1);
    expect(checked).toEqual({ ...row1, isOutofBounds: true });
  });

  it('maps query page to checked query page and preserves cursor', async () => {
    const qp: QueryParameters = {
      from: '2026-03-01T00:00:00.000Z',
      to: '2026-03-31T23:59:59.999Z',
      limit: 50,
      cursor: 'cur-1',
    };

    const page: QueryResPage = {
      data: [row1, row2],
      nextCursor: 'cur-2',
      hasMore: true,
    };

    decryptedMeasureServiceMock.query.mockReturnValue(of(page));
    measureBoundsEvaluationServiceMock.evaluate
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);

    const checkedPage = await firstValueFrom(service.query(qp));

    expect(decryptedMeasureServiceMock.query).toHaveBeenCalledWith(qp);
    expect(measureBoundsEvaluationServiceMock.evaluate).toHaveBeenCalledTimes(2);
    expect(checkedPage).toEqual({
      data: [
        { ...row1, isOutofBounds: true },
        { ...row2, isOutofBounds: false },
      ],
      nextCursor: 'cur-2',
      hasMore: true,
    });
  });

  it('maps query page without nextCursor', async () => {
    const qp: QueryParameters = {
      from: '2026-03-01T00:00:00.000Z',
      to: '2026-03-31T23:59:59.999Z',
      limit: 10,
    };

    const page: QueryResPage = {
      data: [row1],
      hasMore: false,
    };

    decryptedMeasureServiceMock.query.mockReturnValue(of(page));
    measureBoundsEvaluationServiceMock.evaluate.mockReturnValue(false);

    const checkedPage = await firstValueFrom(service.query(qp));

    expect(checkedPage.nextCursor).toBeUndefined();
    expect(checkedPage.hasMore).toBe(false);
    expect(checkedPage.data).toEqual([{ ...row1, isOutofBounds: false }]);
  });

  it('maps export decrypted row to checked row', async () => {
    const ep: ExportParameters = {
      from: '2026-03-01T00:00:00.000Z',
      to: '2026-03-31T23:59:59.999Z',
    };

    decryptedMeasureServiceMock.export.mockReturnValue(of(row2));
    measureBoundsEvaluationServiceMock.evaluate.mockReturnValue(true);

    const checked = await firstValueFrom(service.export(ep));

    expect(decryptedMeasureServiceMock.export).toHaveBeenCalledWith(ep);
    expect(measureBoundsEvaluationServiceMock.evaluate).toHaveBeenCalledWith(row2);
    expect(checked).toEqual({ ...row2, isOutofBounds: true });
  });

  it('delegates closeStream', () => {
    service.closeStream();

    expect(decryptedMeasureServiceMock.closeStream).toHaveBeenCalledOnce();
  });
});
