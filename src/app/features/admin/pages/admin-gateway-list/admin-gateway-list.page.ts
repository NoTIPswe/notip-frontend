import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  AdminGatewayFormComponent,
  CreateAdminGatewayPayload,
} from '../../components/admin-gateway-form/admin-gateway-form.component';
import { AdminGatewayTableComponent } from '../../components/admin-gateway-table/admin-gateway-table.component';
import { ObfuscatedGateway } from '../../../../core/models/gateway';
import { AdminGatewayService } from '../../services/admin-gateway.service';
import { TenantService } from '../../services/tenant.service';
import { ModalLayerComponent } from '../../../../shared/components/modal-layer/modal-layer.component';
import { MultiSelectDropdownComponent } from '../../../../shared/components/multi-select-dropdown/multi-select-dropdown.component';

@Component({
  selector: 'app-admin-gateway-list-page',
  standalone: true,
  imports: [
    AdminGatewayTableComponent,
    AdminGatewayFormComponent,
    ModalLayerComponent,
    MultiSelectDropdownComponent,
  ],
  templateUrl: './admin-gateway-list.page.html',
  styleUrl: './admin-gateway-list.page.css',
})
export class AdminGatewayListPageComponent implements OnInit {
  private readonly adminGatewayService = inject(AdminGatewayService);
  private readonly tenantService = inject(TenantService);

  readonly gateways = signal<ObfuscatedGateway[]>([]);
  readonly tenantOptions = signal<string[]>([]);
  readonly selectedTenantIds = signal<string[]>([]);
  readonly draftTenantIds = signal<string[]>([]);
  readonly showCreateForm = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly formErrorMessage = signal<string | null>(null);
  readonly infoMessage = signal<string | null>(null);

  readonly filteredGateways = computed(() => {
    const selectedTenants = this.selectedTenantIds();

    if (selectedTenants.length === 0) {
      return this.gateways();
    }

    return this.gateways().filter((gateway) => selectedTenants.includes(gateway.tenantId));
  });

  ngOnInit(): void {
    this.loadGateways();
    this.loadTenantOptions();
  }

  onApplyFilter(event: Event): void {
    event.preventDefault();
    this.selectedTenantIds.set([...this.draftTenantIds()]);
  }

  onTenantFilterSelectionChanged(tenantIds: string[]): void {
    this.draftTenantIds.set(this.normalizeList(tenantIds));
  }

  onResetFilter(): void {
    this.draftTenantIds.set([]);
    this.selectedTenantIds.set([]);
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

    this.adminGatewayService.getGateways().subscribe({
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
        this.draftTenantIds.update((selected) =>
          selected.filter((tenantId) => tenantIds.includes(tenantId)),
        );
        this.selectedTenantIds.update((selected) =>
          selected.filter((tenantId) => tenantIds.includes(tenantId)),
        );
      },
      error: () => {
        this.tenantOptions.set([]);
      },
    });
  }

  private normalizeList(values: string[]): string[] {
    const unique = new Set<string>();

    for (const value of values) {
      const normalized = value.trim();
      if (normalized.length === 0) {
        continue;
      }

      unique.add(normalized);
    }

    return Array.from(unique);
  }
}
