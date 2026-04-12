import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import {
  AlertsService as AlertsApiService,
  SetAlertsConfigDefaultRequestDto,
  SetGatewayAlertsConfigRequestDto,
} from '../../../generated/openapi/notip-management-api-openapi';
import {
  AlertDetails,
  Alerts,
  AlertsConfig,
  AlertsFilter,
  AlertsType,
  DefaultAlertsConfig,
  GatewayOverride,
  GatewayAlertsConfig,
} from '../../../core/models/alert';

@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly alertsApi = inject(AlertsApiService);

  getAlertsConfig(): Observable<AlertsConfig> {
    return this.alertsApi.alertsControllerGetAlertsConfig().pipe(
      map((row) => {
        const data = this.asRecord(row);
        const gatewayConfigs = data['gateway_overrides'];

        const cfg: AlertsConfig = {
          default: {
            tenantId: this.asString(data['tenant_id']),
            timeoutMs: this.asNumber(data['default_timeout_ms'], 60000),
            updatedAt: this.asString(data['default_updated_at']),
          },
        };

        if (Array.isArray(gatewayConfigs)) {
          cfg.gatewayOverrides = gatewayConfigs.map((item) => {
            const gatewayConfig = this.asRecord(item);
            const mappedOverride: GatewayOverride = {
              gatewayId: this.asString(gatewayConfig['gateway_id']),
              timeoutMs: this.asNumber(gatewayConfig['timeout_ms']),
            };

            const updatedAt = this.asString(gatewayConfig['updated_at']);
            if (updatedAt) {
              mappedOverride.updatedAt = updatedAt;
            }

            return mappedOverride;
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
          timeoutMs: this.asNumber(data['default_timeout_ms'], timeoutMs),
          updatedAt: this.asString(data['default_updated_at']),
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
          timeoutMs: this.asNumber(data['timeout_ms'], timeoutMs),
          updatedAt: this.asString(data['updated_at']),
        };
      }),
    );
  }

  getAlerts(af: AlertsFilter): Observable<Alerts[]> {
    const gatewayIds = this.normalizeGatewayIds(af.gatewayId);

    if (gatewayIds.length <= 1) {
      return this.fetchAlerts(af.from, af.to, gatewayIds[0]);
    }

    return forkJoin(
      gatewayIds.map((gatewayId) => this.fetchAlerts(af.from, af.to, gatewayId)),
    ).pipe(map((results) => this.mergeAlerts(results.flat())));
  }

  deleteGatewayConfig(gatewayId: string): Observable<void> {
    return this.alertsApi
      .alertsControllerDeleteGatewayAlertsConfig(gatewayId)
      .pipe(map(() => void 0));
  }

  private fetchAlerts(from: string, to: string, gatewayId?: string): Observable<Alerts[]> {
    return this.alertsApi
      .alertsControllerGetAlerts(from, to, gatewayId)
      .pipe(
        map((rows) =>
          this.toAlerts(Array.isArray(rows) ? (rows as Record<string, unknown>[]) : []),
        ),
      );
  }

  private normalizeGatewayIds(values?: string[]): string[] {
    if (!Array.isArray(values)) {
      return [];
    }

    const unique = new Set<string>();

    for (const value of values) {
      if (typeof value !== 'string') {
        continue;
      }

      const normalized = value.trim();
      if (normalized.length === 0) {
        continue;
      }

      unique.add(normalized);
    }

    return Array.from(unique);
  }

  private mergeAlerts(rows: Alerts[]): Alerts[] {
    const unique = new Map<string, Alerts>();

    for (const row of rows) {
      const key = `${row.id}|${row.gatewayId}|${row.createdAt}`;
      if (!unique.has(key)) {
        unique.set(key, row);
      }
    }

    return Array.from(unique.values()).sort((a, b) => {
      const first = Date.parse(a.createdAt);
      const second = Date.parse(b.createdAt);

      if (Number.isFinite(first) && Number.isFinite(second)) {
        return second - first;
      }

      return b.createdAt.localeCompare(a.createdAt);
    });
  }

  private toAlerts(rows: Record<string, unknown>[]): Alerts[] {
    return rows.map((row) => {
      const data = this.asRecord(row);
      const mapped: Alerts = {
        id: this.asString(data['id']),
        type: this.toAlertsType(data['type']),
        gatewayId: this.asString(data['gateway_id']),
        details: this.toAlertDetails(data['details'], data['message']),
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

  private toAlertDetails(details: unknown, message: unknown): AlertDetails {
    const mappedDetails: AlertDetails = {};

    if (typeof details === 'object' && details !== null) {
      const data = details as Record<string, unknown>;
      const normalized: AlertDetails = { ...data };

      const lastSeen = this.asString(data['lastSeen']) || this.asString(data['last_seen']);
      if (lastSeen) {
        normalized.lastSeen = lastSeen;
      }

      const timeoutFromCamel = this.asNumber(data['timeoutConfigured'], Number.NaN);
      const timeoutFromSnake = this.asNumber(data['timeout_configured'], Number.NaN);
      const timeout = Number.isFinite(timeoutFromCamel) ? timeoutFromCamel : timeoutFromSnake;
      if (Number.isFinite(timeout)) {
        normalized.timeoutConfigured = timeout;
      }

      return normalized;
    }

    const detailsAsString = this.asString(details);
    if (detailsAsString) {
      mappedDetails['message'] = detailsAsString;
      return mappedDetails;
    }

    const messageAsString = this.asString(message);
    if (messageAsString) {
      mappedDetails['message'] = messageAsString;
    }

    return mappedDetails;
  }
}
