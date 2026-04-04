import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CheckedEnvelope, ObfuscatedEnvelope } from '../../../../core/models/measure';
import { GatewayService } from '../../../gateways/services/gateway.service';
import { SensorService } from '../../../sensors/services/sensor.service';
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
    export: vi.fn(),
    closeStream: vi.fn(),
  };

  const gatewayServiceMock = {
    getGateways: vi.fn(),
  };

  const sensorServiceMock = {
    getAllSensors: vi.fn(),
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

  const obfuscatedRow: ObfuscatedEnvelope = {
    gatewayId: 'gw-1',
    sensorId: 's-1',
    sensorType: 'temperature',
    timestamp: '2026-04-03T08:00:00.000Z',
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

  beforeEach(async () => {
    obfuscatedMeasureServiceMock.openStream.mockReset();
    obfuscatedMeasureServiceMock.query.mockReset();
    obfuscatedMeasureServiceMock.closeStream.mockReset();

    validatedMeasureFacadeServiceMock.openStream.mockReset();
    validatedMeasureFacadeServiceMock.query.mockReset();
    validatedMeasureFacadeServiceMock.export.mockReset();
    validatedMeasureFacadeServiceMock.closeStream.mockReset();

    gatewayServiceMock.getGateways.mockReset();
    sensorServiceMock.getAllSensors.mockReset();

    routeMock.snapshot.data = { dataMode: 'clear' };

    gatewayServiceMock.getGateways.mockReturnValue(
      of([{ gatewayId: 'gw-1' }, { gatewayId: 'gw-2' }]),
    );
    sensorServiceMock.getAllSensors.mockReturnValue(
      of([
        { sensorId: 's-1', sensorType: 'temperature' },
        { sensorId: 's-2', sensorType: 'humidity' },
      ]),
    );

    await TestBed.configureTestingModule({
      imports: [DataDashboardPageComponent],
      providers: [
        { provide: ActivatedRoute, useValue: routeMock },
        { provide: ObfuscatedMeasureService, useValue: obfuscatedMeasureServiceMock },
        { provide: ValidatedMeasureFacadeService, useValue: validatedMeasureFacadeServiceMock },
        { provide: GatewayService, useValue: gatewayServiceMock },
        { provide: SensorService, useValue: sensorServiceMock },
      ],
    }).compileComponents();
  });

  it('starts clear stream and keeps only last 20 rows', async () => {
    const clearStream$ = new Subject<CheckedEnvelope>();
    validatedMeasureFacadeServiceMock.openStream.mockReturnValue(clearStream$.asObservable());

    const fixture: ComponentFixture<DataDashboardPageComponent> = TestBed.createComponent(
      DataDashboardPageComponent,
    );
    const component: DataDashboardPageComponent = fixture.componentInstance;

    fixture.detectChanges();
    await flushAsyncWork(fixture);

    expect(validatedMeasureFacadeServiceMock.openStream).toHaveBeenCalledOnce();
    expect(component.streamMeasures()).toEqual([]);

    for (let index = 0; index < 25; index += 1) {
      clearStream$.next({
        ...checkedRow,
        sensorId: `s-${index}`,
        timestamp: `2026-04-03T10:${String(index).padStart(2, '0')}:00.000Z`,
      });
    }

    expect(component.streamMeasures()).toHaveLength(20);
    expect(component.streamMeasures()[0]).toMatchObject({ sensorId: 's-5' });
    expect(component.streamMeasures()[19]).toMatchObject({ sensorId: 's-24' });
  });

  it('loads query mode with page size 20 and cursor navigation', async () => {
    validatedMeasureFacadeServiceMock.openStream.mockReturnValue(
      new Subject<CheckedEnvelope>().asObservable(),
    );
    validatedMeasureFacadeServiceMock.query
      .mockReturnValueOnce(of({ data: [checkedRow], hasMore: true, nextCursor: 'cursor-1' }))
      .mockReturnValueOnce(
        of({
          data: [{ ...checkedRow, sensorId: 's-2', timestamp: '2026-04-03T10:05:00.000Z' }],
          hasMore: false,
        }),
      );

    const fixture: ComponentFixture<DataDashboardPageComponent> = TestBed.createComponent(
      DataDashboardPageComponent,
    );
    const component: DataDashboardPageComponent = fixture.componentInstance;

    fixture.detectChanges();
    await flushAsyncWork(fixture);

    component.setActiveView('query');
    await flushAsyncWork(fixture);
    fixture.detectChanges();

    expect(validatedMeasureFacadeServiceMock.query).toHaveBeenCalledOnce();

    const host = fixture.nativeElement as HTMLElement;
    const paginationButtons = Array.from(
      host.querySelectorAll<HTMLButtonElement>('.query-pagination button'),
    );

    expect(paginationButtons).toHaveLength(1);
    expect(paginationButtons[0]?.textContent?.trim()).toBe('Successiva');

    const firstQueryPayload = validatedMeasureFacadeServiceMock.query.mock.calls[0][0] as {
      from: string;
      to: string;
      limit: number;
      cursor?: string;
    };

    expect(firstQueryPayload.limit).toBe(20);
    expect(firstQueryPayload.cursor).toBeUndefined();
    expect(new Date(firstQueryPayload.to).getTime()).toBeGreaterThan(
      new Date(firstQueryPayload.from).getTime(),
    );

    component.onNextQueryPage();
    await flushAsyncWork(fixture);

    expect(validatedMeasureFacadeServiceMock.query).toHaveBeenCalledTimes(2);

    const secondQueryPayload = validatedMeasureFacadeServiceMock.query.mock.calls[1][0] as {
      cursor?: string;
    };

    expect(secondQueryPayload.cursor).toBe('cursor-1');
    expect(component.queryPage()).toBe(2);
  });

  it('uses obfuscated endpoints in impersonation and disables export', async () => {
    routeMock.snapshot.data = { dataMode: 'obfuscated' };

    const obfuscatedStream$ = new Subject<ObfuscatedEnvelope[]>();
    obfuscatedMeasureServiceMock.openStream.mockReturnValue(obfuscatedStream$.asObservable());
    obfuscatedMeasureServiceMock.query.mockReturnValue(
      of({ data: [obfuscatedRow], hasMore: false }),
    );

    const fixture: ComponentFixture<DataDashboardPageComponent> = TestBed.createComponent(
      DataDashboardPageComponent,
    );
    const component: DataDashboardPageComponent = fixture.componentInstance;

    fixture.detectChanges();
    await flushAsyncWork(fixture);

    expect(obfuscatedMeasureServiceMock.openStream).toHaveBeenCalledOnce();
    expect(validatedMeasureFacadeServiceMock.openStream).not.toHaveBeenCalled();

    component.setActiveView('query');
    await flushAsyncWork(fixture);

    expect(obfuscatedMeasureServiceMock.query).toHaveBeenCalledOnce();
    expect(validatedMeasureFacadeServiceMock.query).not.toHaveBeenCalled();
    expect(component.canExportQuery()).toBe(false);

    await component.onExportQuery();
    expect(validatedMeasureFacadeServiceMock.export).not.toHaveBeenCalled();
  });
});
