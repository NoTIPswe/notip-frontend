import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GatewayRenameModalComponent } from './gateway-rename-modal.component';

describe('GatewayRenameModalComponent', () => {
  let component: GatewayRenameModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GatewayRenameModalComponent],
    }).compileComponents();

    component = TestBed.createComponent(GatewayRenameModalComponent).componentInstance;
  });

  it('emits close event', () => {
    const emitSpy = vi.spyOn(component.closed, 'emit');

    component.close();

    expect(emitSpy).toHaveBeenCalledOnce();
  });

  it('emits trimmed rename value on submit', () => {
    const preventDefault = vi.fn();
    const event = { preventDefault } as unknown as Event;
    const emitSpy = vi.spyOn(component.renameSubmitted, 'emit');

    component.submit(event, '  Gateway One  ');

    expect(preventDefault).toHaveBeenCalledOnce();
    expect(emitSpy).toHaveBeenCalledWith('Gateway One');
  });
});
