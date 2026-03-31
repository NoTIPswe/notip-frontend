import { Component, input } from '@angular/core';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.css',
})
export class StatusBadgeComponent {
  readonly status = input<string>('unknown');

  badgeClass(): string {
    const normalized = this.status().toLowerCase();
    switch (normalized) {
      case 'online':
      case 'ack':
        return 'is-good';
      case 'paused':
      case 'provisioning':
      case 'queued':
        return 'is-warn';
      case 'offline':
      case 'nack':
      case 'expired':
      case 'timeout':
      case 'error':
        return 'is-bad';
      default:
        return 'is-neutral';
    }
  }
}
