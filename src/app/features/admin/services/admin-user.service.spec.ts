import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminTenantsService as AdminTenantsApiService } from '../../../generated/openapi/notip-management-api-openapi';
import { UserRole } from '../../../core/models/enums';
import { AdminUserService } from './admin-user.service';

describe('AdminUserService', () => {
  let service: AdminUserService;

  const apiMock = {
    tenantsControllerGetTenantUsers: vi.fn(),
  };

  beforeEach(async () => {
    apiMock.tenantsControllerGetTenantUsers.mockReset();

    await TestBed.configureTestingModule({
      providers: [AdminUserService, { provide: AdminTenantsApiService, useValue: apiMock }],
    }).compileComponents();

    service = TestBed.inject(AdminUserService);
  });

  it('filters rows without user id and maps role values', async () => {
    apiMock.tenantsControllerGetTenantUsers.mockReturnValue(
      of([
        { user_id: 'u-1', role: 'system_admin' },
        { user_id: 'u-2', role: 'tenant_admin' },
        { user_id: 'u-3', role: 'unexpected' },
        { user_id: '', role: 'tenant_admin' },
      ]),
    );

    await expect(firstValueFrom(service.getUsers('tenant-1'))).resolves.toEqual([
      { userId: 'u-1', role: UserRole.system_admin },
      { userId: 'u-2', role: UserRole.tenant_admin },
      { userId: 'u-3', role: UserRole.tenant_user },
    ]);
    expect(apiMock.tenantsControllerGetTenantUsers).toHaveBeenCalledWith('tenant-1');
  });
});
