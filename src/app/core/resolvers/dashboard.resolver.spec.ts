import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../services/auth.service';
import { DashboardResolver } from './dashboard.resolver';

describe('DashboardResolver', () => {
  let resolver: DashboardResolver;

  const authMock = {
    isImpersonating: vi.fn<() => boolean>(),
  };

  beforeEach(async () => {
    authMock.isImpersonating.mockReset();

    await TestBed.configureTestingModule({
      providers: [DashboardResolver, { provide: AuthService, useValue: authMock }],
    }).compileComponents();

    resolver = TestBed.inject(DashboardResolver);
  });

  it('resolves clear mode when the user is not impersonating', async () => {
    authMock.isImpersonating.mockReturnValue(false);

    await expect(firstValueFrom(resolver.resolve())).resolves.toBe('clear');
  });

  it('resolves obfuscated mode when the user is impersonating', async () => {
    authMock.isImpersonating.mockReturnValue(true);

    await expect(firstValueFrom(resolver.resolve())).resolves.toBe('obfuscated');
  });
});
