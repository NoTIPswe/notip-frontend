import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { CostsService as CostsApiService } from '../../../../generated/openapi/notip-management-api-openapi';
import { Costs } from '../../../../core/models/costs';

@Injectable({ providedIn: 'root' })
export class CostsService {
  private readonly costsApi = inject(CostsApiService);

  getTenantCosts(): Observable<Costs> {
    return this.costsApi.costsControllerGetTenantCost().pipe(
      map((res) => {
        const payload = res as unknown as Record<string, unknown>;
        return {
          storageGb: this.toNumber(payload['storage_gb']),
          bandwidthGb: this.toNumber(payload['bandwidth_gb']),
        };
      }),
    );
  }

  private toNumber(value: unknown): number {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === 'string') {
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
  }
}
