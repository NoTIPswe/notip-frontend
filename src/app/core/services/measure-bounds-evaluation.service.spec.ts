import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DecryptedEnvelope } from '../models/measure';
import { ThresholdService } from './threshold.service';
import { MeasureBoundsEvaluationService } from './measure-bounds-evaluation.service';

describe('MeasureBoundsEvaluationService', () => {
  let service: MeasureBoundsEvaluationService;

  const thresholdMock = {
    getCached: vi.fn(),
  };

  const baseEnvelope: DecryptedEnvelope = {
    gatewayId: 'gw-1',
    sensorId: 'sensor-1',
    sensorType: 'temperature',
    timestamp: '2026-03-31T10:00:00.000Z',
    value: 10,
    unit: 'C',
  };

  beforeEach(async () => {
    thresholdMock.getCached.mockReset();

    await TestBed.configureTestingModule({
      providers: [
        MeasureBoundsEvaluationService,
        { provide: ThresholdService, useValue: thresholdMock },
      ],
    }).compileComponents();

    service = TestBed.inject(MeasureBoundsEvaluationService);
  });

  it('returns false when no threshold matches sensor id or type', () => {
    thresholdMock.getCached.mockReturnValue([]);

    expect(service.evaluate(baseEnvelope)).toBe(false);
  });

  it('returns true when value is below matching min threshold', () => {
    thresholdMock.getCached.mockReturnValue([
      { type: 'sensorId', sensorId: 'sensor-1', minValue: 12, maxValue: null },
    ]);

    expect(service.evaluate(baseEnvelope)).toBe(true);
  });

  it('returns true when value is above matching max threshold', () => {
    thresholdMock.getCached.mockReturnValue([
      {
        type: 'sensorType',
        sensorType: 'temperature',
        minValue: null,
        maxValue: 8,
      },
    ]);

    expect(service.evaluate(baseEnvelope)).toBe(true);
  });

  it('returns false when matched threshold has no bounds', () => {
    thresholdMock.getCached.mockReturnValue([
      {
        type: 'sensorType',
        sensorType: 'temperature',
        minValue: null,
        maxValue: null,
      },
    ]);

    expect(service.evaluate(baseEnvelope)).toBe(false);
  });

  it('prioritizes sensorId threshold over sensorType threshold', () => {
    thresholdMock.getCached.mockReturnValue([
      {
        type: 'sensorType',
        sensorType: 'temperature',
        minValue: 20,
        maxValue: 30,
      },
      {
        type: 'sensorId',
        sensorId: 'sensor-1',
        minValue: 5,
        maxValue: 15,
      },
    ]);

    expect(service.evaluate(baseEnvelope)).toBe(false);
  });
});
