import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IMPERSONATION_STATUS, SESSION_LIFECYCLE } from './core/auth/contracts';
import { UserRole } from './core/models/enums';
import { AuthService } from './core/services/auth.service';
import { App } from './app';

describe('App', () => {
  let authMock: {
    getRole: () => UserRole;
    getToken: () => Promise<string>;
    getUsername: () => Promise<string>;
    logout: () => void;
    openProfile: () => void;
    openPasswordChange: () => void;
    stopImpersonation: () => void;
  };

  beforeEach(async () => {
    const isImpersonatingSignal = signal(false);
    const sessionMock = {
      logout$: of(void 0),
      logout: () => undefined,
    };
    authMock = {
      getRole: () => UserRole.tenant_user,
      getToken: () => Promise.resolve('token'),
      getUsername: () => Promise.resolve('tester'),
      logout: () => undefined,
      openProfile: () => undefined,
      openPasswordChange: () => undefined,
      stopImpersonation: () => undefined,
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: SESSION_LIFECYCLE, useValue: sessionMock },
        {
          provide: IMPERSONATION_STATUS,
          useValue: { isImpersonating: isImpersonatingSignal.asReadonly() },
        },
        { provide: AuthService, useValue: authMock },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-sidebar')).toBeTruthy();
    expect(compiled.textContent).toContain('NoTIP');
  });

  it('refreshes identity from auth token flow', async () => {
    authMock.getRole = vi.fn(() => UserRole.tenant_admin);
    authMock.getToken = vi.fn(() => Promise.resolve('token'));
    authMock.getUsername = vi.fn(() => Promise.resolve('Alice'));

    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    await fixture.whenStable();

    expect(authMock.getToken).toHaveBeenCalled();
    expect(authMock.getUsername).toHaveBeenCalled();
    expect(app.role()).toBe(UserRole.tenant_admin);
    expect(app.username()).toBe('Alice');
  });

  it('falls back to default username when auth returns empty name', async () => {
    authMock.getRole = vi.fn(() => UserRole.tenant_user);
    authMock.getToken = vi.fn(() => Promise.resolve('token'));
    authMock.getUsername = vi.fn(() => Promise.resolve(''));

    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    await fixture.whenStable();

    expect(app.role()).toBe(UserRole.tenant_user);
    expect(app.username()).toBe('User');
  });

  it('stops impersonation and navigates to system admin view', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    const router = TestBed.inject(Router);
    const stopSpy = vi.spyOn(authMock, 'stopImpersonation');
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    app.onImpersonationStopRequested();

    expect(stopSpy).toHaveBeenCalledOnce();
    expect(navigateSpy).toHaveBeenCalledWith(['/admin/tenants']);
  });

  it('calls logout handler on auth service', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    const logoutSpy = vi.spyOn(authMock, 'logout');

    app.onLogout();

    expect(logoutSpy).toHaveBeenCalledOnce();
  });

  it('calls profile handler on auth service', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    const openProfileSpy = vi.spyOn(authMock, 'openProfile');

    app.onProfileOpen();

    expect(openProfileSpy).toHaveBeenCalledOnce();
  });

  it('calls password change handler on auth service', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    const openPasswordChangeSpy = vi.spyOn(authMock, 'openPasswordChange');

    app.onPasswordChange();

    expect(openPasswordChangeSpy).toHaveBeenCalledOnce();
  });

  it('falls back to default identity when token refresh fails', async () => {
    authMock.getRole = vi.fn(() => UserRole.system_admin);
    authMock.getToken = vi.fn(() => Promise.reject(new Error('token error')));
    authMock.getUsername = vi.fn(() => Promise.resolve('should-not-be-used'));

    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    await fixture.whenStable();

    expect(app.role()).toBe(UserRole.system_admin);
    expect(app.username()).toBe('User');
    expect(authMock.getUsername).not.toHaveBeenCalled();
  });
});
