export interface Alerts {
  id: string;
  gatewayId: string;
  createdAt: string;
  message?: string;
}

export interface AlertsFilter {
  from: string;
  to: string;
  gatewayId?: string[];
}

export interface DefaultAlertsConfig {
  timeoutMs: number;
}

export interface GatewayAlertsConfig {
  gatewayId: string;
  timeoutMs: number;
}

export interface AlertsConfig {
  default: DefaultAlertsConfig;
  perGateway?: GatewayAlertsConfig[];
}
