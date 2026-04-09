import { Component, input, output, signal } from '@angular/core';
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
  readonly availableGatewayIds = input<string[]>([]);
  readonly isSaving = input<boolean>(false);
  readonly selectedGatewayCurrentTimeoutMs = signal<number | null>(null);

  readonly defaultSubmitted = output<DefaultTimeoutPayload>();
  readonly gatewaySubmitted = output<GatewayTimeoutPayload>();
  readonly gatewayDeleteRequested = output<string>();
  readonly cancelRequested = output<void>();

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
    const allowedGatewayIds = this.availableGatewayIds();

    if (
      !cleanGatewayId ||
      !Number.isFinite(timeoutMs) ||
      timeoutMs <= 0 ||
      !allowedGatewayIds.includes(cleanGatewayId)
    ) {
      return;
    }

    this.gatewaySubmitted.emit({
      gatewayId: cleanGatewayId,
      timeoutMs,
    });
  }

  onGatewaySelectionChanged(gatewayId: string, timeoutInput: HTMLInputElement): void {
    const cleanGatewayId = gatewayId.trim();

    if (!cleanGatewayId) {
      this.selectedGatewayCurrentTimeoutMs.set(null);
      timeoutInput.value = '';
      return;
    }

    const timeoutMs = this.resolveCurrentTimeout(cleanGatewayId);
    this.selectedGatewayCurrentTimeoutMs.set(timeoutMs);
    timeoutInput.value = String(timeoutMs);
  }

  deleteGatewayOverride(gatewayId: string): void {
    this.gatewayDeleteRequested.emit(gatewayId);
  }

  cancel(): void {
    this.cancelRequested.emit();
  }

  private resolveCurrentTimeout(gatewayId: string): number {
    const override = this.gatewayOverrides().find((row) => row.gatewayId === gatewayId);
    return override?.timeoutMs ?? this.defaultTimeoutMs();
  }
}
