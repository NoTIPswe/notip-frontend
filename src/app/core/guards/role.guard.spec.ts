import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, UrlTree } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole } from '../models/enums';
import { AuthService } from '../services/auth.service';
import { RoleGuard } from './role.guard';

describe('RoleGuard', () => {
  let guard: RoleGuard;

  const unauthorizedTree = {} as UrlTree;
  const authMock = {
    getRole: vi.fn(),
  };
  const routerMock = {
    parseUrl: vi.fn(() => unauthorizedTree),
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

  it('returns unauthorized UrlTree when user role is not allowed', () => {
    authMock.getRole.mockReturnValue(UserRole.tenant_user);
    const route = {
      data: { roles: [UserRole.system_admin] },
    } as ActivatedRouteSnapshot;

    expect(guard.canActivate(route)).toBe(unauthorizedTree);
    expect(routerMock.parseUrl).toHaveBeenCalledWith('/error?reason=unauthorized');
  });
});
