import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ModalLayerComponent } from './modal-layer.component';

describe('ModalLayerComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<ModalLayerComponent>>;
  let component: ModalLayerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalLayerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalLayerComponent);
    component = fixture.componentInstance;
  });

  it('does not emit when click target is not backdrop', () => {
    fixture.componentRef.setInput('closeOnBackdrop', true);
    fixture.detectChanges();

    const emitSpy = vi.spyOn(component.backdropClosed, 'emit');
    const event = { target: {}, currentTarget: {} } as unknown as Event;

    component.onBackdropClick(event);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('does not emit when close on backdrop is disabled', () => {
    fixture.componentRef.setInput('closeOnBackdrop', false);
    fixture.detectChanges();

    const emitSpy = vi.spyOn(component.backdropClosed, 'emit');
    const backdrop = {};
    const event = { target: backdrop, currentTarget: backdrop } as unknown as Event;

    component.onBackdropClick(event);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('emits when clicking backdrop and close on backdrop is enabled', () => {
    fixture.componentRef.setInput('closeOnBackdrop', true);
    fixture.detectChanges();

    const emitSpy = vi.spyOn(component.backdropClosed, 'emit');
    const backdrop = {};
    const event = { target: backdrop, currentTarget: backdrop } as unknown as Event;

    component.onBackdropClick(event);

    expect(emitSpy).toHaveBeenCalledOnce();
  });
});
