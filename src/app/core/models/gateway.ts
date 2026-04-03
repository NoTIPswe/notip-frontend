import { GatewayStatus } from './enums';

export interface Gateway {
  gatewayId: string;
  name: string;
  status: GatewayStatus;
  lastSeenAt?: string;
  provisioned: boolean;
  firmwareVersion?: string;
  sendFrequencyMs: number;
}

export interface GatewayUpdateResult {
  gatewayId: string;
  name: string;
  status: GatewayStatus;
  updatedAt: string;
}

export interface ObfuscatedGateway {
  gatewayId: string;
  tenantId: string;
  model: string;
  firmware?: string;
  provisioned: boolean;
  factoryId: string;
  createdAt: string;
}

export interface AddGatewayParameters {
  factoryId: string;
  tenantId: string;
  factoryKey: string;
  model: string;
}
