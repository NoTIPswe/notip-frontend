import { Component, input, output } from '@angular/core';
import { GatewayConfig, GatewayFirmware } from '../../../../core/models/command';

export type CommandModalMode = 'config' | 'firmware' | null;

@Component({
  selector: 'app-command-modal',
  standalone: true,
  templateUrl: './command-modal.component.html',
  styleUrl: './command-modal.component.css',
})
export class CommandModalComponent {
  readonly open = input<boolean>(false);
  readonly mode = input<CommandModalMode>(null);
  readonly busy = input<boolean>(false);

  readonly closed = output<void>();
  readonly configSubmitted = output<GatewayConfig>();
  readonly firmwareSubmitted = output<GatewayFirmware>();

  close(): void {
    this.closed.emit();
  }

  submitConfig(event: Event, frequencyRaw: string, statusRaw: string): void {
    event.preventDefault();

    const frequency = Number.parseInt(frequencyRaw, 10);
    const status = statusRaw === 'online' || statusRaw === 'paused' ? statusRaw : undefined;

    this.configSubmitted.emit({
      send_frequency_ms: Number.isFinite(frequency) ? frequency : undefined,
      status,
    });
  }

  submitFirmware(event: Event, version: string, downloadUrl: string): void {
    event.preventDefault();

    this.firmwareSubmitted.emit({
      firmware_version: version.trim(),
      download_url: downloadUrl.trim(),
    });
  }
}
