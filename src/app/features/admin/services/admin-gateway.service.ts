import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  AddGatewayRequestDto,
  AdminGatewaysService as AdminGatewaysApiService,
} from '../../../generated/openapi/notip-management-api-openapi';
import { AddGatewayParameters, ObfuscatedGateway } from '../../../core/models/gateway';

@Injectable({ providedIn: 'root' })
export class AdminGatewayService {
  private readonly adminGatewaysApi = inject(AdminGatewaysApiService);

  getGateways(tenantId?: string): Observable<ObfuscatedGateway[]> {
    return this.adminGatewaysApi.gatewaysControllerGetAdminGateways(tenantId).pipe(
      map((rows) =>
        (rows as Record<string, unknown>[]).map((row) => {
          const mapped: ObfuscatedGateway = {
            gatewayId: this.asString(row['id']),
            tenantId: this.asString(row['tenant_id']),
            provisioned: Boolean(row['provisioned']),
            model: this.asString(row['model']),
            factoryId: this.asString(row['factory_id']),
            createdAt: this.asString(row['created_at']),
          };
          if (row['firmware']) {
            mapped.firmware = this.asString(row['firmware']);
          }

          return mapped;
        }),
      ),
    );
  }

  addGateway(gp: AddGatewayParameters): Observable<string> {
    const body: AddGatewayRequestDto = {
      factory_id: gp.factoryId,
      tenant_id: gp.tenantId,
      factory_key: gp.factoryKey,
      model: gp.model,
    };

    return this.adminGatewaysApi
      .gatewaysControllerAddGateway(body)
      .pipe(map((res) => this.asString((res as Record<string, unknown>)['id'])));
  }

  private asString(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }
}
