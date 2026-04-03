import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TenantStatus } from '../../../../core/models/enums';
import { Tenant } from '../../../../core/models/tenant';
import { TenantFormComponent } from '../../components/tenant-form/tenant-form.component';
import { TenantTableComponent } from '../../components/tenant-table/tenant-table.component';
import { TenantService } from '../../services/tenant.service';

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
  imports: [TenantTableComponent, TenantFormComponent],
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
  readonly editingTenant = signal<Tenant | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly tenantStatusActive = TenantStatus.active;

  ngOnInit(): void {
    this.loadTenants();
  }

  onTenantSelected(tenantId: string): void {
    this.selectedTenantId.set(tenantId);
    void this.router.navigate(['/admin/tenants', tenantId]);
  }

  onEditTenantRequested(tenantId: string): void {
    const tenant = this.tenants().find((item) => item.tenantId === tenantId) ?? null;
    this.showCreateForm.set(false);
    this.editingTenant.set(tenant);
  }

  openCreateTenantForm(): void {
    if (this.editingTenant()) {
      this.editingTenant.set(null);
      this.showCreateForm.set(true);
      return;
    }

    this.showCreateForm.set(!this.showCreateForm());
  }

  onDeleteTenantRequested(tenantId: string): void {
    const confirmed = globalThis.confirm('Confermare eliminazione tenant?');
    if (!confirmed) {
      return;
    }

    this.errorMessage.set(null);
    this.isSaving.set(true);

    this.tenantService.deleteTenant(tenantId).subscribe({
      next: () => {
        this.isSaving.set(false);
        if (this.selectedTenantId() === tenantId) {
          this.selectedTenantId.set(null);
        }
        this.loadTenants();
      },
      error: () => {
        this.isSaving.set(false);
        this.errorMessage.set('Impossibile eliminare il tenant.');
      },
    });
  }

  onCreateRequested(payload: CreateTenantRequestPayload): void {
    this.errorMessage.set(null);
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
          this.errorMessage.set('Impossibile creare il tenant.');
        },
      });
  }

  onUpdateRequested(payload: UpdateTenantRequestPayload): void {
    this.errorMessage.set(null);
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
          this.errorMessage.set('Impossibile aggiornare il tenant.');
        },
      });
  }

  onCancelEdit(): void {
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
        this.errorMessage.set('Impossibile caricare i tenant.');
      },
    });
  }
}
