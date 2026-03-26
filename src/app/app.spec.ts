import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { IMPERSONATION_STATUS, SESSION_LIFECYCLE } from './core/auth/contracts';
import { UserRole } from './core/models/enums';
import { AuthService } from './core/services/auth.service';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    const isImpersonatingSignal = signal(false);
    const sessionMock = {
      logout$: of(void 0),
      logout: () => undefined,
    };
    const authMock = {
      getRole: () => UserRole.tenant_user,
      getUsername: () => Promise.resolve('tester'),
      logout: () => undefined,
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
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
});
