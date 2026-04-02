import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<SidebarComponent>>;
  let component: SidebarComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
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
});
