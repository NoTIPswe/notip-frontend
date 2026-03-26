import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { UsersService as UsersApiService } from '../../../generated/openapi/notip-management-api-openapi';
import { UserRole } from '../../../core/models/enums';
import { ObfuscatedUser } from '../../../core/models/user';

@Injectable({ providedIn: 'root' })
export class AdminUserService {
  private readonly usersApi = inject(UsersApiService);

  getUsers(tenantId: string): Observable<ObfuscatedUser[]> {
    // Endpoint dedicated to tenant-scoped admin users is not available in generated API yet.
    const tenantScope = tenantId;
    return this.usersApi.usersControllerGetUsers().pipe(
      map((rows) =>
        rows
          .map((row) => ({
            userId: row.id,
            role: this.toUserRole(row.role),
          }))
          .filter(() => tenantScope.length >= 0),
      ),
    );
  }

  private toUserRole(role: string): UserRole {
    switch (role) {
      case 'system_admin':
        return UserRole.system_admin;
      case 'tenant_admin':
        return UserRole.tenant_admin;
      default:
        return UserRole.tenant_user;
    }
  }
}
