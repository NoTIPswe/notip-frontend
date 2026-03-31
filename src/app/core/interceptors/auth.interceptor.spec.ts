import { HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { firstValueFrom, of } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  const authMock = {
    getToken: vi.fn(),
  };

  beforeEach(async () => {
    authMock.getToken.mockReset();

    await TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: authMock }],
    }).compileComponents();
  });

  it('forwards request unchanged when token is missing', async () => {
    authMock.getToken.mockResolvedValue(undefined);
    const req = new HttpRequest('GET', '/api/data');
    const next = vi.fn((forwardedReq: HttpRequest<unknown>) =>
      of(new HttpResponse({ status: 200, body: forwardedReq })),
    );

    await firstValueFrom(TestBed.runInInjectionContext(() => authInterceptor(req, next)));

    expect(next).toHaveBeenCalledOnce();
    const forwardedReq = next.mock.calls[0][0];
    expect(forwardedReq).toBe(req);
    expect(forwardedReq.headers.has('Authorization')).toBe(false);
  });

  it('adds bearer token when token is available', async () => {
    authMock.getToken.mockResolvedValue('abc123');
    const req = new HttpRequest('GET', '/api/data');
    const next = vi.fn((forwardedReq: HttpRequest<unknown>) =>
      of(new HttpResponse({ status: 200, body: forwardedReq })),
    );

    await firstValueFrom(TestBed.runInInjectionContext(() => authInterceptor(req, next)));

    expect(next).toHaveBeenCalledOnce();
    const forwardedReq = next.mock.calls[0][0];
    expect(forwardedReq).not.toBe(req);
    expect(forwardedReq.headers.get('Authorization')).toBe('Bearer abc123');
  });
});
