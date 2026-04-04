import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminGatewayFormComponent } from './admin-gateway-form.component';

describe('AdminGatewayFormComponent', () => {
  let component: AdminGatewayFormComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminGatewayFormComponent],
    }).compileComponents();

    component = TestBed.createComponent(AdminGatewayFormComponent).componentInstance;
  });

  it('emits a trimmed payload on submit', () => {
    const preventDefault = vi.fn();
    const event = { preventDefault } as unknown as Event;
    const emitSpy = vi.spyOn(component.createRequested, 'emit');

    component.onSubmit(event, ' factory ', ' tenant ', ' hash ', ' model ');

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith({
      factoryId: 'factory',
      tenantId: 'tenant',
      factoryKey: 'hash',
      model: 'model',
    });
  });

  it('accepts tenant options input', () => {
    const fixture = TestBed.createComponent(AdminGatewayFormComponent);
    fixture.componentRef.setInput('tenantIds', ['tenant-a', 'tenant-b']);
    fixture.detectChanges();

    expect(fixture.componentInstance.tenantIds()).toEqual(['tenant-a', 'tenant-b']);
  });
});
