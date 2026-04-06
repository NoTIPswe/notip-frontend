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
        { type: 'sensor_id', sensor_id: 's-1', min_value: 10, max_value: 20 },
        { type: 'sensor_type', sensor_type: 'temperature', min_value: 1, max_value: 9 },
      ]),
    );

    await expect(firstValueFrom(service.fetchThresholds())).resolves.toEqual([
      { type: 'sensorId', sensorId: 's-1', minValue: 10, maxValue: 20 },
      { type: 'sensorType', sensorType: 'temperature', minValue: 1, maxValue: 9 },
    ]);
    expect(service.getCached()).toHaveLength(2);
  });

  it('infers threshold type when backend omits type field', async () => {
    thresholdsApiMock.thresholdsControllerGetThresholds.mockReturnValue(
      of([
        { sensor_id: 's-2', min_value: '7.5', max_value: '11.9' },
        { sensorType: 'humidity', minValue: 2, maxValue: 5 },
      ]),
    );

    await expect(firstValueFrom(service.fetchThresholds())).resolves.toEqual([
      { type: 'sensorId', sensorId: 's-2', minValue: 7.5, maxValue: 11.9 },
      { type: 'sensorType', sensorType: 'humidity', minValue: 2, maxValue: 5 },
    ]);
  });

  it('falls back to sensor id when backend marks type as sensor_type but value is null', async () => {
    thresholdsApiMock.thresholdsControllerGetThresholds.mockReturnValue(
      of([{ type: 'sensor_type', sensor_id: 's-3', sensor_type: null, min_value: 6 }]),
    );

    await expect(firstValueFrom(service.fetchThresholds())).resolves.toEqual([
      { type: 'sensorId', sensorId: 's-3', minValue: 6, maxValue: null },
    ]);
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

  it('allows default threshold with null bounds when no values are provided', async () => {
    thresholdsApiMock.thresholdsControllerSetDefaultThreshold.mockReturnValue(of({}));

    await expect(
      firstValueFrom(service.setDefaultThreshold('temperature')),
    ).resolves.toBeUndefined();
    expect(thresholdsApiMock.thresholdsControllerSetDefaultThreshold).toHaveBeenCalledWith({
      sensor_type: 'temperature',
      min_value: null,
      max_value: null,
    });
  });

  it('uses cached bounds when only one sensor bound is provided', async () => {
    thresholdsApiMock.thresholdsControllerSetSensorThreshold.mockReturnValue(of({}));
    thresholdsApiMock.thresholdsControllerGetThresholds.mockReturnValue(
      of([{ type: 'sensorId', sensor_id: 'sensor-9', min_value: 4, max_value: 22 }]),
    );

    await firstValueFrom(service.fetchThresholds());

    await firstValueFrom(service.setSensorThreshold('sensor-9', 12));

    expect(thresholdsApiMock.thresholdsControllerSetSensorThreshold).toHaveBeenCalledWith(
      'sensor-9',
      {
        min_value: 12,
        max_value: 22,
        sensor_type: null,
      },
    );
  });

  it('allows sensor threshold with one explicit bound and null fallback', async () => {
    thresholdsApiMock.thresholdsControllerSetSensorThreshold.mockReturnValue(of({}));

    await firstValueFrom(service.setSensorThreshold('sensor-9', 12));

    expect(thresholdsApiMock.thresholdsControllerSetSensorThreshold).toHaveBeenCalledWith(
      'sensor-9',
      {
        min_value: 12,
        max_value: null,
        sensor_type: null,
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
