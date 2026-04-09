import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfileSectionComponent } from './profile-section.component';

describe('ProfileSectionComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<ProfileSectionComponent>>;
  let component: ProfileSectionComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileSectionComponent);
    component = fixture.componentInstance;
  });

  const setRequiredInputs = (): void => {
    fixture.componentRef.setInput('username', 'mario.rossi');
    fixture.componentRef.setInput('role', 'tenant_admin');
  };

  it('renders username and role', () => {
    setRequiredInputs();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const name = root.querySelector('.name');
    const role = root.querySelector('.role');

    expect(name?.textContent).toContain('mario.rossi');
    expect(role?.textContent).toContain('tenant_admin');
  });

  it('hides profile actions when showProfileLink is false', () => {
    setRequiredInputs();
    fixture.componentRef.setInput('showProfileLink', false);
    fixture.detectChanges();

    const actions = (fixture.nativeElement as HTMLElement).querySelector('.profile-actions');
    expect(actions).toBeNull();
  });

  it('emits profileRequested when open profile link is clicked', () => {
    setRequiredInputs();
    fixture.detectChanges();

    const emitSpy = vi.spyOn(component.profileRequested, 'emit');
    const links = (fixture.nativeElement as HTMLElement).querySelectorAll('.profile-actions a');

    (links[0] as HTMLAnchorElement).click();

    expect(emitSpy).toHaveBeenCalledOnce();
  });

  it('emits passwordChangeRequested when change password link is clicked', () => {
    setRequiredInputs();
    fixture.detectChanges();

    const emitSpy = vi.spyOn(component.passwordChangeRequested, 'emit');
    const links = (fixture.nativeElement as HTMLElement).querySelectorAll('.profile-actions a');

    (links[1] as HTMLAnchorElement).click();

    expect(emitSpy).toHaveBeenCalledOnce();
  });
});
