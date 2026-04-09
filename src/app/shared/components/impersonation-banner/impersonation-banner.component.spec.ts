import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ImpersonationBannerComponent } from './impersonation-banner.component';

describe('ImpersonationBannerComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<ImpersonationBannerComponent>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImpersonationBannerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ImpersonationBannerComponent);
  });

  it('does not render banner when impersonation is inactive', () => {
    fixture.componentRef.setInput('active', false);
    fixture.detectChanges();

    const banner = (fixture.nativeElement as HTMLElement).querySelector('.impersonation-banner');
    expect(banner).toBeNull();
  });

  it('renders impersonated user id when active', () => {
    fixture.componentRef.setInput('active', true);
    fixture.componentRef.setInput('impersonatedUserId', 'user-42');
    fixture.detectChanges();

    const details = (fixture.nativeElement as HTMLElement).querySelector('.details');
    expect(details?.textContent).toContain('user-42');
  });

  it('falls back to unknown user when id is missing', () => {
    fixture.componentRef.setInput('active', true);
    fixture.componentRef.setInput('impersonatedUserId', null);
    fixture.detectChanges();

    const details = (fixture.nativeElement as HTMLElement).querySelector('.details');
    expect(details?.textContent).toContain('unknown');
  });
});
