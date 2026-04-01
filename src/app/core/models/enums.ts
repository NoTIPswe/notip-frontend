export enum UserRole {
  system_admin = 'system_admin',
  tenant_admin = 'tenant_admin',
  tenant_user = 'tenant_user',
}

export enum TenantStatus {
  active = 'active',
  suspended = 'suspended',
}

export enum CommandStatus {
  queued = 'queued',
  ack = 'ack',
  nack = 'nack',
  expired = 'expired',
  timeout = 'timeout',
}

export enum AlertsType {
  GATEWAY_OFFLINE = 'GATEWAY_OFFLINE',
}

export enum GatewayStatus {
  online = 'online',
  paused = 'paused',
  provisioning = 'provisioning',
  offline = 'offline',
}

export enum CmdGatewayStatus {
  online = 'online',
  paused = 'paused',
}
