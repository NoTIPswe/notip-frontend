import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IMPERSONATION_STATUS } from '../../../core/auth/contracts';
import { GatewaysService as GatewaysApiService } from '../../../generated/openapi/notip-management-api-openapi';
import { GatewayService } from './gateway.service';

describe('GatewayService', () => {
  let service: GatewayService;
  const impersonatingSignal = signal(false);

  const apiMock = {
    gatewaysControllerGetGateways: vi.fn(),
    gatewaysControllerGetGatewayById: vi.fn(),
    gatewaysControllerUpdateGateway: vi.fn(),
    gatewaysControllerDeleteGateway: vi.fn(),
  };

  beforeEach(async () => {
    impersonatingSignal.set(false);
    apiMock.gatewaysControllerGetGateways.mockReset();
    apiMock.gatewaysControllerGetGatewayById.mockReset();
    apiMock.gatewaysControllerUpdateGateway.mockReset();
    apiMock.gatewaysControllerDeleteGateway.mockReset();

    await TestBed.configureTestingModule({
      providers: [
        GatewayService,
        { provide: GatewaysApiService, useValue: apiMock },
        { provide: IMPERSONATION_STATUS, useValue: { isImpersonating: impersonatingSignal } },
      ],
    }).compileComponents();

    service = TestBed.inject(GatewayService);
  });

  it('loads gateway list, maps DTO and updates signals', async () => {
    const rows$ = new Subject<
      {
        id: string;
        name: string;
        status: string;
        last_seen_at?: string;
        provisioned: boolean;
        firmware_version?: string;
        send_frequency_ms: number;
      }[]
    >();

    apiMock.gatewaysControllerGetGateways.mockReturnValue(rows$.asObservable());

    const listPromise = firstValueFrom(service.getGateways());
    expect(service.isLoading()()).toBe(true);

    rows$.next([
      {
        id: 'gw-1',
        name: 'Gateway 1',
        status: 'gateway_online',
        last_seen_at: '2026-03-31',
        provisioned: true,
        firmware_version: '1.2.3',
        send_frequency_ms: 1000,
      },
    ]);
    rows$.complete();

    await expect(listPromise).resolves.toEqual([
      {
        gatewayId: 'gw-1',
        name: 'Gateway 1',
        status: 'online',
        lastSeenAt: '2026-03-31',
        provisioned: true,
        firmwareVersion: '1.2.3',
        sendFrequencyMs: 1000,
      },
    ]);

    expect(service.list()()).toEqual([
      {
        gatewayId: 'gw-1',
        name: 'Gateway 1',
        status: 'online',
        lastSeenAt: '2026-03-31',
        provisioned: true,
        firmwareVersion: '1.2.3',
        sendFrequencyMs: 1000,
      },
    ]);
    expect(service.isLoading()()).toBe(false);
  });

  it('loads single gateway detail and updates selected signal', async () => {
    apiMock.gatewaysControllerGetGatewayById.mockReturnValue(
      of({
        id: 'gw-9',
        name: 'Gateway 9',
        status: 'gateway_suspended',
        last_seen_at: '2026-03-31',
        provisioned: false,
        firmware_version: '2.0.0',
        send_frequency_ms: 2000,
      }),
    );

    await expect(firstValueFrom(service.getGatewayDetail('gw-9'))).resolves.toMatchObject({
      gatewayId: 'gw-9',
      name: 'Gateway 9',
      status: 'paused',
    });
    const selected = service.selectedGateway()();
    expect(selected?.gatewayId).toBe('gw-9');
    expect(service.isLoading()()).toBe(false);
  });

  it('maps online gateway status even when backend uses uppercase/camel-case variants', async () => {
    apiMock.gatewaysControllerGetGateways.mockReturnValue(
      of([
        {
          id: 'gw-upper-1',
          name: 'Gateway Upper',
          status: 'GATEWAY_ONLINE',
          provisioned: true,
          send_frequency_ms: 3000,
        },
        {
          id: 'gw-camel-2',
          name: 'Gateway Camel Online',
          status: 'GatewayOnline',
          provisioned: true,
          send_frequency_ms: 3500,
        },
      ]),
    );

    await expect(firstValueFrom(service.getGateways())).resolves.toEqual([
      {
        gatewayId: 'gw-upper-1',
        name: 'Gateway Upper',
        status: 'online',
        provisioned: true,
        sendFrequencyMs: 3000,
      },
      {
        gatewayId: 'gw-camel-2',
        name: 'Gateway Camel Online',
        status: 'online',
        provisioned: true,
        sendFrequencyMs: 3500,
      },
    ]);
  });

  it('updates gateway name and returns mapped result', async () => {
    apiMock.gatewaysControllerUpdateGateway.mockReturnValue(
      of({ id: 'gw-1', name: 'New Name', status: 'GATEWAY_ONLINE', updated_at: '2026-03-31' }),
    );

    await expect(firstValueFrom(service.updateGatewayName('gw-1', 'New Name'))).resolves.toEqual({
      gatewayId: 'gw-1',
      name: 'New Name',
      status: 'online',
      updatedAt: '2026-03-31',
    });
  });

  it('deletes gateway and returns deleted id', async () => {
    apiMock.gatewaysControllerDeleteGateway.mockReturnValue(of({}));

    await expect(firstValueFrom(service.deleteGateway('gw-del'))).resolves.toBe('gw-del');
    expect(apiMock.gatewaysControllerDeleteGateway).toHaveBeenCalledWith('gw-del');
  });

  it('exposes impersonation signal', () => {
    expect(service.isImpersonating()()).toBe(false);

    impersonatingSignal.set(true);
    expect(service.isImpersonating()()).toBe(true);
  });
});
