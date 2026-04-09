import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ModalLayerComponent } from './modal-layer.component';

describe('ModalLayerComponent', () => {
  let fixture: ComponentFixture<ModalLayerComponent>;
  let component: ModalLayerComponent;

  const renderOpenModal = (closeOnBackdrop: boolean): HTMLDialogElement => {
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('closeOnBackdrop', closeOnBackdrop);
    fixture.detectChanges();

    const hostElement = fixture.nativeElement as HTMLElement;
    const dialog = hostElement.querySelector('dialog');
    if (!(dialog instanceof HTMLDialogElement)) {
      throw new TypeError('Dialog element was not rendered');
    }

    return dialog;
  };

  const createClickEvent = (target: EventTarget | null): MouseEvent => {
    const event = new MouseEvent('click');
    Object.defineProperty(event, 'target', { value: target });
    return event;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalLayerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ModalLayerComponent);
    component = fixture.componentInstance;
  });

  it('does not emit when click target is not backdrop', () => {
    renderOpenModal(true);

    const emitSpy = vi.spyOn(component.backdropClosed, 'emit');
    const event = createClickEvent(document.createElement('div'));

    component.onHostClick(event);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('does not emit when close on backdrop is disabled', () => {
    const dialog = renderOpenModal(false);

    const emitSpy = vi.spyOn(component.backdropClosed, 'emit');
    const event = createClickEvent(dialog);

    component.onHostClick(event);

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('emits when clicking backdrop and close on backdrop is enabled', () => {
    const dialog = renderOpenModal(true);

    const emitSpy = vi.spyOn(component.backdropClosed, 'emit');
    const event = createClickEvent(dialog);

    component.onHostClick(event);

    expect(emitSpy).toHaveBeenCalledOnce();
  });
});
