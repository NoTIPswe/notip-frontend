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
  readonly userIdOptions = signal<string[]>([]);
  readonly actionOptions = signal<string[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly isExporting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly from = signal<string>(this.toDatetimeLocal(new Date(Date.now() - 24 * 60 * 60 * 1000)));
  readonly to = signal<string>(this.toDatetimeLocal(new Date()));
  readonly userIds = signal<string[]>([]);
  readonly actions = signal<string[]>([]);

  ngOnInit(): void {
    this.loadLogs();
  }

  applyFilters(form: AuditFilterFormValue): void {
    this.from.set(form.from);
    this.to.set(form.to);
    this.userIds.set(this.normalizeList(form.userIds));
    this.actions.set(this.normalizeList(form.actions));
    this.loadLogs();
  }

  resetFilters(): void {
    this.from.set(this.toDatetimeLocal(new Date(Date.now() - 24 * 60 * 60 * 1000)));
    this.to.set(this.toDatetimeLocal(new Date()));
    this.userIds.set([]);
    this.actions.set([]);
    this.loadLogs();
  }

  canExportLogs(): boolean {
    return this.logs().length > 0 && !this.isLoading() && !this.isExporting();
  }

  onExportLogs(): void {
    if (!this.canExportLogs()) {
      return;
    }

    this.isExporting.set(true);

    try {
      this.downloadAsCsv(this.logs());
    } finally {
      this.isExporting.set(false);
    }
  }

  private loadLogs(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.auditService
      .getLogs({
        from: this.toIsoOrNow(this.from()),
        to: this.toIsoOrNow(this.to()),
        userId: this.userIds(),
        actions: this.actions(),
      })
      .subscribe({
        next: (rows) => {
          this.isLoading.set(false);
          this.logs.set(rows);
          this.refreshFilterOptions(rows);
        },
        error: () => {
          this.isLoading.set(false);
          this.errorMessage.set('Unable to load audit logs.');
        },
      });
  }

  private refreshFilterOptions(rows: Logs[]): void {
    const userIds = new Set<string>(this.userIds());
    const actions = new Set<string>(this.actions());

    for (const row of rows) {
      const userId = row.userId.trim();
      if (userId.length > 0) {
        userIds.add(userId);
      }

      const action = row.action.trim();
      if (action.length > 0) {
        actions.add(action);
      }
    }

    this.userIdOptions.set(Array.from(userIds).sort((a, b) => a.localeCompare(b)));
    this.actionOptions.set(Array.from(actions).sort((a, b) => a.localeCompare(b)));
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

  private toIsoOrNow(value: string): string {
    return fromRomeDateTimeInputToIso(value) ?? new Date().toISOString();
  }

  private toDatetimeLocal(value: Date): string {
    return toRomeDateTimeInput(value);
  }

  private downloadAsCsv(rows: Logs[]): void {
    const header = ['timestamp', 'userId', 'action', 'resource', 'details'];
    const body = rows.map((row) => [
      row.timestamp,
      row.userId,
      row.action,
      row.resource,
      row.details,
    ]);

    const csv = [
      header.join(','),
      ...body.map((line) => line.map((value) => this.escapeCsv(value)).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `system-logs-export-${new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')}.csv`;
    anchor.click();

    URL.revokeObjectURL(url);
  }

  private escapeCsv(value: unknown): string {
    let raw = '';

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      raw = String(value);
    } else if (value != null) {
      raw = JSON.stringify(value);
    }

    if (!/[",\n]/.test(raw)) {
      return raw;
    }

    return `"${raw.replaceAll('"', '""')}"`;
  }
}
