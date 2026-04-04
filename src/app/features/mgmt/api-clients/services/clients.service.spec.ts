import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClientService as ApiClientApiService } from '../../../../generated/openapi/notip-management-api-openapi';
import { ClientsService } from './clients.service';

describe('ClientsService', () => {
  let service: ClientsService;

  const apiMock = {
    apiClientControllerGetApiClients: vi.fn(),
    apiClientControllerCreateApiClient: vi.fn(),
    apiClientControllerDeleteApiClient: vi.fn(),
  };

  beforeEach(async () => {
    apiMock.apiClientControllerGetApiClients.mockReset();
    apiMock.apiClientControllerCreateApiClient.mockReset();
    apiMock.apiClientControllerDeleteApiClient.mockReset();

    await TestBed.configureTestingModule({
      providers: [ClientsService, { provide: ApiClientApiService, useValue: apiMock }],
    }).compileComponents();

    service = TestBed.inject(ClientsService);
  });

  it('maps clients list from API payload', async () => {
    apiMock.apiClientControllerGetApiClients.mockReturnValue(
      of([{ id: '1', client_id: 'cid-1', name: 'client one', created_at: '2026-03-31' }]),
    );

    await expect(firstValueFrom(service.getClients())).resolves.toEqual([
      { id: '1', clientId: 'cid-1', name: 'client one', createdAt: '2026-03-31' },
    ]);
  });

  it('maps clients list also from camelCase payload', async () => {
    apiMock.apiClientControllerGetApiClients.mockReturnValue(
      of([{ id: '1', clientId: 'cid-1', name: 'client one', createdAt: '2026-03-31' }]),
    );

    await expect(firstValueFrom(service.getClients())).resolves.toEqual([
      { id: '1', clientId: 'cid-1', name: 'client one', createdAt: '2026-03-31' },
    ]);
  });

  it('maps non-string fields to empty strings', async () => {
    apiMock.apiClientControllerGetApiClients.mockReturnValue(
      of([{ id: 1, client_id: null, name: false, created_at: 123 }]),
    );

    await expect(firstValueFrom(service.getClients())).resolves.toEqual([
      { id: '', clientId: '', name: '', createdAt: '' },
    ]);
  });

  it('creates client and maps secret payload', async () => {
    apiMock.apiClientControllerCreateApiClient.mockReturnValue(
      of({
        id: '1',
        client_id: 'cid-1',
        name: 'client one',
        client_secret: 'super-secret',
        created_at: '2026-03-31',
      }),
    );

    await expect(firstValueFrom(service.createClient('client one'))).resolves.toEqual({
      id: '1',
      clientId: 'cid-1',
      name: 'client one',
      clientSecret: 'super-secret',
      createdAt: '2026-03-31',
    });

    expect(apiMock.apiClientControllerCreateApiClient).toHaveBeenCalledWith({ name: 'client one' });
  });

  it('creates client and maps secret payload also from camelCase fields', async () => {
    apiMock.apiClientControllerCreateApiClient.mockReturnValue(
      of({
        id: '1',
        clientId: 'cid-1',
        name: 'client one',
        clientSecret: 'super-secret',
        createdAt: '2026-03-31',
      }),
    );

    await expect(firstValueFrom(service.createClient('client one'))).resolves.toEqual({
      id: '1',
      clientId: 'cid-1',
      name: 'client one',
      clientSecret: 'super-secret',
      createdAt: '2026-03-31',
    });
  });

  it('deletes client', async () => {
    apiMock.apiClientControllerDeleteApiClient.mockReturnValue(of({}));

    await expect(firstValueFrom(service.deleteClient('cid-1'))).resolves.toBeUndefined();
    expect(apiMock.apiClientControllerDeleteApiClient).toHaveBeenCalledWith('cid-1');
  });
});
