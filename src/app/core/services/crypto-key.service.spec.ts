import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KeysService } from '../../generated/openapi/notip-management-api-openapi';
import { IMPERSONATION_STATUS } from '../auth/contracts';
import { CryptoKeyService } from './crypto-key.service';

describe('CryptoKeyService', () => {
  let service: CryptoKeyService;
  const impersonatingSignal = signal(false);

  const keysApiMock = {
    keysControllerGetKeys: vi.fn(),
  };

  beforeEach(async () => {
    impersonatingSignal.set(false);
    keysApiMock.keysControllerGetKeys.mockReset();

    await TestBed.configureTestingModule({
      providers: [
        CryptoKeyService,
        { provide: KeysService, useValue: keysApiMock },
        { provide: IMPERSONATION_STATUS, useValue: { isImpersonating: impersonatingSignal } },
      ],
    }).compileComponents();

    service = TestBed.inject(CryptoKeyService);
  });

  it('returns empty map without API calls while impersonating', async () => {
    impersonatingSignal.set(true);

    await expect(firstValueFrom(service.fetchKeys(['gw-1']))).resolves.toEqual({});
    await expect(firstValueFrom(service.fetchAllKeys())).resolves.toEqual({});
    expect(keysApiMock.keysControllerGetKeys).not.toHaveBeenCalled();
  });

  it('returns empty map when fetchKeys gets no gateway ids', async () => {
    await expect(firstValueFrom(service.fetchKeys([]))).resolves.toEqual({});
    expect(keysApiMock.keysControllerGetKeys).not.toHaveBeenCalled();
  });

  it('maps keys by gateway id when fetching selected gateways', async () => {
    keysApiMock.keysControllerGetKeys
      .mockReturnValueOnce(
        of([
          { gateway_id: 'gw-1', key_material: 'k1', key_version: 2 },
          { gateway_id: 'gw-1', key_material: 'k1b', key_version: 3 },
        ]),
      )
      .mockReturnValueOnce(of([{ gateway_id: 'gw-2', key_material: 'k2', key_version: 1 }]));

    await expect(firstValueFrom(service.fetchKeys(['gw-1', 'gw-2']))).resolves.toEqual({
      'gw-1': 'k1b',
      'gw-2': 'k2',
    });
    expect(keysApiMock.keysControllerGetKeys).toHaveBeenNthCalledWith(1, 'gw-1');
    expect(keysApiMock.keysControllerGetKeys).toHaveBeenNthCalledWith(2, 'gw-2');
  });

  it('maps keys from fetchAllKeys call', async () => {
    keysApiMock.keysControllerGetKeys.mockReturnValue(
      of([{ gateway_id: 'gw-9', key_material: 'all-key', key_version: 7 }]),
    );

    await expect(firstValueFrom(service.fetchAllKeys())).resolves.toEqual({
      'gw-9': 'all-key',
    });
    expect(keysApiMock.keysControllerGetKeys).toHaveBeenCalledWith('');
  });

  it('exposes impersonation status', () => {
    impersonatingSignal.set(false);
    expect(service.isImpersonating()).toBe(false);

    impersonatingSignal.set(true);
    expect(service.isImpersonating()).toBe(true);
  });
});
