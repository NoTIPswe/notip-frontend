import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  AdminTenantsService as AdminTenantsApiService,
  CreateTenantRequestDto,
  UpdateTenantRequestDto,
  UpdateTenantRequestDtoStatusEnum,
} from '../../../generated/openapi/notip-management-api-openapi';
import {
  CreateTenantParameters,
  Tenant,
  UpdateTenantParameters,
} from '../../../core/models/tenant';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly tenantsApi = inject(AdminTenantsApiService);

  getTenants(): Observable<Tenant[]> {
    return this.tenantsApi.tenantsControllerGetTenants().pipe(
      map((rows) =>
        rows.map((row) => ({
          tenantId: row.id,
          name: row.name,
          status: row.status,
          createdAt: row.created_at,
        })),
      ),
    );
  }

  createTenant(c: CreateTenantParameters): Observable<Tenant> {
    const body: CreateTenantRequestDto = {
      name: c.name,
      admin_email: c.adminEmail,
      admin_name: c.adminName,
      admin_password: c.adminPassword,
    };

    return this.tenantsApi.tenantsControllerCreateTenant(body).pipe(
      map((res) => ({
        tenantId: res.id,
        name: res.name,
        status: res.status,
        createdAt: res.created_at,
      })),
    );
  }

  updateTenant(tenantId: string, u: UpdateTenantParameters): Observable<Tenant> {
    const body: UpdateTenantRequestDto = {
      name: u.name ?? '',
      status: (u.status ?? 'active') as UpdateTenantRequestDtoStatusEnum,
      suspension_interval_days: 0,
    };

    return this.tenantsApi.tenantsControllerUpdateTenant(tenantId, body).pipe(
      map((res) => ({
        tenantId: res.id,
        name: res.name,
        status: res.status,
        createdAt: res.created_at,
      })),
    );
  }

  deleteTenant(tenantId: string): Observable<void> {
    return this.tenantsApi.tenantsControllerDeleteTenant(tenantId).pipe(map(() => void 0));
  }
}
