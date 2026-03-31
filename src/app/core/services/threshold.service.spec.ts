import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThresholdsService } from '../../generated/openapi/notip-management-api-openapi';
import { ThresholdService } from './threshold.service';

describe('ThresholdService', () => {
  let service: ThresholdService;

  const thresholdsApiMock = {
    thresholdsControllerGetThresholds: vi.fn(),
    thresholdsControllerSetDefaultThreshold: vi.fn(),
    thresholdsControllerSetSensorThreshold: vi.fn(),
    thresholdsControllerDeleteSensorThreshold: vi.fn(),
    thresholdsControllerDeleteThresholdType: vi.fn(),
  };

  beforeEach(async () => {
    thresholdsApiMock.thresholdsControllerGetThresholds.mockReset();
    thresholdsApiMock.thresholdsControllerSetDefaultThreshold.mockReset();
    thresholdsApiMock.thresholdsControllerSetSensorThreshold.mockReset();
    thresholdsApiMock.thresholdsControllerDeleteSensorThreshold.mockReset();
    thresholdsApiMock.thresholdsControllerDeleteThresholdType.mockReset();

    await TestBed.configureTestingModule({
      providers: [ThresholdService, { provide: ThresholdsService, useValue: thresholdsApiMock }],
    }).compileComponents();

    service = TestBed.inject(ThresholdService);
  });

  it('fetches, maps and caches thresholds', async () => {
    thresholdsApiMock.thresholdsControllerGetThresholds.mockReturnValue(
      of([
        { type: 'sensorId', sensor_id: 's-1', min_value: 10, max_value: 20 },
        { type: 'sensorType', sensor_type: 'temperature', min_value: 1, max_value: 9 },
      ]),
    );

    await expect(firstValueFrom(service.fetchThresholds())).resolves.toEqual([
      { type: 'sensorId', sensorId: 's-1', minValue: 10, maxValue: 20 },
      { type: 'sensorType', sensorType: 'temperature', minValue: 1, maxValue: 9 },
    ]);
    expect(service.getCached()).toHaveLength(2);
  });

  it('refreshes cache by invalidating and fetching thresholds again', async () => {
    thresholdsApiMock.thresholdsControllerGetThresholds
      .mockReturnValueOnce(of([{ type: 'sensorId', sensor_id: 's-1', min_value: 2, max_value: 4 }]))
      .mockReturnValueOnce(of([{ type: 'sensorType', sensor_type: 'humidity', min_value: 3 }]));

    await firstValueFrom(service.fetchThresholds());
    expect(service.getCached()).toHaveLength(1);

    await firstValueFrom(service.refreshThresholds());
    expect(service.getCached()).toEqual([
      { type: 'sensorType', sensorType: 'humidity', minValue: 3, maxValue: null },
    ]);
  });

  it('sends default threshold with zero fallbacks', async () => {
    thresholdsApiMock.thresholdsControllerSetDefaultThreshold.mockReturnValue(of({}));

    await expect(
      firstValueFrom(service.setDefaultThreshold('temperature')),
    ).resolves.toBeUndefined();
    expect(thresholdsApiMock.thresholdsControllerSetDefaultThreshold).toHaveBeenCalledWith({
      sensor_type: 'temperature',
      min_value: 0,
      max_value: 0,
    });
  });

  it('sends sensor threshold with explicit and default values', async () => {
    thresholdsApiMock.thresholdsControllerSetSensorThreshold.mockReturnValue(of({}));

    await firstValueFrom(service.setSensorThreshold('sensor-9', 12));

    expect(thresholdsApiMock.thresholdsControllerSetSensorThreshold).toHaveBeenCalledWith(
      'sensor-9',
      {
        min_value: 12,
        max_value: 0,
        sensor_type: '',
      },
    );
  });

  it('deletes sensor and type thresholds', async () => {
    thresholdsApiMock.thresholdsControllerDeleteSensorThreshold.mockReturnValue(of({}));
    thresholdsApiMock.thresholdsControllerDeleteThresholdType.mockReturnValue(of({}));

    await expect(
      firstValueFrom(service.deleteSensorThreshold('sensor-1')),
    ).resolves.toBeUndefined();
    await expect(
      firstValueFrom(service.deleteTypeThreshold('temperature')),
    ).resolves.toBeUndefined();

    expect(thresholdsApiMock.thresholdsControllerDeleteSensorThreshold).toHaveBeenCalledWith(
      'sensor-1',
    );
    expect(thresholdsApiMock.thresholdsControllerDeleteThresholdType).toHaveBeenCalledWith(
      'temperature',
    );
  });
});
