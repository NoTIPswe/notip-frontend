import { Component, input } from '@angular/core';
import { Logs } from '../../../../../core/models/audit';
import { RomeDateTimePipe } from '../../../../../shared/pipes/rome-date-time.pipe';

@Component({
  selector: 'app-audit-log-table',
  standalone: true,
  imports: [RomeDateTimePipe],
  templateUrl: './audit-log-table.component.html',
  styleUrl: './audit-log-table.component.css',
})
export class AuditLogTableComponent {
  readonly logs = input<Logs[]>([]);
  readonly isLoading = input<boolean>(false);
}
