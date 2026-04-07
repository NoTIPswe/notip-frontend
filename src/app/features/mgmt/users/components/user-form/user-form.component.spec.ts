import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserRole } from '../../../../../core/models/enums';
import { ViewUser } from '../../../../../core/models/user';
import { UserFormComponent } from './user-form.component';

describe('UserFormComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<UserFormComponent>>;
  let component: UserFormComponent;

  const editUser: ViewUser = {
    userId: 'user-1',
    username: 'Mario',
    email: 'mario@test.dev',
    role: UserRole.tenant_admin,
    lastAccess: null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UserFormComponent);
    component = fixture.componentInstance;
  });

  it('emits create payload with trimmed fields and mapped role', () => {
    const preventDefault = vi.fn();
    const event = { preventDefault } as unknown as Event;
    const emitSpy = vi.spyOn(component.createRequested, 'emit');

    component.create(event, ' Alice ', ' alice@test.dev ', 'system_admin', 'pwd-1');

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith({
      username: 'Alice',
      email: 'alice@test.dev',
      role: UserRole.tenant_user,
      password: 'pwd-1',
    });
  });

  it('maps tenant_admin role and keeps empty normalized username when blank', () => {
    const preventDefault = vi.fn();
    const event = { preventDefault } as unknown as Event;
    const emitSpy = vi.spyOn(component.createRequested, 'emit');

    component.create(event, '   ', ' admin@test.dev ', 'tenant_admin', 'pwd-2');

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith({
      username: '',
      email: 'admin@test.dev',
      role: UserRole.tenant_admin,
      password: 'pwd-2',
    });
  });

  it('does not show system_admin among create role options', () => {
    fixture.detectChanges();

    const options = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('select option'),
    ).map((option) => option.textContent?.trim());

    expect(options).toContain('tenant_user');
    expect(options).toContain('tenant_admin');
    expect(options).not.toContain('system_admin');
  });

  it('does not emit update when edit user is missing', () => {
    const preventDefault = vi.fn();
    const event = { preventDefault } as unknown as Event;
    const emitSpy = vi.spyOn(component.updateRequested, 'emit');

    component.update(event, 'Alice', 'alice@test.dev', 'tenant_admin');

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('emits update payload with mapped fallback role', () => {
    const preventDefault = vi.fn();
    const event = { preventDefault } as unknown as Event;
    const emitSpy = vi.spyOn(component.updateRequested, 'emit');
    fixture.componentRef.setInput('editUser', editUser);

    component.update(event, ' Alice Updated ', ' alice-updated@test.dev ', 'unknown-role');

    expect(emitSpy).toHaveBeenCalledWith({
      userId: 'user-1',
      username: 'Alice updated',
      email: 'alice-updated@test.dev',
      role: UserRole.tenant_user,
    });
  });

  it('emits cancel request', () => {
    const emitSpy = vi.spyOn(component.cancelRequested, 'emit');

    component.cancel();

    expect(emitSpy).toHaveBeenCalledOnce();
  });
});
