import { AlertsType } from './enums';

export { AlertsType } from './enums';

export interface AlertDetails {
  lastSeen?: string;
  timeoutConfigured?: number;
  [key: string]: unknown;
}

export interface Alerts {
  id: string;
  type: AlertsType;
  gatewayId: string;
  details: AlertDetails;
  createdAt: string;
}

export interface AlertsFilter {
  from: string;
  to: string;
  gatewayId?: string[];
}

export interface DefaultAlertsConfig {
  tenantId: string;
  timeoutMs: number;
  updatedAt: string;
}

export interface GatewayAlertsConfig {
  gatewayId: string;
  timeoutMs: number;
  updatedAt: string;
}

export interface AlertsConfig {
  default: DefaultAlertsConfig;
  gatewayOverrides?: GatewayOverride[];
}

export interface GatewayOverride {
  gatewayId: string;
  timeoutMs: number;
  updatedAt?: string;
}
