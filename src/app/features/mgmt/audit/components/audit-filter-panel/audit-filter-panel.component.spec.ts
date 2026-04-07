import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditFilterPanelComponent } from './audit-filter-panel.component';

describe('AuditFilterPanelComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<AuditFilterPanelComponent>>;
  let component: AuditFilterPanelComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditFilterPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditFilterPanelComponent);
    component = fixture.componentInstance;
  });

  it('hydrates form inputs from signal inputs', () => {
    fixture.componentRef.setInput('from', '2026-04-01T10:00');
    fixture.componentRef.setInput('to', '2026-04-02T10:00');
    fixture.componentRef.setInput('userIds', 'u1,u2');
    fixture.componentRef.setInput('actions', 'login,create');
    fixture.detectChanges();

    const inputs = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLInputElement>(
      'input',
    );

    expect(inputs[0].value).toBe('2026-04-01T10:00');
    expect(inputs[1].value).toBe('2026-04-02T10:00');
    expect(inputs[2].value).toBe('u1,u2');
    expect(inputs[3].value).toBe('login,create');
  });

  it('emits trimmed filter payload when form is submitted', () => {
    fixture.detectChanges();

    const emitSpy = vi.spyOn(component.filterSubmitted, 'emit');
    const root = fixture.nativeElement as HTMLElement;
    const inputs = root.querySelectorAll<HTMLInputElement>('input');
    const form = root.querySelector('form');

    inputs[0].value = '2026-04-01T10:00';
    inputs[1].value = '2026-04-02T10:00';
    inputs[2].value = ' u1,u2 ';
    inputs[3].value = ' login,create ';

    form?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(emitSpy).toHaveBeenCalledWith({
      from: '2026-04-01T10:00',
      to: '2026-04-02T10:00',
      userIds: 'u1,u2',
      actions: 'login,create',
    });
  });

  it('emits reset request when reset is clicked', () => {
    fixture.detectChanges();

    const emitSpy = vi.spyOn(component.resetRequested, 'emit');
    const resetButton = (fixture.nativeElement as HTMLElement).querySelector(
      'button.ghost',
    ) as HTMLButtonElement;

    resetButton.click();

    expect(emitSpy).toHaveBeenCalledOnce();
  });

  it('disables form actions while loading', () => {
    fixture.componentRef.setInput('isLoading', true);
    fixture.detectChanges();

    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
      'button',
    );

    expect(buttons[0].disabled).toBe(true);
    expect(buttons[1].disabled).toBe(true);
  });
});
