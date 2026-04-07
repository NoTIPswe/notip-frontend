import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CostsService as CostsApiService } from '../../../../generated/openapi/notip-management-api-openapi';
import { CostsService } from './costs.service';

describe('CostsService', () => {
  let service: CostsService;

  const apiMock = {
    costsControllerGetTenantCost: vi.fn(),
  };

  beforeEach(() => {
    apiMock.costsControllerGetTenantCost.mockReset();

    TestBed.configureTestingModule({
      providers: [CostsService, { provide: CostsApiService, useValue: apiMock }],
    });

    service = TestBed.inject(CostsService);
  });

  it('maps tenant costs payload', async () => {
    apiMock.costsControllerGetTenantCost.mockReturnValue(
      of({ storage_gb: 12.5, bandwidth_gb: 4.2 }),
    );

    await expect(firstValueFrom(service.getTenantCosts())).resolves.toEqual({
      storageGb: 12.5,
      bandwidthGb: 4.2,
    });
  });

  it('falls back to zero when payload values are missing or invalid', async () => {
    apiMock.costsControllerGetTenantCost.mockReturnValue(
      of({ storage_gb: null, bandwidth_gb: 'not-a-number' }),
    );

    await expect(firstValueFrom(service.getTenantCosts())).resolves.toEqual({
      storageGb: 0,
      bandwidthGb: 0,
    });
  });

  it('parses numeric strings and falls back on non-finite numbers', async () => {
    apiMock.costsControllerGetTenantCost.mockReturnValue(
      of({ storage_gb: '7.75', bandwidth_gb: Number.POSITIVE_INFINITY }),
    );

    await expect(firstValueFrom(service.getTenantCosts())).resolves.toEqual({
      storageGb: 7.75,
      bandwidthGb: 0,
    });
  });
});
