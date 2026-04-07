import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { errorInterceptor } from './error.interceptor';

describe('errorInterceptor', () => {
  const routerMock = {
    url: '/dashboard',
    navigateByUrl: vi.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    routerMock.navigateByUrl.mockClear();
    routerMock.url = '/dashboard';

    await TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: routerMock }],
    }).compileComponents();
  });

  it('redirects to unauthorized error page on 401 and rethrows error', async () => {
    const req = new HttpRequest('GET', '/api/data');
    const error = new HttpErrorResponse({ status: 401, url: req.url });
    const next = vi.fn(() => throwError(() => error));

    await expect(
      firstValueFrom(TestBed.runInInjectionContext(() => errorInterceptor(req, next))),
    ).rejects.toBe(error);

    expect(routerMock.navigateByUrl).toHaveBeenCalledWith(
      '/error?reason=unauthorized&retryUrl=%2Fdashboard',
    );
  });

  it('does not redirect again on 401 when already on error page', async () => {
    routerMock.url = '/error?reason=unauthorized&retryUrl=%2Fdashboard';
    const req = new HttpRequest('GET', '/api/data');
    const error = new HttpErrorResponse({ status: 401, url: req.url });
    const next = vi.fn(() => throwError(() => error));

    await expect(
      firstValueFrom(TestBed.runInInjectionContext(() => errorInterceptor(req, next))),
    ).rejects.toBe(error);

    expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
  });

  it('does not redirect again on 401 when already on nested error route', async () => {
    routerMock.url = '/error/forbidden';
    const req = new HttpRequest('GET', '/api/data');
    const error = new HttpErrorResponse({ status: 401, url: req.url });
    const next = vi.fn(() => throwError(() => error));

    await expect(
      firstValueFrom(TestBed.runInInjectionContext(() => errorInterceptor(req, next))),
    ).rejects.toBe(error);

    expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
  });

  it('uses root retry url on 401 when current route is empty', async () => {
    routerMock.url = '';
    const req = new HttpRequest('GET', '/api/data');
    const error = new HttpErrorResponse({ status: 401, url: req.url });
    const next = vi.fn(() => throwError(() => error));

    await expect(
      firstValueFrom(TestBed.runInInjectionContext(() => errorInterceptor(req, next))),
    ).rejects.toBe(error);

    expect(routerMock.navigateByUrl).toHaveBeenCalledWith(
      '/error?reason=unauthorized&retryUrl=%2F',
    );
  });

  it('uses root retry url on 401 when current route is not absolute', async () => {
    routerMock.url = 'dashboard';
    const req = new HttpRequest('GET', '/api/data');
    const error = new HttpErrorResponse({ status: 401, url: req.url });
    const next = vi.fn(() => throwError(() => error));

    await expect(
      firstValueFrom(TestBed.runInInjectionContext(() => errorInterceptor(req, next))),
    ).rejects.toBe(error);

    expect(routerMock.navigateByUrl).toHaveBeenCalledWith(
      '/error?reason=unauthorized&retryUrl=%2F',
    );
  });

  it('redirects to forbidden page on 403 from mgmt keys endpoint and rethrows error', async () => {
    const req = new HttpRequest('GET', '/api/mgmt/keys/current');
    const error = new HttpErrorResponse({ status: 403, url: req.url });
    const next = vi.fn(() => throwError(() => error));

    await expect(
      firstValueFrom(TestBed.runInInjectionContext(() => errorInterceptor(req, next))),
    ).rejects.toBe(error);

    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/error?reason=forbidden');
  });

  it('redirects to forbidden page on generic 403 and rethrows error', async () => {
    const req = new HttpRequest('GET', '/api/mgmt/users');
    const error = new HttpErrorResponse({ status: 403, url: req.url });
    const next = vi.fn(() => throwError(() => error));

    await expect(
      firstValueFrom(TestBed.runInInjectionContext(() => errorInterceptor(req, next))),
    ).rejects.toBe(error);

    expect(routerMock.navigateByUrl).toHaveBeenCalledWith('/error?reason=forbidden');
  });

  it('rethrows non-http errors without side effects', async () => {
    const req = new HttpRequest('GET', '/api/data');
    const error = new Error('boom');
    const next = vi.fn(() => throwError(() => error));

    await expect(
      firstValueFrom(TestBed.runInInjectionContext(() => errorInterceptor(req, next))),
    ).rejects.toBe(error);

    expect(routerMock.navigateByUrl).not.toHaveBeenCalled();
  });
});
