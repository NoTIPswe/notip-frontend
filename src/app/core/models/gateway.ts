export interface Gateway {
  gatewayId: string;
  name: string;
  status: string;
  lastSeenAt?: string;
  provisioned: boolean;
  firmwareVersion?: string;
  sendFrequencyMs: number;
}

export interface GatewayUpdateResult {
  gatewayId: string;
  name: string;
  status: string;
  updatedAt: string;
}

export interface ObfuscatedGateway {
  gatewayId: string;
  tenantId: string;
  model: string;
  firmware?: string;
  provisioned?: boolean;
  factoryId: string;
  createdAt?: string;
}

export interface AddGatewayParameters {
  factoryId: string;
  tenantId: string;
  factoryKeyHash: string;
  model: string;
}
