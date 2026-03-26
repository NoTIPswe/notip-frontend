import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AuditLogService as AuditLogApiService } from '../../../../generated/openapi/notip-management-api-openapi';
import { Logs, LogsFilter } from '../../../../core/models/audit';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly auditApi = inject(AuditLogApiService);

  getLogs(lf: LogsFilter): Observable<Logs[]> {
    return this.auditApi
      .auditLogControllerGetAuditLogs(lf.from, lf.to, lf.userId.join(','), lf.actions.join(','))
      .pipe(
        map((rows) =>
          (rows as Record<string, unknown>[]).map((row) => {
            const mapped: Logs = {
              id: this.asString(row['id']),
              userId: this.asString(row['user_id']),
              action: this.asString(row['action']),
              timestamp: this.asString(row['timestamp']),
            };

            if (row['resource']) {
              mapped.resource = this.asString(row['resource']);
            }
            if (row['details']) {
              mapped.details = this.asString(row['details']);
            }

            return mapped;
          }),
        ),
      );
  }

  private asString(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }
}
