import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AdminTenantsService as AdminTenantsApiService } from '../../../generated/openapi/notip-management-api-openapi';
import { UserRole } from '../../../core/models/enums';
import { ObfuscatedUser } from '../../../core/models/user';

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly adminTenantsApi = inject(AdminTenantsApiService);

  getUsers(tenantId: string): Observable<ObfuscatedUser[]> {
    return this.adminTenantsApi.tenantsControllerGetTenantUsers(tenantId).pipe(
      map((rows) =>
        rows
          .filter((row): row is { user_id: string; role?: string } => Boolean(row.user_id))
          .map((row) => ({
            userId: row.user_id,
            role: this.toUserRole(row.role),
          })),
      ),
    );
  }

  private toUserRole(role: string | undefined): UserRole {
    switch (role) {
      case UserRole.system_admin:
        return UserRole.system_admin;
      case UserRole.tenant_admin:
        return UserRole.tenant_admin;
      default:
        return UserRole.tenant_user;
    }
  }
}
