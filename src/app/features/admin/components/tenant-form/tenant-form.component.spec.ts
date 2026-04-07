import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TenantStatus } from '../../../../core/models/enums';
import { TenantFormComponent } from './tenant-form.component';

describe('TenantFormComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<TenantFormComponent>>;
  let component: TenantFormComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TenantFormComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TenantFormComponent);
    component = fixture.componentInstance;
  });

  it('emits create payload with trimmed fields', () => {
    const preventDefault = vi.fn();
    const event = { preventDefault } as unknown as Event;
    const emitSpy = vi.spyOn(component.createRequested, 'emit');

    component.onCreateSubmit(event, ' Tenant ', ' admin@test.dev ', ' Mario Rossi ', 'pwd-1');

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith({
      name: 'Tenant',
      adminEmail: 'admin@test.dev',
      adminName: 'Mario Rossi',
      adminPassword: 'pwd-1',
    });
  });

  it('does not emit update when tenant id is missing', () => {
    const preventDefault = vi.fn();
    const event = { preventDefault } as unknown as Event;
    const emitSpy = vi.spyOn(component.updateRequested, 'emit');

    component.onUpdateSubmit(event, 'Tenant Updated', 'suspended', 10);

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('emits update payload when tenant id is present', () => {
    const preventDefault = vi.fn();
    const event = { preventDefault } as unknown as Event;
    const emitSpy = vi.spyOn(component.updateRequested, 'emit');
    fixture.componentRef.setInput('tenantId', 'tenant-1');

    component.onUpdateSubmit(event, ' Tenant Updated ', 'suspended', 15);

    expect(emitSpy).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      name: 'Tenant Updated',
      status: 'suspended',
      suspensionIntervalDays: 15,
    });
  });

  it('truncates decimal suspension interval when status is suspended', () => {
    const preventDefault = vi.fn();
    const event = { preventDefault } as unknown as Event;
    const emitSpy = vi.spyOn(component.updateRequested, 'emit');
    fixture.componentRef.setInput('tenantId', 'tenant-4');

    component.onUpdateSubmit(event, ' Tenant Updated ', 'suspended', 15.8);

    expect(emitSpy).toHaveBeenCalledWith({
      tenantId: 'tenant-4',
      name: 'Tenant Updated',
      status: 'suspended',
      suspensionIntervalDays: 15,
    });
  });

  it('normalizes invalid update status and suspension interval', () => {
    const preventDefault = vi.fn();
    const event = { preventDefault } as unknown as Event;
    const emitSpy = vi.spyOn(component.updateRequested, 'emit');
    fixture.componentRef.setInput('tenantId', 'tenant-2');

    component.onUpdateSubmit(event, ' Tenant Updated ', 'not-valid', -5);

    expect(emitSpy).toHaveBeenCalledWith({
      tenantId: 'tenant-2',
      name: 'Tenant Updated',
      status: 'active',
      suspensionIntervalDays: 0,
    });
  });

  it('forces suspension interval to zero when status is active', () => {
    const preventDefault = vi.fn();
    const event = { preventDefault } as unknown as Event;
    const emitSpy = vi.spyOn(component.updateRequested, 'emit');
    fixture.componentRef.setInput('tenantId', 'tenant-3');

    component.onUpdateSubmit(event, ' Tenant Updated ', 'active', 45);

    expect(emitSpy).toHaveBeenCalledWith({
      tenantId: 'tenant-3',
      name: 'Tenant Updated',
      status: 'active',
      suspensionIntervalDays: 0,
    });
  });

  it('syncs current status with input and status changes', () => {
    fixture.componentRef.setInput('initialStatus', 'suspended');
    fixture.detectChanges();

    expect(component.currentStatus()).toBe('suspended');

    component.onStatusChange('active');
    expect(component.currentStatus()).toBe('active');

    component.onStatusChange('unsupported-status');
    expect(component.currentStatus()).toBe('active');
  });

  it('preloads selected edit status from current tenant status', () => {
    fixture.componentRef.setInput('tenantId', 'tenant-5');
    fixture.componentRef.setInput('initialStatus', TenantStatus.suspended);
    fixture.detectChanges();

    const statusSelect = (fixture.nativeElement as HTMLElement).querySelector(
      'select',
    ) as HTMLSelectElement;

    expect(statusSelect.value).toBe(TenantStatus.suspended);
  });

  it('normalizes preloaded status casing before selecting edit status', () => {
    fixture.componentRef.setInput('tenantId', 'tenant-6');
    fixture.componentRef.setInput('initialStatus', 'SUSPENDED' as unknown as TenantStatus);
    fixture.detectChanges();

    const statusSelect = (fixture.nativeElement as HTMLElement).querySelector(
      'select',
    ) as HTMLSelectElement;

    expect(component.currentStatus()).toBe(TenantStatus.suspended);
    expect(statusSelect.value).toBe(TenantStatus.suspended);
  });

  it('emits cancel request', () => {
    const emitSpy = vi.spyOn(component.cancelRequested, 'emit');

    component.onCancel();

    expect(emitSpy).toHaveBeenCalledOnce();
  });
});
