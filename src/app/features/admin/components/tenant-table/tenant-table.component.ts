import { Component, input, output } from '@angular/core';
import { Tenant } from '../../../../core/models/tenant';

@Component({
  selector: 'app-tenant-table',
  standalone: true,
  templateUrl: './tenant-table.component.html',
  styleUrl: './tenant-table.component.css',
})
export class TenantTableComponent {
  readonly tenants = input<Tenant[]>([]);
  readonly selectedTenantId = input<string | null>(null);
  readonly isLoading = input<boolean>(false);

  readonly selected = output<string>();
  readonly editRequested = output<string>();
  readonly deleteRequested = output<string>();

  onSelect(tenantId: string): void {
    this.selected.emit(tenantId);
  }

  onEdit(tenantId: string, event: Event): void {
    event.stopPropagation();
    this.editRequested.emit(tenantId);
  }

  onDelete(tenantId: string, event: Event): void {
    event.stopPropagation();
    this.deleteRequested.emit(tenantId);
  }
}
