import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { AuditLogService as AuditLogApiService } from '../../../../generated/openapi/notip-management-api-openapi';
import { Logs, LogsFilter } from '../../../../core/models/audit';

@Injectable({ providedIn: 'root' })
export class AuditService {
  private readonly auditApi = inject(AuditLogApiService);

  getLogs(lf: LogsFilter): Observable<Logs[]> {
    const userIds = (lf.userId ?? []).join(',');
    const actions = (lf.actions ?? []).join(',');

    return this.auditApi.auditLogControllerGetAuditLogs(lf.from, lf.to, userIds, actions).pipe(
      map((rows) =>
        (rows as Record<string, unknown>[]).map((row) => ({
          id: this.asString(row['id']),
          userId: this.asString(row['user_id']),
          action: this.asString(row['action']),
          timestamp: this.asString(row['timestamp']),
          resource: this.asString(row['resource']),
          details: this.asDetails(row['details']),
        })),
      ),
    );
  }

  private asString(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private asDetails(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }

    if (value && typeof value === 'object') {
      try {
        return JSON.stringify(value);
      } catch {
        return '';
      }
    }

    return '';
  }
}
