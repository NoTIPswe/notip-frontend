import { Injectable, effect, signal, inject } from '@angular/core';
import { Observable, Subject, map } from 'rxjs';
import { KEYCLOAK_EVENT_SIGNAL, KeycloakEventType } from 'keycloak-angular';
import Keycloak from 'keycloak-js';
import { AuthService as AuthApiService } from '../../generated/openapi/notip-management-api-openapi';
import { ImpersonationStatus, SessionLifeCycle } from '../auth/contracts';
import { UserRole } from '../models/enums';

interface JwtPayload {
  sub?: string;
  preferred_username?: string;
  tenant_id?: string;
  role?: string;
  realm_access?: {
    roles?: string[];
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService implements SessionLifeCycle, ImpersonationStatus {
  private readonly keycloak = inject(Keycloak);
  private readonly keycloakEventSignal = inject(KEYCLOAK_EVENT_SIGNAL);
  private readonly authApi = inject(AuthApiService);

  private readonly logoutSubject = new Subject<void>();
  private readonly impersonatingSignal = signal(false);

  readonly logout$: Observable<void> = this.logoutSubject.asObservable();
  readonly isImpersonating = this.impersonatingSignal.asReadonly();

  constructor() {
    effect(() => {
      const event = this.keycloakEventSignal();
      if (event.type === KeycloakEventType.AuthLogout) {
        this.impersonatingSignal.set(false);
        this.logoutSubject.next();
      }
    });
  }

  init(): Promise<boolean> {
    return Promise.resolve(Boolean(this.keycloak.authenticated));
  }

  login(): void {
    void this.keycloak.login();
  }

  logout(): void {
    this.impersonatingSignal.set(false);
    this.logoutSubject.next();
    void this.keycloak.logout({ redirectUri: globalThis.location.origin });
  }

  async getToken(): Promise<string> {
    if (!this.keycloak.authenticated) {
      return '';
    }

    try {
      await this.keycloak.updateToken(30);
    } catch {
      return this.keycloak.token ?? '';
    }

    return this.keycloak.token ?? '';
  }

  getUsername(): Promise<string> {
    return Promise.resolve(this.decodeJwtPayload().preferred_username ?? '');
  }

  getRole(): UserRole {
    const payload = this.decodeJwtPayload();
    const role = payload.role;
    if (role === UserRole.system_admin || role === UserRole.tenant_admin) {
      return role as UserRole;
    }

    const realmRoles = payload.realm_access?.roles ?? [];
    if (realmRoles.includes(UserRole.system_admin)) {
      return UserRole.system_admin;
    }
    if (realmRoles.includes(UserRole.tenant_admin)) {
      return UserRole.tenant_admin;
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
    const parsed = this.keycloak.tokenParsed as JwtPayload | undefined;
    return parsed ?? {};
  }
}
