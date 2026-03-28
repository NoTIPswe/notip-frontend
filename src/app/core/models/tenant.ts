export interface BaseTenant {
  tenantId: string;
  name: string;
  status: string;
}

export interface ViewTenant extends BaseTenant {
  createdAt: string;
}

export interface UpdatedTenant extends BaseTenant {
  updatedAt: string;
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
