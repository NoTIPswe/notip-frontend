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
  DefaultAlertsConfig,
  GatewayAlertsConfig,
} from '../../../core/models/alert';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly alertsApi = inject(AlertsApiService);

  getAlertsConfig(): Observable<AlertsConfig> {
    return this.alertsApi.alertsControllerGetAlertsConfig().pipe(
      map((row) => {
        const cfg: AlertsConfig = {
          default: {
            timeoutMs: Number(
              (row as Record<string, unknown>)['tenant_unreachable_timeout_ms'] ?? 0,
            ),
          },
        };

        const gatewayConfigs = (row as Record<string, unknown>)['gateway_configs'] as
          | Record<string, unknown>[]
          | undefined
          | null;

        if (Array.isArray(gatewayConfigs)) {
          cfg.perGateway = gatewayConfigs.map((item) => ({
            gatewayId: this.asString(item['gateway_id']),
            timeoutMs: Number(item['gateway_unreachable_timeout_ms'] ?? 0),
          }));
        }

        return cfg;
      }),
    );
  }

  setDefaultConfig(timeoutMs: number): Observable<DefaultAlertsConfig> {
    const body: SetAlertsConfigDefaultRequestDto = { tenant_unreachable_timeout_ms: timeoutMs };
    return this.alertsApi
      .alertsControllerSetDefaultAlertsConfig(body)
      .pipe(map(() => ({ timeoutMs })));
  }

  sendGatewayConfig(gatewayId: string, timeoutMs: number): Observable<GatewayAlertsConfig> {
    const body: SetGatewayAlertsConfigRequestDto = {
      gateway_unreachable_timeout_ms: timeoutMs,
    };
    return this.alertsApi
      .alertsControllerSetGatewayAlertsConfig(gatewayId, body)
      .pipe(map(() => ({ gatewayId, timeoutMs })));
  }

  getAlerts(af: AlertsFilter): Observable<Alerts[]> {
    return this.alertsApi
      .alertsControllerGetAlerts(af.from, af.to, af.gatewayId?.[0])
      .pipe(map((rows) => this.toAlerts(rows as Record<string, unknown>[])));
  }

  deleteGatewayConfig(gatewayId: string): Observable<void> {
    return this.alertsApi
      .alertsControllerSetGatewayAlertsConfig(gatewayId, { gateway_unreachable_timeout_ms: 0 })
      .pipe(map(() => void 0));
  }

  private toAlerts(rows: Record<string, unknown>[]): Alerts[] {
    return rows.map((row) => {
      const mapped: Alerts = {
        id: this.asString(row['id']),
        gatewayId: this.asString(row['gateway_id']),
        createdAt: this.asString(row['created_at']),
      };

      if (row['message']) {
        mapped.message = this.asString(row['message']);
      }

      return mapped;
    });
  }

  private asString(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }
}
