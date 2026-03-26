import { Injectable, signal, inject } from '@angular/core';
import { Observable, Subject, map } from 'rxjs';
import { AuthService as AuthApiService } from '../../generated/openapi/notip-management-api-openapi';
import { ImpersonationStatus, SessionLifeCycle } from '../auth/contracts';
import { UserRole } from '../models/enums';

interface JwtPayload {
  sub?: string;
  preferred_username?: string;
  tenant_id?: string;
  role?: UserRole;
}

@Injectable({ providedIn: 'root' })
export class AuthService implements SessionLifeCycle, ImpersonationStatus {
  private readonly authApi = inject(AuthApiService);

  private readonly logoutSubject = new Subject<void>();
  private readonly impersonatingSignal = signal(false);

  readonly logout$: Observable<void> = this.logoutSubject.asObservable();
  readonly isImpersonating = this.impersonatingSignal.asReadonly();

  init(): Promise<boolean> {
    return Promise.resolve(true);
  }

  login(): void {
    // Actual OIDC redirect is environment-specific and will be wired via keycloak-angular.
  }

  logout(): void {
    this.logoutSubject.next();
  }

  getToken(): Promise<string> {
    return Promise.resolve(localStorage.getItem('access_token') ?? '');
  }

  getUsername(): Promise<string> {
    return Promise.resolve(this.decodeJwtPayload().preferred_username ?? '');
  }

  getRole(): UserRole {
    const role = this.decodeJwtPayload().role;
    if (role === UserRole.system_admin || role === UserRole.tenant_admin) {
      return role;
    }

    return UserRole.tenant_user;
  }

  getTenantId(): string {
    return this.decodeJwtPayload().tenant_id ?? '';
  }

  getUserId(): string {
    return this.decodeJwtPayload().sub ?? '';
  }

  setImpersonating(value: boolean): void {
    this.impersonatingSignal.set(value);
  }

  startImpersonation(targetUserId: string): Observable<string> {
    return this.authApi
      .authControllerImpersonate({ user_id: targetUserId })
      .pipe(map((res) => res.access_token ?? ''));
  }

  private decodeJwtPayload(): JwtPayload {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return {};
    }

    const payloadPart = token.split('.')[1];
    if (!payloadPart) {
      return {};
    }

    try {
      const normalized = payloadPart.replaceAll('-', '+').replaceAll('_', '/');
      const decoded = atob(normalized);
      return JSON.parse(decoded) as JwtPayload;
    } catch {
      return {};
    }
  }
}
