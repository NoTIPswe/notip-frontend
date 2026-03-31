import { Component, input, output } from '@angular/core';
import { Gateway } from '../../../../core/models/gateway';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-gateway-card',
  standalone: true,
  imports: [StatusBadgeComponent],
  templateUrl: './gateway-card.component.html',
  styleUrl: './gateway-card.component.css',
})
export class GatewayCardComponent {
  readonly gateway = input.required<Gateway>();
  readonly selected = input<boolean>(false);

  readonly selectedGateway = output<string>();

  onOpenDetail(): void {
    this.selectedGateway.emit(this.gateway().gatewayId);
  }
}
