import { Component, ElementRef, HostListener, inject, input, output } from '@angular/core';

@Component({
  selector: 'app-modal-layer',
  standalone: true,
  templateUrl: './modal-layer.component.html',
  styleUrl: './modal-layer.component.css',
})
export class ModalLayerComponent {
  private readonly hostElement = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly open = input<boolean>(false);
  readonly closeOnBackdrop = input<boolean>(false);

  readonly backdropClosed = output<void>();

  @HostListener('click', ['$event'])
  onHostClick(event: MouseEvent): void {
    const dialog = this.hostElement.nativeElement.querySelector<HTMLDialogElement>('dialog');
    if (!dialog || event.target !== dialog) {
      return;
    }

    if (this.closeOnBackdrop()) {
      this.backdropClosed.emit();
    }
  }
}
