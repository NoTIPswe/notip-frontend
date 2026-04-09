import { Component, input, output } from '@angular/core';

export type CreateAdminGatewayPayload = {
  factoryId: string;
  tenantId: string;
  factoryKey: string;
  model: string;
};

@Component({
  selector: 'app-admin-gateway-form',
  standalone: true,
  templateUrl: './admin-gateway-form.component.html',
  styleUrl: './admin-gateway-form.component.css',
})
export class AdminGatewayFormComponent {
  readonly isSaving = input<boolean>(false);
  readonly tenantIds = input<string[]>([]);
  readonly errorMessage = input<string | null>(null);
  readonly createRequested = output<CreateAdminGatewayPayload>();
  readonly cancelRequested = output<void>();

  onSubmit(
    event: Event,
    factoryId: string,
    tenantId: string,
    factoryKey: string,
    model: string,
  ): void {
    event.preventDefault();

    this.createRequested.emit({
      factoryId: factoryId.trim(),
      tenantId: tenantId.trim(),
      factoryKey: factoryKey.trim(),
      model: model.trim(),
    });
  }

  onCancel(): void {
    this.cancelRequested.emit();
  }
}
