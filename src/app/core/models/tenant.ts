export interface Tenant {
  tenantId: string;
  name: string;
  status: string;
  createdAt: string;
}

export interface CreateTenantParameters {
  name: string;
  adminEmail: string;
  adminName: string;
  adminPassword: string;
}

export interface UpdateTenantParameters {
  name?: string;
  status?: string;
  suspensionIntervalDays?: number;
}
