import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

    component.onUpdateSubmit(event, 'Tenant Updated');

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('emits update payload when tenant id is present', () => {
    const preventDefault = vi.fn();
    const event = { preventDefault } as unknown as Event;
    const emitSpy = vi.spyOn(component.updateRequested, 'emit');
    fixture.componentRef.setInput('tenantId', 'tenant-1');

    component.onUpdateSubmit(event, ' Tenant Updated ');

    expect(emitSpy).toHaveBeenCalledWith({
      tenantId: 'tenant-1',
      name: 'Tenant Updated',
    });
  });

  it('emits cancel request', () => {
    const emitSpy = vi.spyOn(component.cancelRequested, 'emit');

    component.onCancel();

    expect(emitSpy).toHaveBeenCalledOnce();
  });
});
