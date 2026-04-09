import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TenantStatus } from '../../../../core/models/enums';
import { Tenant } from '../../../../core/models/tenant';
import { TenantTableComponent } from './tenant-table.component';

describe('TenantTableComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TenantTableComponent>>;
  let component: TenantTableComponent;

  const tenants: Tenant[] = [
    {
      tenantId: 'tenant-1',
      name: 'Tenant One',
      status: TenantStatus.active,
      createdAt: '2026-04-07T10:15:30.000Z',
    },
    {
      tenantId: 'tenant-2',
      name: 'Tenant Two',
      status: TenantStatus.suspended,
      createdAt: '2026-04-07T11:15:30.000Z',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantTableComponent);
    component = fixture.componentInstance;
  });

  it('shows empty state when no tenants are available', () => {
    fixture.componentRef.setInput('isLoading', false);
    fixture.componentRef.setInput('tenants', []);
    fixture.detectChanges();

    const empty = (fixture.nativeElement as HTMLElement).querySelector('.empty');
    expect(empty?.textContent).toContain('No tenants available.');
  });

  it('applies selected row class based on selected tenant id', () => {
    fixture.componentRef.setInput('tenants', tenants);
    fixture.componentRef.setInput('selectedTenantId', 'tenant-2');
    fixture.detectChanges();

    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(rows[0].classList.contains('is-selected')).toBe(false);
    expect(rows[1].classList.contains('is-selected')).toBe(true);
  });

  it('emits selected tenant id when open is clicked', () => {
    fixture.componentRef.setInput('tenants', tenants);
    fixture.detectChanges();

    const emitSpy = vi.spyOn(component.selected, 'emit');
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('.actions-cell button');

    (buttons[0] as HTMLButtonElement).click();

    expect(emitSpy).toHaveBeenCalledWith('tenant-1');
  });

  it('emits edit and delete requests from action buttons', () => {
    fixture.componentRef.setInput('tenants', tenants);
    fixture.detectChanges();

    const editSpy = vi.spyOn(component.editRequested, 'emit');
    const deleteSpy = vi.spyOn(component.deleteRequested, 'emit');
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('.actions-cell button');

    (buttons[1] as HTMLButtonElement).click();
    (buttons[2] as HTMLButtonElement).click();

    expect(editSpy).toHaveBeenCalledWith('tenant-1');
    expect(deleteSpy).toHaveBeenCalledWith('tenant-1');
  });
});
