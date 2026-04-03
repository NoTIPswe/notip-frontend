import { Component, input, output } from '@angular/core';
import { TenantStatus } from '../../../../core/models/enums';

export interface CreateTenantPayload {
  name: string;
  adminEmail: string;
  adminName: string;
  adminPassword: string;
}

export interface UpdateTenantPayload {
  tenantId: string;
  name: string;
  status: TenantStatus;
  suspensionIntervalDays: number;
}

@Component({
  selector: 'app-tenant-form',
  standalone: true,
  templateUrl: './tenant-form.component.html',
  styleUrl: './tenant-form.component.css',
})
export class TenantFormComponent {
  readonly tenantId = input<string | null>(null);
  readonly initialName = input<string>('');
  readonly initialStatus = input<TenantStatus>(TenantStatus.active);
  readonly initialSuspensionIntervalDays = input<number>(0);
  readonly isSaving = input<boolean>(false);
  readonly tenantStatusSuspended = TenantStatus.suspended;

  readonly tenantStatusOptions: ReadonlyArray<{ value: TenantStatus; label: string }> = [
    { value: TenantStatus.active, label: 'Attivo' },
    { value: TenantStatus.suspended, label: 'Sospeso' },
  ];

  readonly createRequested = output<CreateTenantPayload>();
  readonly updateRequested = output<UpdateTenantPayload>();
  readonly cancelRequested = output<void>();

  onCreateSubmit(
    event: Event,
    name: string,
    email: string,
    adminName: string,
    password: string,
  ): void {
    event.preventDefault();

    this.createRequested.emit({
      name: name.trim(),
      adminEmail: email.trim(),
      adminName: adminName.trim(),
      adminPassword: password,
    });
  }

  onUpdateSubmit(
    event: Event,
    name: string,
    statusRaw: string,
    suspensionIntervalDaysRaw: number,
  ): void {
    event.preventDefault();

    const id = this.tenantId();
    if (!id) {
      return;
    }

    const status = this.normalizeStatus(statusRaw);

    this.updateRequested.emit({
      tenantId: id,
      name: name.trim(),
      status,
      suspensionIntervalDays: this.normalizeSuspensionIntervalDays(
        suspensionIntervalDaysRaw,
        status,
      ),
    });
  }

  onCancel(): void {
    this.cancelRequested.emit();
  }

  private normalizeStatus(statusRaw: string): TenantStatus {
    if (statusRaw === 'suspended') {
      return TenantStatus.suspended;
    }

    return TenantStatus.active;
  }

  private normalizeSuspensionIntervalDays(value: number, status: TenantStatus): number {
    if (status !== TenantStatus.suspended) {
      return 0;
    }

    if (!Number.isFinite(value) || value < 0) {
      return 0;
    }

    return Math.trunc(value);
  }
}
