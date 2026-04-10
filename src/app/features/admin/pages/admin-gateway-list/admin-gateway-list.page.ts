import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AdminGatewayFormComponent,
  CreateAdminGatewayPayload,
} from '../../components/admin-gateway-form/admin-gateway-form.component';
import { AdminGatewayTableComponent } from '../../components/admin-gateway-table/admin-gateway-table.component';
import { ObfuscatedGateway } from '../../../../core/models/gateway';
import { AdminGatewayService } from '../../services/admin-gateway.service';
import { TenantService } from '../../services/tenant.service';
import { ModalLayerComponent } from '../../../../shared/components/modal-layer/modal-layer.component';

@Component({
  selector: 'app-admin-gateway-list-page',
  standalone: true,
  imports: [AdminGatewayTableComponent, AdminGatewayFormComponent, ModalLayerComponent],
  templateUrl: './admin-gateway-list.page.html',
  styleUrl: './admin-gateway-list.page.css',
})
export class AdminGatewayListPageComponent implements OnInit {
  private readonly adminGatewayService = inject(AdminGatewayService);
  private readonly tenantService = inject(TenantService);

  readonly gateways = signal<ObfuscatedGateway[]>([]);
  readonly tenantOptions = signal<string[]>([]);
  readonly tenantFilter = signal<string>('');
  readonly showCreateForm = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly formErrorMessage = signal<string | null>(null);
  readonly infoMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadGateways();
    this.loadTenantOptions();
  }

  onApplyFilter(event: Event, tenantId: string): void {
    event.preventDefault();
    this.tenantFilter.set(tenantId.trim());
    this.loadGateways();
  }

  onResetFilter(): void {
    this.tenantFilter.set('');
    this.loadGateways();
  }

  toggleCreateForm(): void {
    this.formErrorMessage.set(null);
    this.showCreateForm.set(!this.showCreateForm());
  }

  onCreateCancelled(): void {
    this.formErrorMessage.set(null);
    this.showCreateForm.set(false);
  }

  onCreateGateway(payload: CreateAdminGatewayPayload): void {
    this.formErrorMessage.set(null);
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
          this.infoMessage.set(`Gateway created with id ${id}.`);
          this.loadGateways();
        },
        error: () => {
          this.isSaving.set(false);
          this.formErrorMessage.set('Unable to create gateway.');
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
        this.errorMessage.set('Unable to load admin gateways.');
      },
    });
  }

  private loadTenantOptions(): void {
    this.tenantService.getTenants().subscribe({
      next: (rows) => {
        const tenantIds = rows
          .map((row) => row.tenantId)
          .filter((tenantId) => tenantId.length > 0)
          .sort((a, b) => a.localeCompare(b));

        this.tenantOptions.set(tenantIds);
      },
      error: () => {
        this.tenantOptions.set([]);
      },
    });
  }
}
