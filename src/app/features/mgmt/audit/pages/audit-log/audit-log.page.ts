import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AuditFilterFormValue,
  AuditFilterPanelComponent,
} from '../../components/audit-filter-panel/audit-filter-panel.component';
import { AuditLogTableComponent } from '../../components/audit-log-table/audit-log-table.component';
import { Logs } from '../../../../../core/models/audit';
import { AuditService } from '../../services/audit.service';
import {
  fromRomeDateTimeInputToIso,
  toRomeDateTimeInput,
} from '../../../../../shared/utils/rome-timezone.util';

@Component({
  selector: 'app-audit-log-page',
  standalone: true,
  imports: [AuditFilterPanelComponent, AuditLogTableComponent],
  templateUrl: './audit-log.page.html',
  styleUrl: './audit-log.page.css',
})
export class AuditLogPageComponent implements OnInit {
  private readonly auditService = inject(AuditService);

  readonly logs = signal<Logs[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly from = signal<string>(this.toDatetimeLocal(new Date(Date.now() - 24 * 60 * 60 * 1000)));
  readonly to = signal<string>(this.toDatetimeLocal(new Date()));
  readonly userIds = signal<string>('');
  readonly actions = signal<string>('');

  ngOnInit(): void {
    this.loadLogs();
  }

  applyFilters(form: AuditFilterFormValue): void {
    this.from.set(form.from);
    this.to.set(form.to);
    this.userIds.set(form.userIds);
    this.actions.set(form.actions);
    this.loadLogs();
  }

  resetFilters(): void {
    this.from.set(this.toDatetimeLocal(new Date(Date.now() - 24 * 60 * 60 * 1000)));
    this.to.set(this.toDatetimeLocal(new Date()));
    this.userIds.set('');
    this.actions.set('');
    this.loadLogs();
  }

  private loadLogs(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.auditService
      .getLogs({
        from: this.toIsoOrNow(this.from()),
        to: this.toIsoOrNow(this.to()),
        userId: this.parseCsv(this.userIds()),
        actions: this.parseCsv(this.actions()),
      })
      .subscribe({
        next: (rows) => {
          this.isLoading.set(false);
          this.logs.set(rows);
        },
        error: () => {
          this.isLoading.set(false);
          this.errorMessage.set('Unable to load audit logs.');
        },
      });
  }

  private parseCsv(value: string): string[] {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  private toIsoOrNow(value: string): string {
    return fromRomeDateTimeInputToIso(value) ?? new Date().toISOString();
  }

  private toDatetimeLocal(value: Date): string {
    return toRomeDateTimeInput(value);
  }
}
