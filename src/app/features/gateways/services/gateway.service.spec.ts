import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GatewaysService as GatewaysApiService } from '../../../generated/openapi/notip-management-api-openapi';
import { GatewayService } from './gateway.service';

describe('GatewayService', () => {
  let service: GatewayService;

  const apiMock = {
    gatewaysControllerGetGateways: vi.fn(),
    gatewaysControllerGetGatewayById: vi.fn(),
    gatewaysControllerUpdateGateway: vi.fn(),
    gatewaysControllerDeleteGateway: vi.fn(),
  };
  const httpMock = {
    get: vi.fn(),
  };

  beforeEach(async () => {
    apiMock.gatewaysControllerGetGateways.mockReset();
    apiMock.gatewaysControllerGetGatewayById.mockReset();
    apiMock.gatewaysControllerUpdateGateway.mockReset();
    apiMock.gatewaysControllerDeleteGateway.mockReset();
    httpMock.get.mockReset();

    await TestBed.configureTestingModule({
      providers: [
        GatewayService,
        { provide: GatewaysApiService, useValue: apiMock },
        { provide: HttpClient, useValue: httpMock },
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

  it('loads obfuscated gateway list payload', async () => {
    apiMock.gatewaysControllerGetGateways.mockReturnValue(
      of([
        {
          id: 'gw-obf-1',
          name: 'Gateway 1',
          status: 'offline',
          provisioned: true,
          firmware_version: '1.0.0',
          send_frequency_ms: 30000,
          last_seen_at: '2026-04-06T12:00:00.000Z',
        },
      ]),
    );

    await expect(firstValueFrom(service.getGateways())).resolves.toEqual([
      {
        gatewayId: 'gw-obf-1',
        name: 'Gateway 1',
        status: 'offline',
        provisioned: true,
        firmwareVersion: '1.0.0',
        sendFrequencyMs: 30000,
        lastSeenAt: '2026-04-06T12:00:00.000Z',
      },
    ]);

    expect(apiMock.gatewaysControllerGetGateways).toHaveBeenCalledOnce();
  });

  it('loads gateway detail when backend returns obfuscated name', async () => {
    apiMock.gatewaysControllerGetGatewayById.mockReturnValue(
      of({
        id: 'gw-9',
        name: '-',
        status: 'gateway_online',
        provisioned: true,
        firmware_version: '2.0.1',
        send_frequency_ms: 1500,
      }),
    );

    await expect(firstValueFrom(service.getGatewayDetail('gw-9'))).resolves.toMatchObject({
      gatewayId: 'gw-9',
      name: '-',
      status: 'online',
    });

    expect(apiMock.gatewaysControllerGetGatewayById).toHaveBeenCalledWith('gw-9');
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

  it('maps paused/offline statuses and defaults send frequency for invalid values', async () => {
    apiMock.gatewaysControllerGetGateways.mockReturnValue(
      of([
        {
          id: 'gw-paused',
          name: 'Gateway Paused',
          status: 'paused',
          provisioned: true,
          send_frequency_ms: '4500',
          firmware_version: '',
          last_seen_at: '',
        },
        {
          id: 'gw-unknown',
          name: 'Gateway Unknown',
          status: 'UNKNOWN_STATUS',
          provisioned: 'yes',
          send_frequency_ms: 'not-a-number',
        },
      ]),
    );

    await expect(firstValueFrom(service.getGateways())).resolves.toEqual([
      {
        gatewayId: 'gw-paused',
        name: 'Gateway Paused',
        status: 'paused',
        provisioned: true,
        sendFrequencyMs: 4500,
      },
      {
        gatewayId: 'gw-unknown',
        name: 'Gateway Unknown',
        status: 'offline',
        provisioned: false,
        sendFrequencyMs: 30000,
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
});
