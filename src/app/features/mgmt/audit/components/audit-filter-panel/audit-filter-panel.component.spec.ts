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
    fixture.componentRef.setInput('userIds', ['u1', 'u2']);
    fixture.componentRef.setInput('actions', ['login', 'create']);
    fixture.componentRef.setInput('userIdOptions', ['u1', 'u2', 'u3']);
    fixture.componentRef.setInput('actionOptions', ['login', 'create', 'delete']);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const inputs = root.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]');
    const triggers = root.querySelectorAll<HTMLElement>('.multi-select-trigger .trigger-text');

    expect(inputs[0].value).toBe('2026-04-01T10:00');
    expect(inputs[1].value).toBe('2026-04-02T10:00');
    expect(triggers[0]?.textContent?.trim()).toBe('2 selected');
    expect(triggers[1]?.textContent?.trim()).toBe('2 selected');
  });

  it('emits trimmed filter payload when form is submitted', () => {
    const emitSpy = vi.spyOn(component.filterSubmitted, 'emit');
    const preventDefault = vi.fn();
    const event = { preventDefault } as unknown as Event;

    component.onUserIdsChanged([' u1 ', 'u2']);
    component.onActionsChanged([' login ', 'create']);
    component.submit(event, ' 2026-04-01T10:00 ', ' 2026-04-02T10:00 ');

    expect(preventDefault).toHaveBeenCalledOnce();

    expect(emitSpy).toHaveBeenCalledWith({
      from: '2026-04-01T10:00',
      to: '2026-04-02T10:00',
      userIds: ['u1', 'u2'],
      actions: ['login', 'create'],
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
    fixture.componentRef.setInput('userIdOptions', ['u1']);
    fixture.componentRef.setInput('actionOptions', ['login']);
    fixture.componentRef.setInput('isLoading', true);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    const submitButton = root.querySelector('button[type="submit"]') as HTMLButtonElement;
    const resetButton = root.querySelector('button.ghost') as HTMLButtonElement;

    expect(submitButton.disabled).toBe(true);
    expect(resetButton.disabled).toBe(true);
  });
});
