export enum UserRole {
  system_admin = 'system_admin',
  tenant_admin = 'tenant_admin',
  tenant_user = 'tenant_user',
}

export enum CommandStatus {
  queued = 'queued',
  ack = 'ack',
  nack = 'nack',
  expired = 'expired',
  timeout = 'timeout',
}

export enum StreamStatus {
  connected = 'connected',
  closed = 'closed',
  error = 'error',
}
