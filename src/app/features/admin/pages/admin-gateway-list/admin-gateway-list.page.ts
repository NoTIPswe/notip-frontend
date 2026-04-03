import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AdminGatewayFormComponent,
  CreateAdminGatewayPayload,
} from '../../components/admin-gateway-form/admin-gateway-form.component';
import { AdminGatewayTableComponent } from '../../components/admin-gateway-table/admin-gateway-table.component';
import { ObfuscatedGateway } from '../../../../core/models/gateway';
import { AdminGatewayService } from '../../services/admin-gateway.service';

@Component({
  selector: 'app-admin-gateway-list-page',
  standalone: true,
  imports: [AdminGatewayTableComponent, AdminGatewayFormComponent],
  templateUrl: './admin-gateway-list.page.html',
  styleUrl: './admin-gateway-list.page.css',
})
export class AdminGatewayListPageComponent implements OnInit {
  private readonly adminGatewayService = inject(AdminGatewayService);

  readonly gateways = signal<ObfuscatedGateway[]>([]);
  readonly tenantFilter = signal<string>('');
  readonly showCreateForm = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly infoMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadGateways();
  }

  onApplyFilter(tenantId: string): void {
    this.tenantFilter.set(tenantId.trim());
    this.loadGateways();
  }

  onResetFilter(): void {
    this.tenantFilter.set('');
    this.loadGateways();
  }

  toggleCreateForm(): void {
    this.showCreateForm.set(!this.showCreateForm());
  }

  onCreateCancelled(): void {
    this.showCreateForm.set(false);
  }

  onCreateGateway(payload: CreateAdminGatewayPayload): void {
    this.errorMessage.set(null);
    this.infoMessage.set(null);
    this.isSaving.set(true);

    this.adminGatewayService
      .addGateway({
        factoryId: payload.factoryId,
        tenantId: payload.tenantId,
        factoryKey: payload.factoryKey,
        model: payload.model,
      })
      .subscribe({
        next: (id) => {
          this.isSaving.set(false);
          this.showCreateForm.set(false);
          this.infoMessage.set(`Gateway creato con id ${id}.`);
          this.loadGateways();
        },
        error: () => {
          this.isSaving.set(false);
          this.errorMessage.set('Impossibile creare il gateway.');
        },
      });
  }

  private loadGateways(): void {
    this.errorMessage.set(null);
    this.isLoading.set(true);

    const filter = this.tenantFilter();
    const tenantId = filter.length > 0 ? filter : undefined;

    this.adminGatewayService.getGateways(tenantId).subscribe({
      next: (rows) => {
        this.isLoading.set(false);
        this.gateways.set(rows);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Impossibile caricare i gateways admin.');
      },
    });
  }
}
