import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminGatewaysService as AdminGatewaysApiService } from '../../../generated/openapi/notip-management-api-openapi';
import { AdminGatewayService } from './admin-gateway.service';

describe('AdminGatewayService', () => {
  let service: AdminGatewayService;

  const apiMock = {
    gatewaysControllerGetAdminGateways: vi.fn(),
    gatewaysControllerAddGateway: vi.fn(),
  };

  beforeEach(async () => {
    apiMock.gatewaysControllerGetAdminGateways.mockReset();
    apiMock.gatewaysControllerAddGateway.mockReset();

    await TestBed.configureTestingModule({
      providers: [AdminGatewayService, { provide: AdminGatewaysApiService, useValue: apiMock }],
    }).compileComponents();

    service = TestBed.inject(AdminGatewayService);
  });

  it('maps admin gateways with optional fields', async () => {
    apiMock.gatewaysControllerGetAdminGateways.mockReturnValue(
      of([
        {
          id: 'gw-1',
          tenant_id: 't-1',
          provisioned: true,
          model: 'M1',
          factory_id: 'f-1',
          firmware: '1.0.0',
          created_at: '2026-03-31',
        },
        { id: 'gw-2', tenant_id: 't-2', provisioned: false, model: 'M2', factory_id: 'f-2' },
      ]),
    );

    await expect(firstValueFrom(service.getGateways('t-1'))).resolves.toEqual([
      {
        gatewayId: 'gw-1',
        tenantId: 't-1',
        provisioned: true,
        model: 'M1',
        factoryId: 'f-1',
        firmware: '1.0.0',
        createdAt: '2026-03-31',
      },
      {
        gatewayId: 'gw-2',
        tenantId: 't-2',
        provisioned: false,
        model: 'M2',
        factoryId: 'f-2',
        createdAt: '',
      },
    ]);
    expect(apiMock.gatewaysControllerGetAdminGateways).toHaveBeenCalledWith('t-1');
  });

  it('sends add gateway payload and returns gateway id', async () => {
    apiMock.gatewaysControllerAddGateway.mockReturnValue(of({ id: 'gw-new' }));

    await expect(
      firstValueFrom(
        service.addGateway({
          factoryId: 'factory-1',
          tenantId: 'tenant-1',
          factoryKey: 'hash-1',
          model: 'ignored-by-api',
        }),
      ),
    ).resolves.toBe('gw-new');

    expect(apiMock.gatewaysControllerAddGateway).toHaveBeenCalledWith({
      factory_id: 'factory-1',
      tenant_id: 'tenant-1',
      factory_key: 'hash-1',
      model: 'ignored-by-api',
    });
  });
});
