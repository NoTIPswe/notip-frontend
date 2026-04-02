import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DeleteConfirmModalComponent } from './delete-confirm-modal.component';

describe('DeleteConfirmModalComponent', () => {
  let component: DeleteConfirmModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteConfirmModalComponent],
    }).compileComponents();

    component = TestBed.createComponent(DeleteConfirmModalComponent).componentInstance;
  });

  it('emits confirm and cancel events', () => {
    const confirmSpy = vi.spyOn(component.confirmed, 'emit');
    const cancelSpy = vi.spyOn(component.cancelled, 'emit');

    component.onConfirm();
    component.onCancel();

    expect(confirmSpy).toHaveBeenCalledOnce();
    expect(cancelSpy).toHaveBeenCalledOnce();
  });
});
