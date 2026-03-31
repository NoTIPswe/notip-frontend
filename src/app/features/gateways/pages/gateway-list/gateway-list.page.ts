import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { GatewayCardComponent } from '../../components/gateway-card/gateway-card.component';
import { Gateway } from '../../../../core/models/gateway';
import { GatewayService } from '../../services/gateway.service';

@Component({
  selector: 'app-gateway-list-page',
  standalone: true,
  imports: [GatewayCardComponent],
  templateUrl: './gateway-list.page.html',
  styleUrl: './gateway-list.page.css',
})
export class GatewayListPageComponent implements OnInit {
  private readonly gatewayService = inject(GatewayService);
  private readonly router = inject(Router);

  readonly gateways = signal<Gateway[]>([]);
  readonly selectedGatewayId = signal<string | null>(null);
  readonly isLoading = this.gatewayService.isLoading();
  readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadGateways();
  }

  onGatewaySelected(gatewayId: string): void {
    this.selectedGatewayId.set(gatewayId);
    void this.router.navigate(['/gateways', gatewayId]);
  }

  private loadGateways(): void {
    this.errorMessage.set(null);

    this.gatewayService
      .getGateways()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (rows) => {
          this.gateways.set(rows);
        },
        error: () => {
          this.errorMessage.set('Impossibile caricare la lista gateway.');
        },
      });
  }
}
