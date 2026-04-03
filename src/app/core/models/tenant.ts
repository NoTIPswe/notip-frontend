import { TenantStatus } from './enums';

export interface Tenant {
  tenantId: string;
  name: string;
  status: TenantStatus;
  suspensionIntervalDays?: number;
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
  status?: TenantStatus;
  suspensionIntervalDays?: number;
}
