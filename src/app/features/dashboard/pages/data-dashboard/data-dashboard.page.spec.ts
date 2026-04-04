import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CheckedEnvelope, ObfuscatedEnvelope } from '../../../../core/models/measure';
import { ObfuscatedMeasureService } from '../../services/obfuscated-measure.service';
import { ValidatedMeasureFacadeService } from '../../services/validated-measure-facade.service';
import { DataDashboardPageComponent } from './data-dashboard.page';

describe('DataDashboardPageComponent', () => {
  const obfuscatedMeasureServiceMock = {
    openStream: vi.fn(),
    query: vi.fn(),
    closeStream: vi.fn(),
  };

  const validatedMeasureFacadeServiceMock = {
    openStream: vi.fn(),
    query: vi.fn(),
    closeStream: vi.fn(),
  };

  const routeMock: {
    snapshot: { data: Record<string, unknown> };
  } = {
    snapshot: { data: { dataMode: 'clear' } },
  };

  const checkedRow: CheckedEnvelope = {
    gatewayId: 'gw-1',
    sensorId: 's-1',
    sensorType: 'temperature',
    timestamp: '2026-04-03T10:00:00.000Z',
    value: 21,
    unit: 'C',
    isOutofBounds: false,
  };

  const checkedStreamRow: CheckedEnvelope = {
    ...checkedRow,
    sensorId: 's-2',
    timestamp: '2026-04-03T10:01:00.000Z',
  };

  const obfuscatedRow1: ObfuscatedEnvelope = {
    gatewayId: 'gw-1',
    sensorId: 's-1',
    sensorType: 'temperature',
    timestamp: '2026-04-03T08:00:00.000Z',
  };

  const obfuscatedRow2: ObfuscatedEnvelope = {
    gatewayId: 'gw-2',
    sensorId: 's-2',
    sensorType: 'humidity',
    timestamp: '2026-04-03T09:00:00.000Z',
  };

  const flushPromises = async (): Promise<void> => {
    await Promise.resolve();
    await Promise.resolve();
  };

  const flushAsyncWork = async (
    fixture: ComponentFixture<DataDashboardPageComponent>,
  ): Promise<void> => {
    await fixture.whenStable();
    await flushPromises();
  };

  const hoursDiff = (from: string, to: string): number => {
    return (new Date(to).getTime() - new Date(from).getTime()) / (60 * 60 * 1000);
  };

  beforeEach(async () => {
    obfuscatedMeasureServiceMock.openStream.mockReset();
    obfuscatedMeasureServiceMock.query.mockReset();
    obfuscatedMeasureServiceMock.closeStream.mockReset();

    validatedMeasureFacadeServiceMock.openStream.mockReset();
    validatedMeasureFacadeServiceMock.query.mockReset();
    validatedMeasureFacadeServiceMock.closeStream.mockReset();

    routeMock.snapshot.data = { dataMode: 'clear' };

    await TestBed.configureTestingModule({
      imports: [DataDashboardPageComponent],
      providers: [
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: ObfuscatedMeasureService, useValue: obfuscatedMeasureServiceMock },
        { provide: ValidatedMeasureFacadeService, useValue: validatedMeasureFacadeServiceMock },
      ],
    }).compileComponents();
  });

  it('loads historical clear data before appending stream data', async () => {
    const clearStream$ = new Subject<CheckedEnvelope>();
    validatedMeasureFacadeServiceMock.query.mockReturnValue(
      of({ data: [checkedRow], hasMore: false }),
    );
    validatedMeasureFacadeServiceMock.openStream.mockReturnValue(clearStream$.asObservable());

    const fixture = TestBed.createComponent(DataDashboardPageComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();
    await flushAsyncWork(fixture);

    expect(validatedMeasureFacadeServiceMock.query).toHaveBeenCalledOnce();
    expect(validatedMeasureFacadeServiceMock.openStream).toHaveBeenCalledOnce();

    const queryPayload = validatedMeasureFacadeServiceMock.query.mock.calls[0][0] as {
      from: string;
      to: string;
      limit: number;
    };

    expect(queryPayload.limit).toBe(999);
    expect(hoursDiff(queryPayload.from, queryPayload.to)).toBeGreaterThan(23.5);
    expect(hoursDiff(queryPayload.from, queryPayload.to)).toBeLessThan(24.5);
    expect(new Date(queryPayload.to).getTime()).toBeGreaterThan(
      new Date(queryPayload.from).getTime(),
    );
    expect(component.measures()).toEqual([checkedRow]);
    expect(component.isLoading()).toBe(false);

    clearStream$.next(checkedStreamRow);
    expect(component.measures()).toEqual([checkedRow, checkedStreamRow]);
  });

  it('loads obfuscated history with pagination and opens obfuscated stream', async () => {
    routeMock.snapshot.data = { dataMode: 'obfuscated' };

    const obfuscatedStream$ = new Subject<ObfuscatedEnvelope[]>();
    obfuscatedMeasureServiceMock.query
      .mockReturnValueOnce(of({ data: [obfuscatedRow1], hasMore: true, nextCursor: 'cursor-1' }))
      .mockReturnValueOnce(of({ data: [obfuscatedRow2], hasMore: false }));
    obfuscatedMeasureServiceMock.openStream.mockReturnValue(obfuscatedStream$.asObservable());

    const fixture = TestBed.createComponent(DataDashboardPageComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();
    await flushAsyncWork(fixture);

    expect(obfuscatedMeasureServiceMock.query).toHaveBeenCalledTimes(2);
    expect(obfuscatedMeasureServiceMock.openStream).toHaveBeenCalledOnce();
    expect(validatedMeasureFacadeServiceMock.query).not.toHaveBeenCalled();

    const firstQueryPayload = obfuscatedMeasureServiceMock.query.mock.calls[0][0] as {
      cursor?: string;
    };
    const secondQueryPayload = obfuscatedMeasureServiceMock.query.mock.calls[1][0] as {
      cursor?: string;
    };

    expect(firstQueryPayload.cursor).toBeUndefined();
    expect(secondQueryPayload.cursor).toBe('cursor-1');
    expect(component.measures()).toEqual([obfuscatedRow1, obfuscatedRow2]);

    obfuscatedStream$.next([obfuscatedRow1]);
    expect(component.measures()).toEqual([obfuscatedRow1, obfuscatedRow2, obfuscatedRow1]);
  });

  it('re-queries history when filters are applied', async () => {
    const clearStream$ = new Subject<CheckedEnvelope>();
    validatedMeasureFacadeServiceMock.query.mockReturnValue(of({ data: [], hasMore: false }));
    validatedMeasureFacadeServiceMock.openStream.mockReturnValue(clearStream$.asObservable());

    const fixture = TestBed.createComponent(DataDashboardPageComponent);
    const component = fixture.componentInstance;

    fixture.detectChanges();
    await flushAsyncWork(fixture);

    component.onFiltersApplied({
      gatewayIds: ['gw-9'],
      sensorIds: ['s-9'],
      sensorTypes: ['temperature'],
      historyWindowHours: 168,
    });
    await flushAsyncWork(fixture);

    expect(validatedMeasureFacadeServiceMock.query).toHaveBeenCalledTimes(2);

    const latestQueryPayload = validatedMeasureFacadeServiceMock.query.mock.calls[1][0] as {
      from: string;
      to: string;
      gatewayIds?: string[];
      sensorIds?: string[];
      sensorTypes?: string[];
    };

    expect(hoursDiff(latestQueryPayload.from, latestQueryPayload.to)).toBeGreaterThan(167.5);
    expect(hoursDiff(latestQueryPayload.from, latestQueryPayload.to)).toBeLessThan(168.5);
    expect(latestQueryPayload.gatewayIds).toEqual(['gw-9']);
    expect(latestQueryPayload.sensorIds).toEqual(['s-9']);
    expect(latestQueryPayload.sensorTypes).toEqual(['temperature']);
    expect(validatedMeasureFacadeServiceMock.closeStream.mock.calls.length).toBeGreaterThanOrEqual(
      2,
    );
  });
});
