export interface Gateway {
  id: string;
  name: string;
  status: string;
  lastSeenAt: string;
  provisioned: boolean;
  firmwareVersion: string;
  sendFrequencyMs: number;
}

export interface GatewayUpdateResult {
  id: string;
  name: string;
  status: string;
  updatedAt: string;
}

export interface GatewayConfig {
  send_frequency_ms?: number;
  status?: 'online' | 'offline';
}

export interface GatewayFirmware {
  firmware_version: string;
  download_url: string;
}

export interface ObfuscatedGateway {
  id: string;
  tenantId: string;
  model?: string;
  firmware?: string;
  provisioned?: boolean;
  factoryId?: string;
  createdAt?: string;
}

export interface AddGatewayParameters {
  factoryId: string;
  tenantId: string;
  factoryKeyHash: string;
}
