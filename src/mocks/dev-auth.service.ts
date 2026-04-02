import { Injectable, signal } from '@angular/core';
import { Observable, NEVER, of } from 'rxjs';
import { ImpersonationStatus, SessionLifeCycle } from '../app/core/auth/contracts';
import { UserRole } from '../app/core/models/enums';

/**
 * Drop-in replacement for AuthService used in the MSW dev mode.
 * Satisfies SESSION_LIFECYCLE and IMPERSONATION_STATUS contracts without Keycloak.
 */
@Injectable()
export class DevAuthService implements SessionLifeCycle, ImpersonationStatus {
  readonly logout$: Observable<void> = NEVER;

  private readonly _isImpersonating = signal(false);
  readonly isImpersonating = this._isImpersonating.asReadonly();

  logout(): void {}

  login(): void {}

  init(): Promise<boolean> {
    return Promise.resolve(true);
  }

  getToken(): Promise<string> {
    return Promise.resolve('dev-mock-token');
  }

  getUsername(): Promise<string> {
    return Promise.resolve('dev.admin');
  }

  getRole(): UserRole {
    return UserRole.system_admin;
  }

  getTenantId(): string {
    return 'tenant-alpha';
  }

  getUserId(): string {
    return 'dev-user-id';
  }

  setImpersonating(value: boolean): void {
    this._isImpersonating.set(value);
  }

  startImpersonation(targetUserId: string): Observable<string> {
    void targetUserId;
    return of('mock-impersonation-token');
  }
}
