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
}

export interface DecryptedTelemetry {
  gatewayId: string;
  sensorId: string;
  sensorType: string;
  timestamp: string;
  value: number;
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
  unit: string;
}

export interface DecryptedEnvelope extends BaseEnvelope {
  type: 'decrypted';
  value: number;
  isOutOfBounds: boolean;
}

export interface ObfuscatedEnvelope extends BaseEnvelope {
  type: 'obfuscated';
}

export type ProcessedEnvelope = DecryptedEnvelope | ObfuscatedEnvelope;

export interface StreamFilters {
  gatewayIds?: string[];
  sensorTypes?: string[];
  since?: string;
}

export interface QueryParameters {
  from: string;
  to: string;
  cursor?: string;
  limit?: number;
  gatewayIds?: string[];
  sensorTypes?: string[];
  sensorIds?: string[];
}

export interface ExportParameters {
  from: string;
  to: string;
  gatewayIds?: string[];
  sensorTypes?: string[];
  sensorIds?: string[];
  limit?: number;
}

export interface StreamParameters {
  gatewayIds: string[];
  sensorTypes?: string[];
  since?: string;
}

export interface MeasurePage {
  data: TelemetryEnvelope[];
  nextCursor?: string;
  hasMore: boolean;
}
