export type ThresholdConfig = SensorThreshold | TypeThreshold;

export interface Threshold {
  minValue?: number | null;
  maxValue?: number | null;
  type: 'sensorId' | 'sensorType';
}

export interface SensorThreshold extends Threshold {
  sensorId: string;
  type: 'sensorId';
}

export interface TypeThreshold extends Threshold {
  sensorType: string;
  type: 'sensorType';
}
