import { Component, input } from '@angular/core';
import { ObfuscatedGateway } from '../../../../core/models/gateway';

@Component({
  selector: 'app-admin-gateway-table',
  standalone: true,
  templateUrl: './admin-gateway-table.component.html',
  styleUrl: './admin-gateway-table.component.css',
})
export class AdminGatewayTableComponent {
  readonly gateways = input<ObfuscatedGateway[]>([]);
  readonly isLoading = input<boolean>(false);
}
