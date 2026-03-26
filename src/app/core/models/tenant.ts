export interface ViewTenant {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}

export interface CreateTenantParameters {
  name: string;
}

export interface UpdateTenantParameters {
  name?: string;
  status?: string;
}

export interface UpdatedTenant {
  id: string;
  name: string;
  status: string;
  createdAt: string;
}
