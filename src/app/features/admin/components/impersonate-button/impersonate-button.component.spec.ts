import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '../../../../core/services/auth.service';
import { ImpersonateButtonComponent } from './impersonate-button.component';

describe('ImpersonateButtonComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<ImpersonateButtonComponent>>;
  let component: ImpersonateButtonComponent;

  const authMock = {
    startImpersonation: vi.fn(),
  };

  beforeEach(async () => {
    authMock.startImpersonation.mockReset();

    await TestBed.configureTestingModule({
      imports: [ImpersonateButtonComponent],
      providers: [{ provide: AuthService, useValue: authMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ImpersonateButtonComponent);
    component = fixture.componentInstance;
  });

  it('does not start impersonation when target id is empty', () => {
    fixture.componentRef.setInput('userId', '   ');

    component.requestImpersonation();

    expect(authMock.startImpersonation).not.toHaveBeenCalled();
  });

  it('does not start impersonation when disabled', () => {
    fixture.componentRef.setInput('userId', 'user-1');
    fixture.componentRef.setInput('disabled', true);

    component.requestImpersonation();

    expect(authMock.startImpersonation).not.toHaveBeenCalled();
  });

  it('emits started when token is returned', () => {
    authMock.startImpersonation.mockReturnValue(of('token-1'));
    fixture.componentRef.setInput('userId', ' user-1 ');
    const startedSpy = vi.spyOn(component.started, 'emit');
    const failedSpy = vi.spyOn(component.failed, 'emit');

    component.requestImpersonation();

    expect(authMock.startImpersonation).toHaveBeenCalledWith('user-1');
    expect(component.inProgress()).toBe(false);
    expect(startedSpy).toHaveBeenCalledWith('user-1');
    expect(failedSpy).not.toHaveBeenCalled();
  });

  it('emits failure when token is missing', () => {
    authMock.startImpersonation.mockReturnValue(of(''));
    fixture.componentRef.setInput('userId', 'user-2');
    const failedSpy = vi.spyOn(component.failed, 'emit');

    component.requestImpersonation();

    expect(component.inProgress()).toBe(false);
    expect(failedSpy).toHaveBeenCalledWith('Impersonazione non avviata: token mancante.');
  });

  it('emits failure when request errors', () => {
    authMock.startImpersonation.mockReturnValue(throwError(() => new Error('boom')));
    fixture.componentRef.setInput('userId', 'user-3');
    const failedSpy = vi.spyOn(component.failed, 'emit');

    component.requestImpersonation();

    expect(component.inProgress()).toBe(false);
    expect(failedSpy).toHaveBeenCalledWith('Impersonazione non riuscita.');
  });
});
