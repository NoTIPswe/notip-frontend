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
            gatewayId: this.pickString(row, ['id', 'gateway_id', 'gatewayId']),
            tenantId: this.pickString(row, ['tenant_id', 'tenantId']),
            provisioned: Boolean(row['provisioned']),
            model: this.asString(row['model']),
            factoryId: this.pickString(row, ['factory_id', 'factoryId']),
            createdAt: this.pickString(row, ['created_at', 'createdAt']),
          };
          const firmware = this.pickString(row, [
            'firmware',
            'firmware_version',
            'firmwareVersion',
          ]);
          if (firmware) {
            mapped.firmware = firmware;
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

  private pickString(row: Record<string, unknown>, keys: string[]): string {
    for (const key of keys) {
      const value = row[key];
      if (typeof value === 'string' && value.length > 0) {
        return value;
      }
    }

    return '';
  }
}
