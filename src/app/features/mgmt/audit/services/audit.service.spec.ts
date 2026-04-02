import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditLogService as AuditLogApiService } from '../../../../generated/openapi/notip-management-api-openapi';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  let service: AuditService;

  const apiMock = {
    auditLogControllerGetAuditLogs: vi.fn(),
  };

  beforeEach(async () => {
    apiMock.auditLogControllerGetAuditLogs.mockReset();

    await TestBed.configureTestingModule({
      providers: [AuditService, { provide: AuditLogApiService, useValue: apiMock }],
    }).compileComponents();

    service = TestBed.inject(AuditService);
  });

  it('joins filters and maps log payload', async () => {
    apiMock.auditLogControllerGetAuditLogs.mockReturnValue(
      of([
        {
          id: 'log-1',
          user_id: 'u-1',
          action: 'CREATE',
          timestamp: '2026-03-31T11:00:00.000Z',
          resource: 'tenant',
          details: 'created tenant',
        },
      ]),
    );

    await expect(
      firstValueFrom(
        service.getLogs({
          from: 'from',
          to: 'to',
          userId: ['u-1', 'u-2'],
          actions: ['CREATE', 'DELETE'],
        }),
      ),
    ).resolves.toEqual([
      {
        id: 'log-1',
        userId: 'u-1',
        action: 'CREATE',
        timestamp: '2026-03-31T11:00:00.000Z',
        resource: 'tenant',
        details: 'created tenant',
      },
    ]);

    expect(apiMock.auditLogControllerGetAuditLogs).toHaveBeenCalledWith(
      'from',
      'to',
      'u-1,u-2',
      'CREATE,DELETE',
    );
  });

  it('maps non-string fields to empty strings', async () => {
    apiMock.auditLogControllerGetAuditLogs.mockReturnValue(
      of([{ id: 1, user_id: null, action: false, timestamp: 0, resource: {}, details: [] }]),
    );

    await expect(firstValueFrom(service.getLogs({ from: 'f', to: 't' }))).resolves.toEqual([
      {
        id: '',
        userId: '',
        action: '',
        timestamp: '',
        resource: '',
        details: '',
      },
    ]);
  });
});
