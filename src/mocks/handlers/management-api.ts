import { http, HttpResponse } from 'msw';
import {
  GATEWAYS,
  TENANTS,
  USERS,
  API_CLIENTS,
  ALERTS,
  ALERTS_CONFIG,
  THRESHOLDS,
  AUDIT_LOGS,
  COSTS,
} from '../fixtures';

const BASE = '/api/mgmt';

// In-memory state so mutations (create/delete/update) are reflected within a session.
let gateways = [...GATEWAYS];
let users = [...USERS];
let apiClients = [...API_CLIENTS];
let thresholds = [...THRESHOLDS];

export const managementApiHandlers = [
  // ---- Auth --------------------------------------------------------------
  http.get(`${BASE}/auth/me`, () => {
    return HttpResponse.json({
      sub: 'dev-user-id',
      preferred_username: 'dev.admin',
      role: 'system_admin',
      tenant_id: 'tenant-alpha',
    });
  }),

  http.post(`${BASE}/auth/impersonate`, () => {
    return HttpResponse.json({ access_token: 'mock-impersonation-token', expires_in: 300 });
  }),

  // ---- Gateways (tenant) -------------------------------------------------
  http.get(`${BASE}/gateways`, () => {
    return HttpResponse.json(gateways);
  }),

  http.get(`${BASE}/gateways/:id`, ({ params }) => {
    const gw = gateways.find((g) => g.id === params['id']);
    if (!gw) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(gw);
  }),

  http.patch(`${BASE}/gateways/:id`, async ({ params, request }) => {
    const body = (await request.json()) as { name: string };
    const idx = gateways.findIndex((g) => g.id === params['id']);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    gateways[idx] = { ...gateways[idx], name: body.name };
    return HttpResponse.json({
      id: gateways[idx].id,
      name: gateways[idx].name,
      status: gateways[idx].status,
      updated_at: new Date().toISOString(),
    });
  }),

  http.delete(`${BASE}/gateways/:id`, ({ params }) => {
    gateways = gateways.filter((g) => g.id !== params['id']);
    return new HttpResponse(null, { status: 200 });
  }),

  // ---- Admin Gateways ----------------------------------------------------
  http.get(`${BASE}/admin/gateways`, () => {
    return HttpResponse.json(gateways);
  }),

  http.post(`${BASE}/admin/gateways`, async ({ request }) => {
    const body = (await request.json()) as Record<string, string>;
    const gw = {
      id: `gw-${Date.now()}`,
      name: body['factory_id'] ?? 'New Gateway',
      status: 'gateway_offline' as const,
      last_seen_at: new Date().toISOString(),
      provisioned: false,
      firmware_version: 'unknown',
      send_frequency_ms: 30_000,
    };
    gateways = [...gateways, gw];
    return HttpResponse.json(gw, { status: 201 });
  }),

  // ---- Admin Tenants -----------------------------------------------------
  http.get(`${BASE}/admin/tenants`, () => {
    return HttpResponse.json(TENANTS);
  }),

  http.post(`${BASE}/admin/tenants`, async ({ request }) => {
    const body = (await request.json()) as Record<string, string>;
    const tenant = {
      id: `tenant-${Date.now()}`,
      name: body['name'] ?? 'New Tenant',
      status: 'active' as const,
      created_at: new Date().toISOString(),
    };
    return HttpResponse.json(tenant, { status: 201 });
  }),

  http.patch(`${BASE}/admin/tenants/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const tenant = TENANTS.find((t) => t.id === params['id']);
    if (!tenant) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json({ ...tenant, ...body });
  }),

  http.delete(`${BASE}/admin/tenants/:id`, () => {
    return HttpResponse.json({ message: 'Tenant deleted successfully' });
  }),

  http.get(`${BASE}/admin/tenants/:id/users`, () => {
    return HttpResponse.json(users.map((u) => ({ user_id: u.id, role: u.role })));
  }),

  // ---- Users -------------------------------------------------------------
  http.get(`${BASE}/users`, () => {
    return HttpResponse.json(users);
  }),

  http.post(`${BASE}/users`, async ({ request }) => {
    const body = (await request.json()) as Record<string, string>;
    const user = {
      id: `user-${Date.now()}`,
      name: body['name'],
      email: body['email'],
      role: body['role'] as 'tenant_admin' | 'tenant_user',
      created_at: new Date().toISOString(),
    };
    users = [...users, { ...user, last_access: null } as (typeof users)[0]];
    return HttpResponse.json(user, { status: 201 });
  }),

  http.patch(`${BASE}/users/:id`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    const idx = users.findIndex((u) => u.id === params['id']);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    users[idx] = { ...users[idx], ...(body as (typeof users)[0]) };
    return HttpResponse.json({ ...users[idx], updated_at: new Date().toISOString() });
  }),

  http.post(`${BASE}/users/bulk-delete`, async ({ request }) => {
    const body = (await request.json()) as { ids: string[] };
    const before = users.length;
    users = users.filter((u) => !body.ids.includes(u.id));
    return HttpResponse.json({ deleted: before - users.length, failed: [] });
  }),

  // ---- API Clients -------------------------------------------------------
  http.get(`${BASE}/api-clients`, () => {
    return HttpResponse.json(apiClients);
  }),

  http.post(`${BASE}/api-clients`, () => {
    const client = {
      id: `client-${Date.now()}`,
      name: 'New Client',
      created_at: new Date().toISOString(),
    };
    apiClients = [...apiClients, client];
    return HttpResponse.json(client, { status: 201 });
  }),

  http.delete(`${BASE}/api-clients/:id`, ({ params }) => {
    apiClients = apiClients.filter((c) => c.id !== params['id']);
    return new HttpResponse(null, { status: 200 });
  }),

  // ---- Alerts ------------------------------------------------------------
  http.get(`${BASE}/alerts`, () => {
    return HttpResponse.json(ALERTS);
  }),

  http.get(`${BASE}/alerts/config`, () => {
    return HttpResponse.json(ALERTS_CONFIG);
  }),

  http.put(`${BASE}/alerts/config/default`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...ALERTS_CONFIG, ...body });
  }),

  http.put(`${BASE}/alerts/config/gateway/:gatewayId`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(body);
  }),

  http.delete(`${BASE}/alerts/config/gateway/:gatewayId`, () => {
    return new HttpResponse(null, { status: 200 });
  }),

  // ---- Thresholds --------------------------------------------------------
  http.get(`${BASE}/thresholds`, () => {
    return HttpResponse.json(thresholds);
  }),

  http.put(`${BASE}/thresholds/default`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(body);
  }),

  http.put(`${BASE}/thresholds/sensor/:sensorId`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json(body);
  }),

  http.delete(`${BASE}/thresholds/sensor/:sensorId`, () => {
    return new HttpResponse(null, { status: 200 });
  }),

  http.delete(`${BASE}/thresholds/type/:sensorType`, ({ params }) => {
    thresholds = thresholds.filter((t) => t.sensor_type !== params['sensorType']);
    return new HttpResponse(null, { status: 200 });
  }),

  // ---- Audit -------------------------------------------------------------
  http.get(`${BASE}/audit`, () => {
    return HttpResponse.json(AUDIT_LOGS);
  }),

  // ---- Costs -------------------------------------------------------------
  http.get(`${BASE}/costs`, () => {
    return HttpResponse.json(COSTS);
  }),

  // ---- Keys --------------------------------------------------------------
  http.get(`${BASE}/keys`, () => {
    return HttpResponse.json(
      GATEWAYS.map((gw) => ({
        gateway_id: gw.id,
        key_material: btoa(`mock-key-${gw.id}`),
        key_version: 1,
      })),
    );
  }),

  // ---- Commands ----------------------------------------------------------
  http.post(`${BASE}/cmd/:gatewayId/config`, () => {
    return HttpResponse.json({
      command_id: `cmd-${Date.now()}`,
      status: 'queued',
      issued_at: new Date().toISOString(),
    });
  }),

  http.post(`${BASE}/cmd/:gatewayId/firmware`, () => {
    return HttpResponse.json({
      command_id: `cmd-${Date.now()}`,
      status: 'queued',
      issued_at: new Date().toISOString(),
    });
  }),

  http.get(`${BASE}/cmd/:gatewayId/status/:commandId`, ({ params }) => {
    return HttpResponse.json({
      command_id: params['commandId'],
      status: 'ack',
      timestamp: new Date().toISOString(),
    });
  }),
];
