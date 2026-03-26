import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { CostsService as CostsApiService } from '../../../../generated/openapi/notip-management-api-openapi';
import { Costs } from '../../../../core/models/costs';

@Injectable({ providedIn: 'root' })
export class CostsService {
  private readonly costsApi = inject(CostsApiService);

  getTenantCosts(): Observable<Costs> {
    return this.costsApi
      .costsControllerGetTenantCost()
      .pipe(map((res) => ({ storageGb: res.storage_gb, bandwidthGb: res.bandwidth_gb })));
  }
}
