import { Component, input, output } from '@angular/core';
import { GatewayConfig, GatewayFirmware } from '../../../../core/models/command';
import { CmdGatewayStatus } from '../../../../core/models/enums';

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
  readonly initialSendFrequencyMs = input<number | null>(null);
  readonly initialStatus = input<CmdGatewayStatus | null>(null);
  readonly cmdStatusOnline = CmdGatewayStatus.online;
  readonly cmdStatusPaused = CmdGatewayStatus.paused;

  readonly closed = output<void>();
  readonly configSubmitted = output<GatewayConfig>();
  readonly firmwareSubmitted = output<GatewayFirmware>();

  close(): void {
    this.closed.emit();
  }

  submitConfig(event: Event, frequencyRaw: string, statusRaw: string): void {
    event.preventDefault();

    const frequency = Number.parseInt(frequencyRaw, 10);
    let status: CmdGatewayStatus | null = null;
    if (statusRaw === 'online') {
      status = CmdGatewayStatus.online;
    } else if (statusRaw === 'paused') {
      status = CmdGatewayStatus.paused;
    }

    const payload: GatewayConfig = {
      ...(Number.isFinite(frequency) ? { send_frequency_ms: frequency } : {}),
      ...(status ? { status } : {}),
    };

    this.configSubmitted.emit(payload);
  }

  submitFirmware(event: Event, version: string, downloadUrl: string): void {
    event.preventDefault();

    this.firmwareSubmitted.emit({
      firmware_version: version.trim(),
      download_url: downloadUrl.trim(),
    });
  }
}
