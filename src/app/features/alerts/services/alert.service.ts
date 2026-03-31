import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  AlertsService as AlertsApiService,
  SetAlertsConfigDefaultRequestDto,
  SetGatewayAlertsConfigRequestDto,
} from '../../../generated/openapi/notip-management-api-openapi';
import {
  Alerts,
  AlertsConfig,
  AlertsFilter,
  AlertsType,
  DefaultAlertsConfig,
  GatewayAlertsConfig,
} from '../../../core/models/alert';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly alertsApi = inject(AlertsApiService);

  getAlertsConfig(): Observable<AlertsConfig> {
    return this.alertsApi.alertsControllerGetAlertsConfig().pipe(
      map((row) => {
        const data = this.asRecord(row);
        const gatewayConfigs = data['gateway_configs'];

        const cfg: AlertsConfig = {
          default: {
            tenantId: this.asString(data['tenant_id']),
            timeoutMs: this.asNumber(data['tenant_unreachable_timeout_ms']),
            updatedAt: this.asString(data['updated_at']),
          },
        };

        if (Array.isArray(gatewayConfigs)) {
          cfg.gatewayOverrides = gatewayConfigs.map((item) => {
            const gatewayConfig = this.asRecord(item);
            return {
              gatewayId: this.asString(gatewayConfig['gateway_id']),
              timeoutMs: this.asNumber(gatewayConfig['gateway_unreachable_timeout_ms']),
            };
          });
        }

        return cfg;
      }),
    );
  }

  setDefaultConfig(timeoutMs: number): Observable<DefaultAlertsConfig> {
    const body: SetAlertsConfigDefaultRequestDto = { tenant_unreachable_timeout_ms: timeoutMs };
    return this.alertsApi.alertsControllerSetDefaultAlertsConfig(body).pipe(
      map((row) => {
        const data = this.asRecord(row);
        return {
          tenantId: this.asString(data['tenant_id']),
          timeoutMs: this.asNumber(data['tenant_unreachable_timeout_ms'], timeoutMs),
          updatedAt: this.asString(data['updated_at']),
        };
      }),
    );
  }

  sendGatewayConfig(gatewayId: string, timeoutMs: number): Observable<GatewayAlertsConfig> {
    const body: SetGatewayAlertsConfigRequestDto = {
      gateway_unreachable_timeout_ms: timeoutMs,
    };
    return this.alertsApi.alertsControllerSetGatewayAlertsConfig(gatewayId, body).pipe(
      map((row) => {
        const data = this.asRecord(row);
        return {
          gatewayId: this.asString(data['gateway_id']) || gatewayId,
          timeoutMs: this.asNumber(data['gateway_unreachable_timeout_ms'], timeoutMs),
          updatedAt: this.asString(data['updated_at']),
        };
      }),
    );
  }

  getAlerts(af: AlertsFilter): Observable<Alerts[]> {
    return this.alertsApi
      .alertsControllerGetAlerts(af.from, af.to, af.gatewayId?.[0])
      .pipe(
        map((rows) =>
          this.toAlerts(Array.isArray(rows) ? (rows as Record<string, unknown>[]) : []),
        ),
      );
  }

  deleteGatewayConfig(gatewayId: string): Observable<void> {
    return this.alertsApi
      .alertsControllerDeleteGatewayAlertsConfig(gatewayId)
      .pipe(map(() => void 0));
  }

  private toAlerts(rows: Record<string, unknown>[]): Alerts[] {
    return rows.map((row) => {
      const data = this.asRecord(row);
      const mapped: Alerts = {
        tenantId: this.asString(data['tenant_id']),
        type: this.toAlertsType(data['type']),
        gatewayId: this.asString(data['gateway_id']),
        details: this.asString(data['details']) || this.asString(data['message']),
        createdAt: this.asString(data['created_at']),
      };

      return mapped;
    });
  }

  private toAlertsType(value: unknown): AlertsType {
    return value === AlertsType.GATEWAY_OFFLINE ? value : AlertsType.GATEWAY_OFFLINE;
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  }

  private asNumber(value: unknown, fallback: number = 0): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  private asString(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }
}
