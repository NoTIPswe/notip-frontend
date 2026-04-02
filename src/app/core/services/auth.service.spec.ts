import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KEYCLOAK_EVENT_SIGNAL, KeycloakEventType } from 'keycloak-angular';
import Keycloak from 'keycloak-js';
import { AuthService as AuthApiService } from '../../generated/openapi/notip-management-api-openapi';
import { UserRole } from '../models/enums';
import { AuthService } from './auth.service';

interface EventLike {
  type: KeycloakEventType;
}

function createUnsignedJwt(payload: Record<string, unknown>): string {
  const encode = (value: Record<string, unknown>) => {
    const base64 = globalThis.btoa(JSON.stringify(value));
    let base64url = base64.replaceAll('+', '-').replaceAll('/', '_');
    while (base64url.endsWith('=')) {
      base64url = base64url.slice(0, -1);
    }

    return base64url;
  };

  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.`;
}

describe('AuthService', () => {
  let service: AuthService;
  const eventSignal = signal<EventLike>({ type: KeycloakEventType.KeycloakAngularNotInitialized });

  const keycloakMock = {
    authenticated: false,
    token: '',
    tokenParsed: undefined as unknown,
    login: vi.fn(),
    logout: vi.fn(),
    updateToken: vi.fn(),
  };

  const authApiMock = {
    authControllerImpersonate: vi.fn(),
  };

  beforeEach(async () => {
    eventSignal.set({ type: KeycloakEventType.KeycloakAngularNotInitialized });
    keycloakMock.authenticated = false;
    keycloakMock.token = '';
    keycloakMock.tokenParsed = undefined;
    keycloakMock.login.mockReset();
    keycloakMock.logout.mockReset();
    keycloakMock.updateToken.mockReset();
    authApiMock.authControllerImpersonate.mockReset();

    await TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Keycloak, useValue: keycloakMock },
        { provide: KEYCLOAK_EVENT_SIGNAL, useValue: eventSignal },
        { provide: AuthApiService, useValue: authApiMock },
      ],
    }).compileComponents();

    service = TestBed.inject(AuthService);
  });

  it('returns authentication state from init', async () => {
    keycloakMock.authenticated = true;
    await expect(service.init()).resolves.toBe(true);

    keycloakMock.authenticated = false;
    await expect(service.init()).resolves.toBe(false);
  });

  it('runs login and logout flow', () => {
    const logoutEvents: number[] = [];
    const sub = service.logout$.subscribe(() => logoutEvents.push(1));

    keycloakMock.logout.mockResolvedValue(undefined);

    service.setImpersonating(true);
    service.login();
    service.logout();

    expect(keycloakMock.login).toHaveBeenCalledOnce();
    expect(keycloakMock.logout).toHaveBeenCalledWith({
      redirectUri: globalThis.location.origin,
    });
    expect(service.isImpersonating()).toBe(false);
    expect(logoutEvents.length).toBe(1);

    sub.unsubscribe();
  });

  it('resets impersonation when Keycloak emits AuthLogout event', () => {
    const logoutEvents: number[] = [];
    const sub = service.logout$.subscribe(() => logoutEvents.push(1));

    service.setImpersonating(true);
    eventSignal.set({ type: KeycloakEventType.AuthLogout });
    TestBed.flushEffects();

    expect(service.isImpersonating()).toBe(false);
    expect(logoutEvents.length).toBe(1);

    sub.unsubscribe();
  });

  it('returns token when authenticated and refresh succeeds', async () => {
    keycloakMock.authenticated = true;
    keycloakMock.token = 'token-123';
    keycloakMock.updateToken.mockResolvedValue(true);

    await expect(service.getToken()).resolves.toBe('token-123');
    expect(keycloakMock.updateToken).toHaveBeenCalledWith(30);
  });

  it('returns current token when refresh fails', async () => {
    keycloakMock.authenticated = true;
    keycloakMock.token = 'stale-token';
    keycloakMock.updateToken.mockRejectedValue(new Error('refresh failed'));

    await expect(service.getToken()).resolves.toBe('stale-token');
  });

  it('returns empty token when user is not authenticated', async () => {
    keycloakMock.authenticated = false;
    keycloakMock.token = 'ignored';

    await expect(service.getToken()).resolves.toBe('');
    expect(keycloakMock.updateToken).not.toHaveBeenCalled();
  });

  it('maps identity and role from JWT payload', async () => {
    keycloakMock.tokenParsed = {
      given_name: 'Alice',
      family_name: 'Rossi',
      preferred_username: 'alice',
      tenant_id: 'tenant-1',
      sub: 'user-1',
      role: 'tenant_admin',
    };

    await expect(service.getUsername()).resolves.toBe('Alice Rossi');
    expect(service.getTenantId()).toBe('tenant-1');
    expect(service.getUserId()).toBe('user-1');
    expect(service.getRole()).toBe(UserRole.tenant_admin);

    keycloakMock.tokenParsed = {
      realm_access: { roles: ['system_admin'] },
    };
    expect(service.getRole()).toBe(UserRole.system_admin);

    keycloakMock.tokenParsed = {
      role: 'system_admin',
    };
    expect(service.getRole()).toBe(UserRole.system_admin);

    keycloakMock.tokenParsed = {
      realm_access: { roles: ['tenant_admin'] },
    };
    expect(service.getRole()).toBe(UserRole.tenant_admin);

    keycloakMock.tokenParsed = {
      resource_access: {
        'notip-mgmt-backend': { roles: ['system_admin'] },
      },
    };
    expect(service.getRole()).toBe(UserRole.system_admin);

    keycloakMock.tokenParsed = {};
    expect(service.getRole()).toBe(UserRole.tenant_user);
  });

  it('falls back to name and preferred_username when first and last name are missing', async () => {
    keycloakMock.tokenParsed = {
      name: 'Mario Bianchi',
      preferred_username: 'mario.bianchi',
    };

    await expect(service.getUsername()).resolves.toBe('Mario Bianchi');

    keycloakMock.tokenParsed = {
      preferred_username: 'legacy.username',
    };

    await expect(service.getUsername()).resolves.toBe('legacy.username');
  });

  it('returns empty identity fields when JWT payload is missing', async () => {
    keycloakMock.tokenParsed = undefined;

    await expect(service.getUsername()).resolves.toBe('');
    expect(service.getTenantId()).toBe('');
    expect(service.getUserId()).toBe('');
  });

  it('starts impersonation and returns issued access token', async () => {
    const impersonatedToken = createUnsignedJwt({
      sub: 'impersonated-user',
      given_name: 'Impersonated',
      family_name: 'User',
      preferred_username: 'impersonated.name',
      tenant_id: 'tenant-77',
      realm_access: { roles: ['tenant_admin'] },
    });

    authApiMock.authControllerImpersonate.mockReturnValue(of({ access_token: impersonatedToken }));

    await expect(firstValueFrom(service.startImpersonation('target-1'))).resolves.toBe(
      impersonatedToken,
    );
    expect(authApiMock.authControllerImpersonate).toHaveBeenCalledWith({ user_id: 'target-1' });
    expect(service.isImpersonating()).toBe(true);
    await expect(service.getToken()).resolves.toBe(impersonatedToken);
    await expect(service.getUsername()).resolves.toBe('Impersonated User');
    expect(service.getTenantId()).toBe('tenant-77');
    expect(service.getUserId()).toBe('impersonated-user');
    expect(service.getRole()).toBe(UserRole.tenant_admin);
  });

  it('returns empty token when impersonation response has no access token', async () => {
    authApiMock.authControllerImpersonate.mockReturnValue(of({}));

    await expect(firstValueFrom(service.startImpersonation('target-2'))).resolves.toBe('');
    expect(service.isImpersonating()).toBe(false);
  });
});
