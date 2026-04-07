import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-modal-layer',
  standalone: true,
  templateUrl: './modal-layer.component.html',
  styleUrl: './modal-layer.component.css',
})
export class ModalLayerComponent {
  readonly open = input<boolean>(false);
  readonly closeOnBackdrop = input<boolean>(false);

  readonly backdropClosed = output<void>();

  onBackdropClick(event: Event): void {
    if (event.target !== event.currentTarget) {
      return;
    }

    if (this.closeOnBackdrop()) {
      this.backdropClosed.emit();
    }
  }
}
