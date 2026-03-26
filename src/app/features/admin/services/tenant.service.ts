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
  UpdatedTenant,
  UpdateTenantParameters,
  ViewTenant,
} from '../../../core/models/tenant';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly tenantsApi = inject(AdminTenantsApiService);

  getTenants(): Observable<ViewTenant[]> {
    return this.tenantsApi.tenantsControllerGetTenants().pipe(
      map((rows) =>
        rows.map((row) => ({
          id: row.id,
          name: row.name,
          status: row.status,
          createdAt: row.created_at,
        })),
      ),
    );
  }

  createTenant(c: CreateTenantParameters): Observable<ViewTenant> {
    const body: CreateTenantRequestDto = {
      name: c.name,
      admin_email: '',
      admin_name: '',
      admin_password: '',
    };

    return this.tenantsApi.tenantsControllerCreateTenant(body).pipe(
      map((res) => ({
        id: res.id,
        name: res.name,
        status: res.status,
        createdAt: res.created_at,
      })),
    );
  }

  updateTenant(tenantId: string, u: UpdateTenantParameters): Observable<UpdatedTenant> {
    const body: UpdateTenantRequestDto = {
      name: u.name ?? '',
      status: (u.status ?? 'active') as UpdateTenantRequestDtoStatusEnum,
      suspension_interval_days: 0,
    };

    return this.tenantsApi.tenantsControllerUpdateTenant(tenantId, body).pipe(
      map((res) => ({
        id: res.id,
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
