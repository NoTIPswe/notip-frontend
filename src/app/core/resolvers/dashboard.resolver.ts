import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Resolve, Router } from '@angular/router';
import { Observable, catchError, map, of, retry, switchMap, throwError, timer } from 'rxjs';
import { GatewaysService as GatewaysApiService } from '../../generated/openapi/notip-management-api-openapi';
import { AuthService } from '../services/auth.service';
import { CryptoKeyService } from '../services/crypto-key.service';
import { WorkerOrchestratorService } from '../services/worker-orchestrator.service';

@Injectable({ providedIn: 'root' })
export class DashboardResolver implements Resolve<boolean> {
  private readonly gatewaysApi = inject(GatewaysApiService);
  private readonly cryptoKeyService = inject(CryptoKeyService);
  private readonly workerOrchestrator = inject(WorkerOrchestratorService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  resolve(): Observable<boolean> {
    return this.gatewaysApi.gatewaysControllerGetGateways().pipe(
      map((rows) => rows.map((item) => item.id)),
      catchError(() => {
        void this.router.navigateByUrl('/error?reason=gateway-fetch-failed');
        return of([] as string[]);
      }),
      switchMap((gatewayIds) => this.fetchKeysWithPolicy(gatewayIds)),
      switchMap((keys) => {
        if (Object.keys(keys).length === 0) {
          return of(true);
        }

        return this.workerOrchestrator.initializeKeys(keys).pipe(
          map(() => true),
          catchError(() => {
            void this.router.navigateByUrl('/error?reason=worker-init-failed');
            return of(false);
          }),
        );
      }),
    );
  }

  private fetchKeysWithPolicy(gatewayIds: string[]): Observable<Record<string, string>> {
    return this.cryptoKeyService.fetchKeys(gatewayIds).pipe(
      retry({
        count: 3,
        delay: (error: unknown, retryCount: number) => {
          if (error instanceof HttpErrorResponse && error.status >= 500) {
            return timer(300 * 2 ** (retryCount - 1));
          }

          return throwError(() => error);
        },
      }),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 403) {
          this.auth.setImpersonating(true);
          return of({});
        }

        if (error instanceof HttpErrorResponse && error.status >= 500) {
          return of({});
        }

        return of({});
      }),
    );
  }
}
