import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-gateway-actions',
  standalone: true,
  templateUrl: './gateway-actions.component.html',
  styleUrl: './gateway-actions.component.css',
})
export class GatewayActionsComponent {
  readonly canManage = input<boolean>(false);
  readonly isBusy = input<boolean>(false);

  readonly renameRequested = output<void>();
  readonly configureRequested = output<void>();
  readonly firmwareRequested = output<void>();
  readonly deleteRequested = output<void>();

  onRename(): void {
    this.renameRequested.emit();
  }

  onConfigure(): void {
    this.configureRequested.emit();
  }

  onFirmware(): void {
    this.firmwareRequested.emit();
  }

  onDelete(): void {
    this.deleteRequested.emit();
  }
}
