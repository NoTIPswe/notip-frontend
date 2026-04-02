import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../services/auth.service';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  const authMock = {
    login: vi.fn(),
    setImpersonating: vi.fn(),
  };

  const routerMock = {
    navigateByUrl: vi.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    authMock.login.mockReset();
    authMock.setImpersonating.mockReset();
    routerMock.navigateByUrl.mockClear();

    await TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();
  });

  it('triggers login on 401 and rethrows error', async () => {
    const req = new HttpRequest('GET', '/api/data');
    const error = new HttpErrorResponse({ status: 401, url: req.url });
    const next = vi.fn(() => throwError(() => error));

    await expect(
      firstValueFrom(TestBed.runInInjectionContext(() => errorInterceptor(req, next))),
    ).rejects.toBe(error);

    expect(authMock.login).toHaveBeenCalledOnce();
    expect(authMock.setImpersonating).not.toHaveBeenCalled();
    expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
  });

  it('sets impersonation on 403 from mgmt keys endpoint and rethrows error', async () => {
    const req = new HttpRequest('GET', '/api/mgmt/keys/current');
    const error = new HttpErrorResponse({ status: 403, url: req.url });
    const next = vi.fn(() => throwError(() => error));

    await expect(
      firstValueFrom(TestBed.runInInjectionContext(() => errorInterceptor(req, next))),
    ).rejects.toBe(error);

    expect(authMock.setImpersonating).toHaveBeenCalledWith(true);
    expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
    expect(authMock.login).not.toHaveBeenCalled();
  });

  it('redirects to forbidden page on generic 403 and rethrows error', async () => {
    const req = new HttpRequest('GET', '/api/mgmt/users');
    const error = new HttpErrorResponse({ status: 403, url: req.url });
    const next = vi.fn(() => throwError(() => error));

    await expect(
      firstValueFrom(TestBed.runInInjectionContext(() => errorInterceptor(req, next))),
    ).rejects.toBe(error);

    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/error?reason=forbidden');
    expect(authMock.login).not.toHaveBeenCalled();
    expect(authMock.setImpersonating).not.toHaveBeenCalled();
  });

  it('rethrows non-http errors without side effects', async () => {
    const req = new HttpRequest('GET', '/api/data');
    const error = new Error('boom');
    const next = vi.fn(() => throwError(() => error));

    await expect(
      firstValueFrom(TestBed.runInInjectionContext(() => errorInterceptor(req, next))),
    ).rejects.toBe(error);

    expect(authMock.login).not.toHaveBeenCalled();
    expect(authMock.setImpersonating).not.toHaveBeenCalled();
    expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
  });
});
