import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable, of } from 'rxjs';
import { KeysResponseDto, KeysService } from '../../generated/openapi/notip-management-api-openapi';
import { IMPERSONATION_STATUS, ImpersonationStatus } from '../auth/contracts';
import { GatewayKeyMap } from '../models/measure';

@Injectable({ providedIn: 'root' })
export class CryptoKeyService {
  private readonly keysApi = inject(KeysService);
  private readonly impersonationStatus = inject<ImpersonationStatus>(IMPERSONATION_STATUS);

  private readonly versions = new Map<string, number>();

  fetchKeys(ids: string[]): Observable<GatewayKeyMap> {
    if (this.impersonationStatus.isImpersonating()) {
      return of({});
    }

    if (ids.length === 0) {
      return of({});
    }

    return forkJoin(ids.map((id) => this.keysApi.keysControllerGetKeys(id))).pipe(
      map((responses) => responses.flat()),
      map((rows) => this.toGatewayKeyMap(rows)),
    );
  }

  fetchAllKeys(): Observable<GatewayKeyMap> {
    if (this.impersonationStatus.isImpersonating()) {
      return of({});
    }

    return this.keysApi.keysControllerGetKeys('').pipe(map((rows) => this.toGatewayKeyMap(rows)));
  }

  getCachedVersion(id: string): number | null {
    return this.versions.get(id) ?? null;
  }

  invalidateCache(id?: string): void {
    if (!id) {
      this.versions.clear();
      return;
    }

    this.versions.delete(id);
  }

  private toGatewayKeyMap(rows: KeysResponseDto[]): GatewayKeyMap {
    const mapResult: GatewayKeyMap = {};
    for (const row of rows) {
      mapResult[row.gateway_id] = row.key_material;
      this.versions.set(row.gateway_id, row.key_version);
    }

    return mapResult;
  }
}
