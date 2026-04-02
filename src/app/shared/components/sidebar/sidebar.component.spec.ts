import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole } from '../../../core/models/enums';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<SidebarComponent>>;
  let component: SidebarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
  });

  it('emits logout request', () => {
    const emitSpy = vi.spyOn(component.logoutRequested, 'emit');

    component.emitLogout();

    expect(emitSpy).toHaveBeenCalledOnce();
  });

  it('shows impersonation tag only when impersonating', () => {
    fixture.componentRef.setInput('isImpersonating', true);
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('app-impersonation-tag'),
    ).toBeTruthy();

    fixture.componentRef.setInput('isImpersonating', false);
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('app-impersonation-tag'),
    ).toBeNull();
  });

  it('shows tenant admin menu entries', () => {
    fixture.componentRef.setInput('role', UserRole.tenant_admin);
    fixture.detectChanges();

    const links = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('nav a')).map(
      (a) => a.textContent?.trim(),
    );

    expect(links).toContain('Dashboard');
    expect(links).toContain('Gateways');
    expect(links).toContain('Alerts');
    expect(links).toContain('Users Management');
  });

  it('shows system admin menu entries only', () => {
    fixture.componentRef.setInput('role', UserRole.system_admin);
    fixture.detectChanges();

    const links = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('nav a')).map(
      (a) => a.textContent?.trim(),
    );

    expect(links).toContain('Tenants');
    expect(links).toContain('Admin Gateways');
    expect(links).not.toContain('Dashboard');
  });
});
