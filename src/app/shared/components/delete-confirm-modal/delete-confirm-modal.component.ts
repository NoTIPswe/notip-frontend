import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-delete-confirm-modal',
  standalone: true,
  templateUrl: './delete-confirm-modal.component.html',
  styleUrl: './delete-confirm-modal.component.css',
})
export class DeleteConfirmModalComponent {
  readonly open = input<boolean>(false);
  readonly title = input<string>('Conferma eliminazione');
  readonly message = input<string>('Questa azione e irreversibile.');
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
