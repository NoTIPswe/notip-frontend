import { Injectable, effect, signal, inject } from '@angular/core';
import { Observable, Subject, map } from 'rxjs';
import { KEYCLOAK_EVENT_SIGNAL, KeycloakEventType } from 'keycloak-angular';
import Keycloak from 'keycloak-js';
import { AuthService as AuthApiService } from '../../generated/openapi/notip-management-api-openapi';
import { ImpersonationStatus, SessionLifeCycle } from '../auth/contracts';
import { UserRole } from '../models/enums';

interface JwtPayload {
  sub?: string;
  username?: string;
  name?: string;
  preferred_username?: string;
  tenant_id?: string;
  role?: string;
  realm_access?: {
    roles?: string[];
  };
  resource_access?: Record<string, { roles?: string[] }>;
}

@Injectable({ providedIn: 'root' })
export class AuthService implements SessionLifeCycle, ImpersonationStatus {
  private readonly keycloak = inject(Keycloak);
  private readonly keycloakEventSignal = inject(KEYCLOAK_EVENT_SIGNAL);
  private readonly authApi = inject(AuthApiService);

  private readonly logoutSubject = new Subject<void>();
  private readonly impersonatingSignal = signal(false);
  private readonly impersonationTokenSignal = signal<string | null>(null);
  private readonly impersonationPayloadSignal = signal<JwtPayload | null>(null);

  readonly logout$: Observable<void> = this.logoutSubject.asObservable();
  readonly isImpersonating = this.impersonatingSignal.asReadonly();

  constructor() {
    effect(() => {
      const event = this.keycloakEventSignal();
      if (event.type === KeycloakEventType.AuthLogout) {
        this.clearImpersonationContext();
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
    this.clearImpersonationContext();
    this.impersonatingSignal.set(false);
    this.logoutSubject.next();
    void this.keycloak.logout({ redirectUri: globalThis.location.origin });
  }

  async getToken(): Promise<string> {
    const impersonationToken = this.impersonationTokenSignal();
    if (impersonationToken) {
      return impersonationToken;
    }

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
    const payload = this.decodeJwtPayload();
    const preferredUsername = payload.preferred_username?.trim();
    if (preferredUsername) {
      return Promise.resolve(preferredUsername);
    }

    const username = payload.username?.trim();
    if (username) {
      return Promise.resolve(username);
    }

    return Promise.resolve(payload.name?.trim() ?? '');
  }

  getRole(): UserRole {
    const payload = this.decodeJwtPayload();
    const roles = this.collectRoles(payload);

    if (roles.has(UserRole.system_admin)) {
      return UserRole.system_admin;
    }
    if (roles.has(UserRole.tenant_admin)) {
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
    if (!value) {
      this.clearImpersonationContext();
    }

    this.impersonatingSignal.set(value);
  }

  startImpersonation(targetUserId: string): Observable<string> {
    return this.authApi.authControllerImpersonate({ user_id: targetUserId }).pipe(
      map((res) => {
        const token = res.access_token ?? '';
        if (!token) {
          return '';
        }

        this.impersonationTokenSignal.set(token);
        this.impersonationPayloadSignal.set(this.decodeTokenPayload(token));
        this.impersonatingSignal.set(true);

        return token;
      }),
    );
  }

  private collectRoles(payload: JwtPayload): Set<string> {
    const roles = new Set<string>();

    if (payload.role) {
      roles.add(payload.role);
    }

    for (const role of payload.realm_access?.roles ?? []) {
      roles.add(role);
    }

    for (const resource of Object.values(payload.resource_access ?? {})) {
      for (const role of resource.roles ?? []) {
        roles.add(role);
      }
    }

    return roles;
  }

  private clearImpersonationContext(): void {
    this.impersonationTokenSignal.set(null);
    this.impersonationPayloadSignal.set(null);
  }

  private decodeTokenPayload(token: string): JwtPayload | null {
    const segments = token.split('.');
    if (segments.length < 2 || typeof globalThis.atob !== 'function') {
      return null;
    }

    try {
      const normalizedBase64 = this.normalizeBase64(segments[1]);
      const decoded = globalThis.atob(normalizedBase64);
      const parsed = JSON.parse(decoded) as unknown;
      return this.asJwtPayload(parsed);
    } catch {
      return null;
    }
  }

  private normalizeBase64(value: string): string {
    const base64 = value.replaceAll('-', '+').replaceAll('_', '/');
    const paddingLength = (4 - (base64.length % 4)) % 4;
    return `${base64}${'='.repeat(paddingLength)}`;
  }

  private asJwtPayload(value: unknown): JwtPayload | null {
    if (typeof value === 'object' && value !== null) {
      return value as JwtPayload;
    }

    return null;
  }

  private decodeJwtPayload(): JwtPayload {
    const impersonationPayload = this.impersonationPayloadSignal();
    if (impersonationPayload) {
      return impersonationPayload;
    }

    const parsed = this.keycloak.tokenParsed as JwtPayload | undefined;
    return parsed ?? {};
  }
}
