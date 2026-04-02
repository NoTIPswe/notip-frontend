// Shared fixture data for MSW handlers.
// All IDs and values are stable so components that navigate by ID work end-to-end.

export const TENANT_ALPHA = {
  id: 'tenant-alpha',
  name: 'Alpha Corp',
  status: 'active' as const,
  created_at: '2025-01-10T08:00:00.000Z',
};

export const TENANT_BETA = {
  id: 'tenant-beta',
  name: 'Beta Industries',
  status: 'active' as const,
  created_at: '2025-02-15T09:00:00.000Z',
};

export const TENANTS = [TENANT_ALPHA, TENANT_BETA];

// ---- Gateways ----------------------------------------------------------

export const GATEWAYS = [
  {
    id: 'gw-001',
    name: 'Main Entrance',
    status: 'gateway_online' as const,
    last_seen_at: new Date().toISOString(),
    provisioned: true,
    firmware_version: '2.4.1',
    send_frequency_ms: 30_000,
  },
  {
    id: 'gw-002',
    name: 'Server Room',
    status: 'gateway_online' as const,
    last_seen_at: new Date().toISOString(),
    provisioned: true,
    firmware_version: '2.4.1',
    send_frequency_ms: 15_000,
  },
  {
    id: 'gw-003',
    name: 'Warehouse North',
    status: 'gateway_offline' as const,
    last_seen_at: '2026-03-28T14:22:00.000Z',
    provisioned: true,
    firmware_version: '2.3.0',
    send_frequency_ms: 60_000,
  },
];

// ---- Sensors -----------------------------------------------------------

export const SENSORS = [
  {
    sensorId: 's-temp-01',
    sensorType: 'temperature',
    gatewayId: 'gw-001',
    lastSeen: new Date().toISOString(),
  },
  {
    sensorId: 's-hum-01',
    sensorType: 'humidity',
    gatewayId: 'gw-001',
    lastSeen: new Date().toISOString(),
  },
  {
    sensorId: 's-temp-02',
    sensorType: 'temperature',
    gatewayId: 'gw-002',
    lastSeen: new Date().toISOString(),
  },
  {
    sensorId: 's-co2-01',
    sensorType: 'co2',
    gatewayId: 'gw-002',
    lastSeen: new Date().toISOString(),
  },
];

// ---- Users -------------------------------------------------------------

export const USERS = [
  {
    id: 'user-001',
    name: 'Alice Admin',
    email: 'alice@alpha.com',
    role: 'tenant_admin' as const,
    last_access: new Date().toISOString(),
  },
  {
    id: 'user-002',
    name: 'Bob Viewer',
    email: 'bob@alpha.com',
    role: 'tenant_user' as const,
    last_access: '2026-03-30T10:00:00.000Z',
  },
  {
    id: 'user-003',
    name: 'Carol Ops',
    email: 'carol@alpha.com',
    role: 'tenant_user' as const,
    last_access: null,
  },
];

// ---- API Clients -------------------------------------------------------

export const API_CLIENTS = [
  { id: 'client-001', name: 'Integration Bot', created_at: '2026-01-01T00:00:00.000Z' },
];

// ---- Alerts ------------------------------------------------------------

export const ALERTS = [
  {
    id: 'alert-001',
    type: 'GATEWAY_OFFLINE',
    gateway_id: 'gw-003',
    triggered_at: '2026-03-28T14:25:00.000Z',
    resolved_at: null,
  },
];

export const ALERTS_CONFIG = {
  tenant_unreachable_timeout_ms: 300_000,
  gateways: {},
};

// ---- Thresholds --------------------------------------------------------

export const THRESHOLDS = [
  { sensor_type: 'temperature', min_value: -10, max_value: 50 },
  { sensor_type: 'humidity', min_value: 10, max_value: 90 },
];

// ---- Audit logs --------------------------------------------------------

export const AUDIT_LOGS = [
  {
    id: 'audit-001',
    userId: 'user-001',
    action: 'CREATE_USER',
    timestamp: '2026-03-29T09:00:00.000Z',
    details: {},
  },
  {
    id: 'audit-002',
    userId: 'user-001',
    action: 'UPDATE_GATEWAY',
    timestamp: '2026-03-30T11:00:00.000Z',
    details: {},
  },
];

// ---- Costs -------------------------------------------------------------

export const COSTS = { storage_gb: 12.4, bandwidth_gb: 3.7 };

// ---- Measures ----------------------------------------------------------

/** Build a single fake TelemetryEnvelope for the SSE stream and query responses. */
export function makeTelemetryEnvelope(gatewayId: string, sensorId: string, sensorType: string) {
  return {
    gatewayId,
    sensorId,
    sensorType,
    timestamp: new Date().toISOString(),
    encryptedData: 'bW9jay1lbmNyeXB0ZWQ=',
    iv: 'bW9jay1pdg==',
    authTag: 'bW9jay10YWc=',
    keyVersion: 1,
    unit: sensorType === 'temperature' ? '°C' : sensorType === 'humidity' ? '%' : 'ppm',
  };
}
