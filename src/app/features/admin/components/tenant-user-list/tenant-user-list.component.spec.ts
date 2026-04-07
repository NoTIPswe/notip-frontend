import { By } from '@angular/platform-browser';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole } from '../../../../core/models/enums';
import { ObfuscatedUser } from '../../../../core/models/user';
import { AuthService } from '../../../../core/services/auth.service';
import { TenantUserListComponent } from './tenant-user-list.component';

describe('TenantUserListComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TenantUserListComponent>>;
  let component: TenantUserListComponent;

  const users: ObfuscatedUser[] = [
    {
      userId: 'user-1',
      role: UserRole.tenant_admin,
    },
    {
      userId: 'user-2',
      role: UserRole.tenant_user,
    },
  ];

  const authMock = {
    startImpersonation: vi.fn(() => of('token-1')),
  };

  beforeEach(async () => {
    authMock.startImpersonation.mockClear();

    await TestBed.configureTestingModule({
      imports: [TenantUserListComponent],
      providers: [{ provide: AuthService, useValue: authMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantUserListComponent);
    component = fixture.componentInstance;
  });

  it('shows empty state when no users are available', () => {
    fixture.componentRef.setInput('isLoading', false);
    fixture.componentRef.setInput('users', []);
    fixture.detectChanges();

    const empty = (fixture.nativeElement as HTMLElement).querySelector('.empty');
    expect(empty?.textContent).toContain('No users available for this tenant.');
  });

  it('renders one row and one impersonation button per user', () => {
    fixture.componentRef.setInput('users', users);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const rows = root.querySelectorAll('tbody tr');
    const buttons = root.querySelectorAll('app-impersonate-button');

    expect(rows.length).toBe(2);
    expect(buttons.length).toBe(2);
  });

  it('re-emits impersonation started from child component', () => {
    fixture.componentRef.setInput('users', [users[0]]);
    fixture.detectChanges();

    const startedSpy = vi.spyOn(component.impersonationStarted, 'emit');
    const child = fixture.debugElement.query(By.css('app-impersonate-button'));

    child.triggerEventHandler('started', 'user-1');

    expect(startedSpy).toHaveBeenCalledWith('user-1');
  });

  it('re-emits impersonation failure from child component', () => {
    fixture.componentRef.setInput('users', [users[0]]);
    fixture.detectChanges();

    const failedSpy = vi.spyOn(component.impersonationFailed, 'emit');
    const child = fixture.debugElement.query(By.css('app-impersonate-button'));

    child.triggerEventHandler('failed', 'Impersonation failed.');

    expect(failedSpy).toHaveBeenCalledWith('Impersonation failed.');
  });
});
