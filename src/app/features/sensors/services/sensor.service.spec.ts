import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, take, toArray } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SensorService as DataApiSensorService } from '../../../generated/openapi/notip-data-api-openapi/api/sensor.service';
import { SensorService } from './sensor.service';

describe('SensorService', () => {
  let service: SensorService;

  const apiMock = {
    sensorControllerGetSensors: vi.fn(),
  };

  beforeEach(async () => {
    vi.useFakeTimers();

    apiMock.sensorControllerGetSensors.mockReset();

    await TestBed.configureTestingModule({
      providers: [SensorService, { provide: DataApiSensorService, useValue: apiMock }],
    }).compileComponents();

    service = TestBed.inject(SensorService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fetches all sensors once when refresh interval is disabled', async () => {
    apiMock.sensorControllerGetSensors.mockReturnValue(
      of([
        {
          sensorId: 's-1',
          gatewayId: 'gw-1',
          sensorType: 'temperature',
          lastSeen: '2026-03-31T12:00:00.000Z',
        },
      ]),
    );

    await expect(firstValueFrom(service.getAllSensors(0))).resolves.toEqual([
      {
        sensorId: 's-1',
        gatewayId: 'gw-1',
        sensorType: 'temperature',
        lastSeen: '2026-03-31T12:00:00.000Z',
      },
    ]);
    expect(apiMock.sensorControllerGetSensors).toHaveBeenCalledWith(undefined);
  });

  it('refreshes sensors on interval when refresh is enabled', async () => {
    apiMock.sensorControllerGetSensors
      .mockReturnValueOnce(
        of([
          {
            sensorId: 's-1',
            gatewayId: 'gw-1',
            sensorType: 'temperature',
            lastSeen: 't1',
          },
        ]),
      )
      .mockReturnValueOnce(
        of([
          {
            sensorId: 's-2',
            gatewayId: 'gw-1',
            sensorType: 'humidity',
            lastSeen: 't2',
          },
        ]),
      );

    const rowsPromise = firstValueFrom(service.getAllSensors(1000).pipe(take(2), toArray()));

    vi.advanceTimersByTime(1100);

    await expect(rowsPromise).resolves.toEqual([
      [
        {
          sensorId: 's-1',
          gatewayId: 'gw-1',
          sensorType: 'temperature',
          lastSeen: 't1',
        },
      ],
      [
        {
          sensorId: 's-2',
          gatewayId: 'gw-1',
          sensorType: 'humidity',
          lastSeen: 't2',
        },
      ],
    ]);
  });

  it('fetches sensors filtered by gateway id', async () => {
    apiMock.sensorControllerGetSensors.mockReturnValue(
      of([{ sensorId: 's-9', gatewayId: 'gw-9', sensorType: 'pressure', lastSeen: 't3' }]),
    );

    await expect(firstValueFrom(service.getGatewaySensors('gw-9', 0))).resolves.toEqual([
      { sensorId: 's-9', gatewayId: 'gw-9', sensorType: 'pressure', lastSeen: 't3' },
    ]);
    expect(apiMock.sensorControllerGetSensors).toHaveBeenCalledWith('gw-9');
  });
});
