import { Component, input, output } from '@angular/core';
import { GatewayOverride } from '../../../../core/models/alert';

export type DefaultTimeoutPayload = {
  timeoutMs: number;
};

export type GatewayTimeoutPayload = {
  gatewayId: string;
  timeoutMs: number;
};

@Component({
  selector: 'app-alert-config-form',
  standalone: true,
  templateUrl: './alert-config-form.component.html',
  styleUrl: './alert-config-form.component.css',
})
export class AlertConfigFormComponent {
  readonly defaultTimeoutMs = input<number>(0);
  readonly gatewayOverrides = input<GatewayOverride[]>([]);
  readonly isSaving = input<boolean>(false);

  readonly defaultSubmitted = output<DefaultTimeoutPayload>();
  readonly gatewaySubmitted = output<GatewayTimeoutPayload>();
  readonly gatewayDeleteRequested = output<string>();

  submitDefault(event: Event, timeoutRaw: string): void {
    event.preventDefault();
    const timeoutMs = Number.parseInt(timeoutRaw, 10);
    if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
      return;
    }

    this.defaultSubmitted.emit({ timeoutMs });
  }

  submitGateway(event: Event, gatewayId: string, timeoutRaw: string): void {
    event.preventDefault();

    const timeoutMs = Number.parseInt(timeoutRaw, 10);
    const cleanGatewayId = gatewayId.trim();
    if (!cleanGatewayId || !Number.isFinite(timeoutMs) || timeoutMs <= 0) {
      return;
    }

    this.gatewaySubmitted.emit({
      gatewayId: cleanGatewayId,
      timeoutMs,
    });
  }

  deleteGatewayOverride(gatewayId: string): void {
    this.gatewayDeleteRequested.emit(gatewayId);
  }
}
