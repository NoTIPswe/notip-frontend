import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  AdminTenantsService as AdminTenantsApiService,
  CreateTenantRequestDto,
  TenantsResponseDto,
  UpdateTenantRequestDto,
  UpdateTenantRequestDtoStatusEnum,
} from '../../../generated/openapi/notip-management-api-openapi';
import { TenantStatus } from '../../../core/models/enums';
import {
  CreateTenantParameters,
  Tenant,
  UpdateTenantParameters,
} from '../../../core/models/tenant';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly tenantsApi = inject(AdminTenantsApiService);

  getTenants(): Observable<Tenant[]> {
    return this.tenantsApi
      .tenantsControllerGetTenants()
      .pipe(map((rows) => rows.map((row) => this.mapTenant(row))));
  }

  createTenant(c: CreateTenantParameters): Observable<Tenant> {
    const body: CreateTenantRequestDto = {
      name: c.name,
      admin_email: c.adminEmail,
      admin_username: c.adminName,
      admin_password: c.adminPassword,
    };

    return this.tenantsApi
      .tenantsControllerCreateTenant(body)
      .pipe(map((res) => this.mapTenant(res)));
  }

  updateTenant(tenantId: string, u: UpdateTenantParameters): Observable<Tenant> {
    const status = this.normalizeUpdateStatus(u.status);
    const suspensionIntervalDays = this.normalizeSuspensionIntervalDays(
      u.suspensionIntervalDays,
      status,
    );

    const body: UpdateTenantRequestDto = {
      name: u.name ?? '',
      status,
      suspension_interval_days: suspensionIntervalDays,
    };

    return this.tenantsApi
      .tenantsControllerUpdateTenant(tenantId, body)
      .pipe(map((res) => this.mapTenant(res)));
  }

  deleteTenant(tenantId: string): Observable<void> {
    return this.tenantsApi.tenantsControllerDeleteTenant(tenantId).pipe(map(() => void 0));
  }

  private normalizeUpdateStatus(
    status: TenantStatus | undefined,
  ): UpdateTenantRequestDtoStatusEnum {
    if (status === TenantStatus.suspended) {
      return UpdateTenantRequestDtoStatusEnum.Suspended;
    }

    return UpdateTenantRequestDtoStatusEnum.Active;
  }

  private normalizeSuspensionIntervalDays(
    value: number | undefined,
    status: UpdateTenantRequestDtoStatusEnum,
  ): number {
    if (status === UpdateTenantRequestDtoStatusEnum.Suspended) {
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
        return 0;
      }

      return Math.trunc(value);
    }

    return 0;
  }

  private mapTenant(dto: TenantsResponseDto): Tenant {
    const suspensionIntervalDays = this.normalizeSuspensionInterval(dto.suspension_interval_days);
    const tenant: Tenant = {
      tenantId: dto.id,
      name: dto.name,
      status: this.normalizeTenantStatus(dto.status),
      createdAt: dto.created_at,
    };

    if (suspensionIntervalDays === undefined) {
      return tenant;
    }

    return { ...tenant, suspensionIntervalDays };
  }

  private normalizeTenantStatus(status: unknown): TenantStatus {
    const normalized = typeof status === 'string' ? status.trim().toLowerCase() : '';

    if (normalized === 'suspended') {
      return TenantStatus.suspended;
    }

    return TenantStatus.active;
  }

  private normalizeSuspensionInterval(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
      return Math.trunc(value);
    }

    if (typeof value === 'string') {
      const parsed = Number.parseInt(value, 10);
      if (Number.isFinite(parsed) && parsed >= 0) {
        return parsed;
      }
    }

    return undefined;
  }
}
