import { Component, input, output } from '@angular/core';
import { ModalLayerComponent } from '../modal-layer/modal-layer.component';

@Component({
  selector: 'app-delete-confirm-modal',
  standalone: true,
  imports: [ModalLayerComponent],
  templateUrl: './delete-confirm-modal.component.html',
  styleUrl: './delete-confirm-modal.component.css',
})
export class DeleteConfirmModalComponent {
  readonly open = input<boolean>(false);
  readonly title = input<string>('Confirm deletion');
  readonly message = input<string>('This action cannot be undone.');
  readonly busy = input<boolean>(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
