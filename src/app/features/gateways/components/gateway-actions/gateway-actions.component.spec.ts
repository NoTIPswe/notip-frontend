import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GatewayActionsComponent } from './gateway-actions.component';

describe('GatewayActionsComponent', () => {
  let component: GatewayActionsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GatewayActionsComponent],
    }).compileComponents();

    component = TestBed.createComponent(GatewayActionsComponent).componentInstance;
  });

  it('emits rename/configure/firmware/delete events from handlers', () => {
    const renameSpy = vi.spyOn(component.renameRequested, 'emit');
    const configureSpy = vi.spyOn(component.configureRequested, 'emit');
    const firmwareSpy = vi.spyOn(component.firmwareRequested, 'emit');
    const deleteSpy = vi.spyOn(component.deleteRequested, 'emit');

    component.onRename();
    component.onConfigure();
    component.onFirmware();
    component.onDelete();

    expect(renameSpy).toHaveBeenCalledOnce();
    expect(configureSpy).toHaveBeenCalledOnce();
    expect(firmwareSpy).toHaveBeenCalledOnce();
    expect(deleteSpy).toHaveBeenCalledOnce();
  });
});
