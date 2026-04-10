import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TenantStatus } from '../../../../core/models/enums';
import { Tenant } from '../../../../core/models/tenant';
import { TenantFormComponent } from '../../components/tenant-form/tenant-form.component';
import { TenantTableComponent } from '../../components/tenant-table/tenant-table.component';
import { TenantService } from '../../services/tenant.service';
import { ModalLayerComponent } from '../../../../shared/components/modal-layer/modal-layer.component';
import { DeleteConfirmModalComponent } from '../../../../shared/components/delete-confirm-modal/delete-confirm-modal.component';

type CreateTenantRequestPayload = {
  name: string;
  adminEmail: string;
  adminName: string;
  adminPassword: string;
};

type UpdateTenantRequestPayload = {
  tenantId: string;
  name: string;
  status: TenantStatus;
  suspensionIntervalDays: number;
};

@Component({
  selector: 'app-tenant-manager-page',
  standalone: true,
  imports: [
    TenantTableComponent,
    TenantFormComponent,
    ModalLayerComponent,
    DeleteConfirmModalComponent,
  ],
  templateUrl: './tenant-manager.page.html',
  styleUrl: './tenant-manager.page.css',
})
export class TenantManagerPageComponent implements OnInit {
  private readonly tenantService = inject(TenantService);
  private readonly router = inject(Router);

  readonly tenants = signal<Tenant[]>([]);
  readonly showCreateForm = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly selectedTenantId = signal<string | null>(null);
  readonly deletingTenantId = signal<string | null>(null);
  readonly editingTenant = signal<Tenant | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly formErrorMessage = signal<string | null>(null);
  readonly tenantStatusActive = TenantStatus.active;

  ngOnInit(): void {
    this.loadTenants();
  }

  onTenantSelected(tenantId: string): void {
    this.selectedTenantId.set(tenantId);
    void this.router.navigate(['/admin/tenants', tenantId, 'users']);
  }

  onEditTenantRequested(tenantId: string): void {
    const tenant = this.tenants().find((item) => item.tenantId === tenantId) ?? null;
    this.showCreateForm.set(false);
    this.editingTenant.set(tenant);
    this.formErrorMessage.set(null);
  }

  openCreateTenantForm(): void {
    if (this.editingTenant()) {
      this.editingTenant.set(null);
      this.showCreateForm.set(true);
      this.formErrorMessage.set(null);
      return;
    }

    this.showCreateForm.set(!this.showCreateForm());
    this.formErrorMessage.set(null);
  }

  onDeleteTenantRequested(tenantId: string): void {
    this.deletingTenantId.set(tenantId);
  }

  cancelDeleteTenant(): void {
    this.deletingTenantId.set(null);
  }

  confirmDeleteTenant(): void {
    const tenantId = this.deletingTenantId();
    if (!tenantId) {
      return;
    }

    this.errorMessage.set(null);
    this.isSaving.set(true);

    this.tenantService.deleteTenant(tenantId).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.deletingTenantId.set(null);
        if (this.selectedTenantId() === tenantId) {
          this.selectedTenantId.set(null);
        }
        this.loadTenants();
      },
      error: () => {
        this.isSaving.set(false);
        this.errorMessage.set('Unable to delete tenant.');
      },
    });
  }

  onCreateRequested(payload: CreateTenantRequestPayload): void {
    this.formErrorMessage.set(null);
    this.isSaving.set(true);

    this.tenantService
      .createTenant({
        name: payload.name,
        adminEmail: payload.adminEmail,
        adminName: payload.adminName,
        adminPassword: payload.adminPassword,
      })
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.showCreateForm.set(false);
          this.loadTenants();
        },
        error: () => {
          this.isSaving.set(false);
          this.formErrorMessage.set('Unable to create tenant.');
        },
      });
  }

  onUpdateRequested(payload: UpdateTenantRequestPayload): void {
    this.formErrorMessage.set(null);
    this.isSaving.set(true);

    this.tenantService
      .updateTenant(payload.tenantId, {
        name: payload.name,
        status: payload.status,
        suspensionIntervalDays: payload.suspensionIntervalDays,
      })
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.showCreateForm.set(false);
          this.editingTenant.set(null);
          this.loadTenants();
        },
        error: () => {
          this.isSaving.set(false);
          this.formErrorMessage.set('Unable to update tenant.');
        },
      });
  }

  onCancelEdit(): void {
    this.formErrorMessage.set(null);
    this.editingTenant.set(null);
    this.showCreateForm.set(false);
  }

  private loadTenants(): void {
    this.errorMessage.set(null);
    this.isLoading.set(true);

    this.tenantService.getTenants().subscribe({
      next: (rows) => {
        this.isLoading.set(false);
        this.tenants.set(rows);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Unable to load tenants.');
      },
    });
  }
}
