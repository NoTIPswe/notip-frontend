import { TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole } from '../models/enums';
import { AuthService } from './auth.service';
import { ThresholdPrefetchService } from './threshold-prefetch.service';
import { ThresholdService } from './threshold.service';

describe('ThresholdPrefetchService', () => {
  let service: ThresholdPrefetchService;
  let logout$: Subject<void>;

  const authMock = {
    getRole: vi.fn(),
    getTenantId: vi.fn(),
    logout$: new Subject<void>(),
  };

  const thresholdMock = {
    fetchThresholds: vi.fn(),
    invalidateCache: vi.fn(),
  };

  beforeEach(async () => {
    vi.useFakeTimers();

    logout$ = new Subject<void>();
    authMock.logout$ = logout$;

    authMock.getRole.mockReset();
    authMock.getTenantId.mockReset();
    thresholdMock.fetchThresholds.mockReset();
    thresholdMock.invalidateCache.mockReset();

    authMock.getRole.mockReturnValue(UserRole.tenant_admin);
    authMock.getTenantId.mockReturnValue('tenant-1');
    thresholdMock.fetchThresholds.mockReturnValue(of([]));

    await TestBed.configureTestingModule({
      providers: [
        ThresholdPrefetchService,
        { provide: AuthService, useValue: authMock },
        { provide: ThresholdService, useValue: thresholdMock },
      ],
    }).compileComponents();

    service = TestBed.inject(ThresholdPrefetchService);
  });

  afterEach(() => {
    logout$.complete();
    vi.useRealTimers();
  });

  it('fetches immediately and then every five minutes after start', async () => {
    service.start();

    vi.advanceTimersByTime(0);
    await Promise.resolve();

    expect(thresholdMock.fetchThresholds).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(5 * 60 * 1000);
    await Promise.resolve();

    expect(thresholdMock.fetchThresholds).toHaveBeenCalledTimes(2);
  });

  it('does not start for system admin', async () => {
    authMock.getRole.mockReturnValue(UserRole.system_admin);

    service.start();

    vi.advanceTimersByTime(0);
    await Promise.resolve();

    expect(thresholdMock.fetchThresholds).not.toHaveBeenCalled();
  });

  it('does not start without tenant id', async () => {
    authMock.getTenantId.mockReturnValue('   ');

    service.start();

    vi.advanceTimersByTime(0);
    await Promise.resolve();

    expect(thresholdMock.fetchThresholds).not.toHaveBeenCalled();
  });

  it('keeps scheduler alive when a fetch fails', async () => {
    thresholdMock.fetchThresholds
      .mockReturnValueOnce(throwError(() => new Error('down')))
      .mockReturnValue(of([]));

    service.start();

    vi.advanceTimersByTime(0);
    await Promise.resolve();
    expect(thresholdMock.fetchThresholds).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(5 * 60 * 1000);
    await Promise.resolve();
    expect(thresholdMock.fetchThresholds).toHaveBeenCalledTimes(2);
  });

  it('stops polling and invalidates cache on logout', async () => {
    service.start();

    vi.advanceTimersByTime(0);
    await Promise.resolve();
    expect(thresholdMock.fetchThresholds).toHaveBeenCalledTimes(1);

    logout$.next();
    expect(thresholdMock.invalidateCache).toHaveBeenCalledOnce();

    vi.advanceTimersByTime(5 * 60 * 1000);
    await Promise.resolve();
    expect(thresholdMock.fetchThresholds).toHaveBeenCalledTimes(1);
  });
});
