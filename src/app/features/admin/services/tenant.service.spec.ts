import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminTenantsService as AdminTenantsApiService } from '../../../generated/openapi/notip-management-api-openapi';
import { TenantService } from './tenant.service';

describe('TenantService', () => {
  let service: TenantService;

  const apiMock = {
    tenantsControllerGetTenants: vi.fn(),
    tenantsControllerCreateTenant: vi.fn(),
    tenantsControllerUpdateTenant: vi.fn(),
    tenantsControllerDeleteTenant: vi.fn(),
  };

  beforeEach(async () => {
    apiMock.tenantsControllerGetTenants.mockReset();
    apiMock.tenantsControllerCreateTenant.mockReset();
    apiMock.tenantsControllerUpdateTenant.mockReset();
    apiMock.tenantsControllerDeleteTenant.mockReset();

    await TestBed.configureTestingModule({
      providers: [TenantService, { provide: AdminTenantsApiService, useValue: apiMock }],
    }).compileComponents();

    service = TestBed.inject(TenantService);
  });

  it('maps tenants list', async () => {
    apiMock.tenantsControllerGetTenants.mockReturnValue(
      of([{ id: 't-1', name: 'Tenant 1', status: 'active', created_at: '2026-03-31' }]),
    );

    await expect(firstValueFrom(service.getTenants())).resolves.toEqual([
      {
        tenantId: 't-1',
        name: 'Tenant 1',
        status: 'active',
        createdAt: '2026-03-31',
      },
    ]);
  });

  it('creates tenant with correct payload', async () => {
    apiMock.tenantsControllerCreateTenant.mockReturnValue(
      of({ id: 't-2', name: 'Tenant 2', status: 'active', created_at: '2026-03-31' }),
    );

    await expect(
      firstValueFrom(
        service.createTenant({
          name: 'Tenant 2',
          adminEmail: 'admin@x.test',
          adminName: 'Admin',
          adminPassword: 'Secret123',
        }),
      ),
    ).resolves.toEqual({
      tenantId: 't-2',
      name: 'Tenant 2',
      status: 'active',
      createdAt: '2026-03-31',
    });

    expect(apiMock.tenantsControllerCreateTenant).toHaveBeenCalledWith({
      name: 'Tenant 2',
      admin_email: 'admin@x.test',
      admin_name: 'Admin',
      admin_password: 'Secret123',
    });
  });

  it('updates tenant with fallback values', async () => {
    apiMock.tenantsControllerUpdateTenant.mockReturnValue(
      of({ id: 't-1', name: '', status: 'active', created_at: '2026-03-31' }),
    );

    await firstValueFrom(service.updateTenant('t-1', {}));

    expect(apiMock.tenantsControllerUpdateTenant).toHaveBeenCalledWith('t-1', {
      name: '',
      status: 'active',
      suspension_interval_days: 0,
    });
  });

  it('deletes tenant', async () => {
    apiMock.tenantsControllerDeleteTenant.mockReturnValue(of({}));

    await expect(firstValueFrom(service.deleteTenant('t-1'))).resolves.toBeUndefined();
    expect(apiMock.tenantsControllerDeleteTenant).toHaveBeenCalledWith('t-1');
  });
});
