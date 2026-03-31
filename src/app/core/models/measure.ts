export interface GatewayKeyMap {
  [gatewayId: string]: string;
}

export interface TelemetryEnvelope {
  gatewayId: string;
  sensorId: string;
  sensorType: string;
  timestamp: string;
  keyVersion: number;
  encryptedData: string;
  iv: string;
  authTag: string;
  unit: string;
}

export interface DecryptedTelemetry {
  gatewayId: string;
  sensorId: string;
  sensorType: string;
  timestamp: string;
  value: number;
  unit: string;
}

export interface DecryptedBatchProgress {
  total: number;
  completed: number;
  failed: number;
  lastDecrypted?: DecryptedTelemetry;
}

export interface WorkerError {
  code:
    | 'KEY_NOT_FOUND'
    | 'DECRYPT_FAILED'
    | 'KEY_VERSION_MISMATCH'
    | 'TIMEOUT'
    | 'WORKER_NOT_READY';
  gatewayId?: string;
  detail?: string;
}

export interface KeyVersionMismatchEvent {
  cachedVersion: number;
  payloadVersion: number;
  gatewayId: string;
}

export interface BaseEnvelope {
  type: 'decrypted' | 'obfuscated';
  gatewayId: string;
  sensorId: string;
  sensorType: string;
  timestamp: string;
}

export interface DecryptedEnvelope extends BaseEnvelope {
  type: 'decrypted';
  value: number;
  unit: string;
  isOutOfBounds: boolean;
}

export interface ObfuscatedEnvelope extends BaseEnvelope {
  type: 'obfuscated';
}

export type ProcessedEnvelope = DecryptedEnvelope | ObfuscatedEnvelope;

export interface StreamParameters {
  gatewayIds?: string[];
  sensorTypes?: string[];
  sensorIds?: string[];
}

export interface ExportParameters extends StreamParameters {
  from: string;
  to: string;
}

export interface QueryParameters extends ExportParameters {
  cursor?: string;
  limit: number;
}

export interface MeasurePage {
  data: ProcessedEnvelope[];
  nextCursor?: string;
  hasMore: boolean;
}
