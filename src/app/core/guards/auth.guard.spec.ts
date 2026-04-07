import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../services/auth.service';
import { ThresholdPrefetchService } from '../services/threshold-prefetch.service';
import { AuthGuard } from './auth.guard';

describe('AuthGuard', () => {
  let guard: AuthGuard;

  const authMock = {
    init: vi.fn(),
    getToken: vi.fn(),
    login: vi.fn(),
  };

  const thresholdPrefetchMock = {
    start: vi.fn(),
  };

  beforeEach(async () => {
    authMock.init.mockReset();
    authMock.getToken.mockReset();
    authMock.login.mockReset();
    thresholdPrefetchMock.start.mockReset();

    await TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authMock },
        { provide: ThresholdPrefetchService, useValue: thresholdPrefetchMock },
      ],
    }).compileComponents();

    guard = TestBed.inject(AuthGuard);
  });

  it('returns false and triggers login when auth init fails', async () => {
    authMock.init.mockResolvedValue(false);

    await expect(guard.canActivate()).resolves.toBe(false);
    expect(authMock.login).toHaveBeenCalledOnce();
    expect(authMock.getToken).not.toHaveBeenCalled();
    expect(thresholdPrefetchMock.start).not.toHaveBeenCalled();
  });

  it('returns false and triggers login when token is missing', async () => {
    authMock.init.mockResolvedValue(true);
    authMock.getToken.mockResolvedValue(undefined);

    await expect(guard.canActivate()).resolves.toBe(false);
    expect(authMock.login).toHaveBeenCalledOnce();
    expect(thresholdPrefetchMock.start).not.toHaveBeenCalled();
  });

  it('returns true when init succeeds and token exists', async () => {
    authMock.init.mockResolvedValue(true);
    authMock.getToken.mockResolvedValue('access-token');

    await expect(guard.canActivate()).resolves.toBe(true);
    expect(authMock.login).not.toHaveBeenCalled();
    expect(thresholdPrefetchMock.start).toHaveBeenCalledOnce();
  });
});
