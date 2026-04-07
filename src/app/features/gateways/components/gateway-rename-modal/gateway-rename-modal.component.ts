import { Component, input, output } from '@angular/core';
import { ModalLayerComponent } from '../../../../shared/components/modal-layer/modal-layer.component';

@Component({
  selector: 'app-gateway-rename-modal',
  standalone: true,
  imports: [ModalLayerComponent],
  templateUrl: './gateway-rename-modal.component.html',
  styleUrl: './gateway-rename-modal.component.css',
})
export class GatewayRenameModalComponent {
  readonly open = input<boolean>(false);
  readonly currentName = input<string>('');
  readonly busy = input<boolean>(false);

  readonly closed = output<void>();
  readonly renameSubmitted = output<string>();

  close(): void {
    this.closed.emit();
  }

  submit(event: Event, nextNameRaw: string): void {
    event.preventDefault();
    this.renameSubmitted.emit(nextNameRaw.trim());
  }
}
