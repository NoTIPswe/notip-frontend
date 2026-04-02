import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AlertsService as AlertsApiService } from '../../../generated/openapi/notip-management-api-openapi';
import { AlertsType } from '../../../core/models/enums';
import { AlertService } from './alert.service';

describe('AlertService', () => {
  let service: AlertService;

  const apiMock = {
    alertsControllerGetAlertsConfig: vi.fn(),
    alertsControllerSetDefaultAlertsConfig: vi.fn(),
    alertsControllerSetGatewayAlertsConfig: vi.fn(),
    alertsControllerGetAlerts: vi.fn(),
    alertsControllerDeleteGatewayAlertsConfig: vi.fn(),
  };

  beforeEach(async () => {
    apiMock.alertsControllerGetAlertsConfig.mockReset();
    apiMock.alertsControllerSetDefaultAlertsConfig.mockReset();
    apiMock.alertsControllerSetGatewayAlertsConfig.mockReset();
    apiMock.alertsControllerGetAlerts.mockReset();
    apiMock.alertsControllerDeleteGatewayAlertsConfig.mockReset();

    await TestBed.configureTestingModule({
      providers: [AlertService, { provide: AlertsApiService, useValue: apiMock }],
    }).compileComponents();

    service = TestBed.inject(AlertService);
  });

  it('maps alerts configuration with gateway overrides', async () => {
    apiMock.alertsControllerGetAlertsConfig.mockReturnValue(
      of({
        tenant_id: 'tenant-1',
        tenant_unreachable_timeout_ms: 15000,
        updated_at: '2026-03-31T11:00:00.000Z',
        gateway_configs: [
          { gateway_id: 'gw-1', gateway_unreachable_timeout_ms: 9000 },
          { gateway_id: 'gw-2', gateway_unreachable_timeout_ms: 7000 },
        ],
      }),
    );

    await expect(firstValueFrom(service.getAlertsConfig())).resolves.toEqual({
      default: {
        tenantId: 'tenant-1',
        timeoutMs: 15000,
        updatedAt: '2026-03-31T11:00:00.000Z',
      },
      gatewayOverrides: [
        { gatewayId: 'gw-1', timeoutMs: 9000 },
        { gatewayId: 'gw-2', timeoutMs: 7000 },
      ],
    });
  });

  it('sets default config and applies numeric fallback', async () => {
    apiMock.alertsControllerSetDefaultAlertsConfig.mockReturnValue(
      of({ tenant_id: 'tenant-1', tenant_unreachable_timeout_ms: 'bad', updated_at: 'now' }),
    );

    await expect(firstValueFrom(service.setDefaultConfig(12000))).resolves.toEqual({
      tenantId: 'tenant-1',
      timeoutMs: 12000,
      updatedAt: 'now',
    });

    expect(apiMock.alertsControllerSetDefaultAlertsConfig).toHaveBeenCalledWith({
      tenant_unreachable_timeout_ms: 12000,
    });
  });

  it('sets gateway config and falls back to request values', async () => {
    apiMock.alertsControllerSetGatewayAlertsConfig.mockReturnValue(
      of({ gateway_unreachable_timeout_ms: 'bad' }),
    );

    await expect(firstValueFrom(service.sendGatewayConfig('gw-5', 5000))).resolves.toEqual({
      gatewayId: 'gw-5',
      timeoutMs: 5000,
      updatedAt: '',
    });
  });

  it('maps alerts list and uses message fallback for details', async () => {
    apiMock.alertsControllerGetAlerts.mockReturnValue(
      of([
        {
          tenant_id: 'tenant-1',
          type: AlertsType.GATEWAY_OFFLINE,
          gateway_id: 'gw-1',
          details: 'offline',
          created_at: '2026-03-31T12:00:00.000Z',
        },
        {
          tenant_id: 'tenant-1',
          type: 'UNKNOWN',
          gateway_id: 'gw-2',
          message: 'fallback-message',
          created_at: '2026-03-31T12:10:00.000Z',
        },
      ]),
    );

    await expect(
      firstValueFrom(service.getAlerts({ from: 'f', to: 't', gatewayId: ['gw-1'] })),
    ).resolves.toEqual([
      {
        tenantId: 'tenant-1',
        type: AlertsType.GATEWAY_OFFLINE,
        gatewayId: 'gw-1',
        details: 'offline',
        createdAt: '2026-03-31T12:00:00.000Z',
      },
      {
        tenantId: 'tenant-1',
        type: AlertsType.GATEWAY_OFFLINE,
        gatewayId: 'gw-2',
        details: 'fallback-message',
        createdAt: '2026-03-31T12:10:00.000Z',
      },
    ]);

    expect(apiMock.alertsControllerGetAlerts).toHaveBeenCalledWith('f', 't', 'gw-1');
  });

  it('deletes gateway alerts configuration', async () => {
    apiMock.alertsControllerDeleteGatewayAlertsConfig.mockReturnValue(of({}));

    await expect(firstValueFrom(service.deleteGatewayConfig('gw-1'))).resolves.toBeUndefined();
    expect(apiMock.alertsControllerDeleteGatewayAlertsConfig).toHaveBeenCalledWith('gw-1');
  });
});
