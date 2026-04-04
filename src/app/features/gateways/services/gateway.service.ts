import { Injectable, Signal, signal, inject } from '@angular/core';
import { finalize, map, Observable, tap } from 'rxjs';
import {
  GatewayResponseDto,
  GatewaysService as GatewaysApiService,
  UpdateGatewayRequestDto,
  UpdateGatewayResponseDto,
} from '../../../generated/openapi/notip-management-api-openapi';
import { Gateway, GatewayUpdateResult } from '../../../core/models/gateway';
import { GatewayStatus } from '../../../core/models/enums';
import { IMPERSONATION_STATUS, ImpersonationStatus } from '../../../core/auth/contracts';

const DEFAULT_GATEWAY_SEND_FREQUENCY_MS = 30000;

@Injectable({ providedIn: 'root' })
export class GatewayService {
  private readonly gatewaysApi = inject(GatewaysApiService);
  private readonly impersonationStatus = inject<ImpersonationStatus>(IMPERSONATION_STATUS);

  private readonly listSignal = signal<Gateway[]>([]);
  private readonly selectedGatewaySignal = signal<Gateway | null>(null);
  private readonly loadingSignal = signal(false);

  getGateways(): Observable<Gateway[]> {
    this.loadingSignal.set(true);

    return this.gatewaysApi.gatewaysControllerGetGateways().pipe(
      map((rows) => rows.map((row) => this.toGateway(row))),
      tap((rows) => {
        this.listSignal.set(rows);
      }),
      finalize(() => this.loadingSignal.set(false)),
    );
  }

  getGatewayDetail(gatewayId: string): Observable<Gateway> {
    this.loadingSignal.set(true);

    return this.gatewaysApi.gatewaysControllerGetGatewayById(gatewayId).pipe(
      map((dto) => this.toGateway(dto)),
      tap((gateway) => {
        this.selectedGatewaySignal.set(gateway);
      }),
      finalize(() => this.loadingSignal.set(false)),
    );
  }

  updateGatewayName(gatewayId: string, name: string): Observable<GatewayUpdateResult> {
    const body: UpdateGatewayRequestDto = { name };

    return this.gatewaysApi.gatewaysControllerUpdateGateway(gatewayId, body).pipe(
      map((dto) => ({
        gatewayId: dto.id,
        name: dto.name,
        status: this.toGatewayStatus(dto.status),
        updatedAt: dto.updated_at,
      })),
    );
  }

  deleteGateway(gatewayId: string): Observable<string> {
    return this.gatewaysApi.gatewaysControllerDeleteGateway(gatewayId).pipe(map(() => gatewayId));
  }

  list(): Signal<Gateway[]> {
    return this.listSignal.asReadonly();
  }

  selectedGateway(): Signal<Gateway | null> {
    return this.selectedGatewaySignal.asReadonly();
  }

  isLoading(): Signal<boolean> {
    return this.loadingSignal.asReadonly();
  }

  isImpersonating(): Signal<boolean> {
    return this.impersonationStatus.isImpersonating;
  }

  private toGateway(dto: GatewayResponseDto): Gateway {
    const row = dto as unknown as Record<string, unknown>;
    const lastSeenAt = this.pickOptionalString(row, ['last_seen_at', 'lastSeenAt']);
    const firmwareVersion = this.pickOptionalString(row, ['firmware_version', 'firmwareVersion']);

    return {
      gatewayId: this.pickString(row, ['id', 'gateway_id', 'gatewayId']),
      name: this.pickString(row, ['name']),
      status: this.toGatewayStatus(row['status']),
      provisioned: this.pickBoolean(row, ['provisioned']),
      sendFrequencyMs: this.pickNumber(row, ['send_frequency_ms', 'sendFrequencyMs']),
      ...(lastSeenAt ? { lastSeenAt } : {}),
      ...(firmwareVersion ? { firmwareVersion } : {}),
    };
  }

  private toGatewayStatus(status: unknown): GatewayStatus {
    switch (String(status)) {
      case 'gateway_online':
      case 'online':
        return GatewayStatus.online;
      case 'gateway_suspended':
      case 'paused':
        return GatewayStatus.paused;
      case 'gateway_offline':
      case 'offline':
      default:
        return GatewayStatus.offline;
    }
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

  private pickOptionalString(row: Record<string, unknown>, keys: string[]): string | undefined {
    for (const key of keys) {
      const value = row[key];
      if (typeof value === 'string' && value.length > 0) {
        return value;
      }
    }

    return undefined;
  }

  private pickBoolean(row: Record<string, unknown>, keys: string[]): boolean {
    for (const key of keys) {
      const value = row[key];
      if (typeof value === 'boolean') {
        return value;
      }
    }

    return false;
  }

  private pickNumber(row: Record<string, unknown>, keys: string[]): number {
    for (const key of keys) {
      const value = row[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }

      if (typeof value === 'string') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }

    return DEFAULT_GATEWAY_SEND_FREQUENCY_MS;
  }
}
