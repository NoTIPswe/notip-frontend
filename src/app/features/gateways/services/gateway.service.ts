import { Injectable, Signal, signal, inject } from '@angular/core';
import { map, Observable, tap } from 'rxjs';
import {
  GatewayResponseDto,
  GatewaysService as GatewaysApiService,
  UpdateGatewayRequestDto,
} from '../../../generated/openapi/notip-management-api-openapi';
import { Gateway, GatewayUpdateResult } from '../../../core/models/gateway';
import { IMPERSONATION_STATUS, ImpersonationStatus } from '../../../core/auth/contracts';

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
        this.loadingSignal.set(false);
      }),
    );
  }

  getGatewayDetail(gatewayId: string): Observable<Gateway> {
    this.loadingSignal.set(true);

    return this.gatewaysApi.gatewaysControllerGetGatewayById(gatewayId).pipe(
      map((dto) => this.toGateway(dto)),
      tap((gateway) => {
        this.selectedGatewaySignal.set(gateway);
        this.loadingSignal.set(false);
      }),
    );
  }

  updateGatewayName(gatewayId: string, name: string): Observable<GatewayUpdateResult> {
    const body: UpdateGatewayRequestDto = { name };

    return this.gatewaysApi.gatewaysControllerUpdateGateway(gatewayId, body).pipe(
      map((dto) => ({
        id: dto.id,
        name: dto.name,
        status: dto.status,
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
    return {
      id: dto.id,
      name: dto.name,
      status: dto.status,
      lastSeenAt: dto.last_seen_at,
      provisioned: dto.provisioned,
      firmwareVersion: dto.firmware_version,
      sendFrequencyMs: dto.send_frequency_ms,
    };
  }
}
