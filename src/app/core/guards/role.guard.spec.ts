import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole } from '../models/enums';
import { AuthService } from '../services/auth.service';
import { HomeRedirectGuard, RoleGuard } from './role.guard';

describe('RoleGuard', () => {
  let guard: RoleGuard;

  const dashboardTree = {} as UrlTree;
  const adminTenantsTree = {} as UrlTree;
  const authMock = {
    getRole: vi.fn(),
  };
  const routerMock = {
    parseUrl: vi.fn((url: string) => {
      if (url === '/admin/tenants') {
        return adminTenantsTree;
      }

      return dashboardTree;
    }),
  };

  beforeEach(async () => {
    authMock.getRole.mockReset();
    routerMock.parseUrl.mockClear();

    await TestBed.configureTestingModule({
      providers: [
        RoleGuard,
        { provide: AuthService, useValue: authMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    guard = TestBed.inject(RoleGuard);
  });

  it('allows activation when route has no role constraints', () => {
    authMock.getRole.mockReturnValue(UserRole.tenant_user);
    const route = { data: {} } as ActivatedRouteSnapshot;

    expect(guard.canActivate(route)).toBe(true);
    expect(routerMock.parseUrl).not.toHaveBeenCalled();
  });

  it('allows activation when user role is listed in allowed roles', () => {
    authMock.getRole.mockReturnValue(UserRole.system_admin);
    const route = {
      data: { roles: [UserRole.tenant_user, UserRole.system_admin] },
    } as ActivatedRouteSnapshot;

    expect(guard.canActivate(route)).toBe(true);
    expect(routerMock.parseUrl).not.toHaveBeenCalled();
  });

  it('redirects tenant user to dashboard when route role is not allowed', () => {
    authMock.getRole.mockReturnValue(UserRole.tenant_user);
    const route = {
      data: { roles: [UserRole.system_admin] },
    } as ActivatedRouteSnapshot;

    expect(guard.canActivate(route)).toBe(dashboardTree);
    expect(routerMock.parseUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('redirects system admin to tenant list when route role is not allowed', () => {
    authMock.getRole.mockReturnValue(UserRole.system_admin);
    const route = {
      data: { roles: [UserRole.tenant_user, UserRole.tenant_admin] },
    } as ActivatedRouteSnapshot;

    expect(guard.canActivate(route)).toBe(adminTenantsTree);
    expect(routerMock.parseUrl).toHaveBeenCalledWith('/admin/tenants');
  });

  it('allows tenant routes while impersonating via tenant_admin role', () => {
    authMock.getRole.mockReturnValue(UserRole.tenant_admin);
    const route = {
      data: { roles: [UserRole.tenant_user, UserRole.tenant_admin] },
    } as ActivatedRouteSnapshot;

    expect(guard.canActivate(route)).toBe(true);
    expect(routerMock.parseUrl).not.toHaveBeenCalled();
  });
});

describe('HomeRedirectGuard', () => {
  let guard: HomeRedirectGuard;

  const dashboardTree = {} as UrlTree;
  const adminTenantsTree = {} as UrlTree;
  const authMock = {
    getRole: vi.fn(),
  };
  const routerMock = {
    parseUrl: vi.fn((url: string) => {
      if (url === '/admin/tenants') {
        return adminTenantsTree;
      }

      return dashboardTree;
    }),
  };

  beforeEach(async () => {
    authMock.getRole.mockReset();
    routerMock.parseUrl.mockClear();

    await TestBed.configureTestingModule({
      providers: [
        HomeRedirectGuard,
        { provide: AuthService, useValue: authMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    guard = TestBed.inject(HomeRedirectGuard);
  });

  it('redirects system_admin to tenant manager', () => {
    authMock.getRole.mockReturnValue(UserRole.system_admin);

    expect(guard.canActivate()).toBe(adminTenantsTree);
    expect(routerMock.parseUrl).toHaveBeenCalledWith('/admin/tenants');
  });

  it('redirects tenant roles to dashboard', () => {
    authMock.getRole.mockReturnValue(UserRole.tenant_admin);

    expect(guard.canActivate()).toBe(dashboardTree);
    expect(routerMock.parseUrl).toHaveBeenCalledWith('/dashboard');

    routerMock.parseUrl.mockClear();
    authMock.getRole.mockReturnValue(UserRole.tenant_user);

    expect(guard.canActivate()).toBe(dashboardTree);
    expect(routerMock.parseUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('redirects impersonating users to dashboard', () => {
    authMock.getRole.mockReturnValue(UserRole.tenant_admin);

    expect(guard.canActivate()).toBe(dashboardTree);
    expect(routerMock.parseUrl).toHaveBeenCalledWith('/dashboard');
  });
});
