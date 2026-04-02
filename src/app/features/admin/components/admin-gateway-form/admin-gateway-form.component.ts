import { Component, input, output } from '@angular/core';

export type CreateAdminGatewayPayload = {
  factoryId: string;
  tenantId: string;
  factoryKeyHash: string;
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
  readonly createRequested = output<CreateAdminGatewayPayload>();

  onSubmit(
    event: Event,
    factoryId: string,
    tenantId: string,
    factoryKeyHash: string,
    model: string,
  ): void {
    event.preventDefault();

    this.createRequested.emit({
      factoryId: factoryId.trim(),
      tenantId: tenantId.trim(),
      factoryKeyHash: factoryKeyHash.trim(),
      model: model.trim(),
    });
  }
}
