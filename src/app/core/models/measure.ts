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

export interface DecryptedEnvelope {
  gatewayId: string;
  sensorId: string;
  sensorType: string;
  timestamp: string;
  value: number;
  unit: string;
}

export interface CheckedEnvelope extends DecryptedEnvelope {
  isOutofBounds: boolean;
}

export interface ObfuscatedEnvelope {
  gatewayId: string;
  sensorId: string;
  sensorType: string;
  timestamp: string;
}

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

export interface ObfuscatedQueryResPage {
  data: ObfuscatedEnvelope[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface QueryResPage {
  data: DecryptedEnvelope[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface CheckedQueryResPage {
  data: CheckedEnvelope[];
  nextCursor?: string;
  hasMore: boolean;
}
