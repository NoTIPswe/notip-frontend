import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { Logs } from '../../../../../core/models/audit';
import { AuditLogTableComponent } from './audit-log-table.component';

describe('AuditLogTableComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<AuditLogTableComponent>>;

  const logs: Logs[] = [
    {
      id: 'log-1',
      userId: 'user-1',
      action: 'login',
      resource: 'auth',
      details: 'ok',
      timestamp: '2026-04-07T10:15:30.000Z',
    },
    {
      id: 'log-2',
      userId: 'user-2',
      action: 'create',
      resource: 'tenant',
      details: 'tenant-1',
      timestamp: '2026-04-07T11:15:30.000Z',
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuditLogTableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditLogTableComponent);
  });

  it('shows loading status while loading', () => {
    fixture.componentRef.setInput('isLoading', true);
    fixture.detectChanges();

    const status = (fixture.nativeElement as HTMLElement).querySelector('.status');
    expect(status?.textContent).toContain('Loading...');
  });

  it('shows empty state when no logs are available', () => {
    fixture.componentRef.setInput('isLoading', false);
    fixture.componentRef.setInput('logs', []);
    fixture.detectChanges();

    const empty = (fixture.nativeElement as HTMLElement).querySelector('.empty');
    expect(empty?.textContent).toContain('No logs available.');
  });

  it('renders one table row for each audit log', () => {
    fixture.componentRef.setInput('logs', logs);
    fixture.detectChanges();

    const rows = (fixture.nativeElement as HTMLElement).querySelectorAll('tbody tr');

    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('user-1');
    expect(rows[1].textContent).toContain('tenant-1');
  });
});
