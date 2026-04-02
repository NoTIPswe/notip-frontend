import { Component, input, output } from '@angular/core';

export interface CreateTenantPayload {
  name: string;
  adminEmail: string;
  adminName: string;
  adminPassword: string;
}

export interface UpdateTenantPayload {
  tenantId: string;
  name: string;
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
  readonly isSaving = input<boolean>(false);

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

  onUpdateSubmit(event: Event, name: string): void {
    event.preventDefault();

    const id = this.tenantId();
    if (!id) {
      return;
    }

    this.updateRequested.emit({
      tenantId: id,
      name: name.trim(),
    });
  }

  onCancel(): void {
    this.cancelRequested.emit();
  }
}
