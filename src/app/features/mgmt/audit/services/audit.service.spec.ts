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
          userId: 'u-1',
          action: 'CREATE',
          timestamp: '2026-03-31T11:00:00.000Z',
          resource: 'tenant',
          details: { message: 'created tenant' },
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
        details: '{"message":"created tenant"}',
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
        details: '[]',
      },
    ]);
  });

  it('maps user id from snake_case payloads', async () => {
    apiMock.auditLogControllerGetAuditLogs.mockReturnValue(
      of([
        {
          id: 'log-2',
          user_id: 'u-2',
          action: 'DELETE',
          timestamp: '2026-03-31T12:00:00.000Z',
          resource: 'gateway',
          details: { message: 'deleted gateway' },
        },
      ]),
    );

    await expect(firstValueFrom(service.getLogs({ from: 'f', to: 't' }))).resolves.toEqual([
      {
        id: 'log-2',
        userId: 'u-2',
        action: 'DELETE',
        timestamp: '2026-03-31T12:00:00.000Z',
        resource: 'gateway',
        details: '{"message":"deleted gateway"}',
      },
    ]);
  });

  it('maps primitive details values to empty string', async () => {
    apiMock.auditLogControllerGetAuditLogs.mockReturnValue(
      of([
        {
          id: 'log-3',
          userId: 'u-3',
          action: 'UPDATE',
          timestamp: '2026-03-31T13:00:00.000Z',
          resource: 'tenant',
          details: 42,
        },
      ]),
    );

    await expect(firstValueFrom(service.getLogs({ from: 'f', to: 't' }))).resolves.toEqual([
      {
        id: 'log-3',
        userId: 'u-3',
        action: 'UPDATE',
        timestamp: '2026-03-31T13:00:00.000Z',
        resource: 'tenant',
        details: '',
      },
    ]);
  });

  it('returns empty details when object serialization fails', async () => {
    const circularDetails: Record<string, unknown> = {};
    (circularDetails as { self?: unknown }).self = circularDetails;

    apiMock.auditLogControllerGetAuditLogs.mockReturnValue(
      of([
        {
          id: 'log-4',
          userId: 'u-4',
          action: 'UPDATE',
          timestamp: '2026-03-31T14:00:00.000Z',
          resource: 'gateway',
          details: circularDetails,
        },
      ]),
    );

    await expect(firstValueFrom(service.getLogs({ from: 'f', to: 't' }))).resolves.toEqual([
      {
        id: 'log-4',
        userId: 'u-4',
        action: 'UPDATE',
        timestamp: '2026-03-31T14:00:00.000Z',
        resource: 'gateway',
        details: '',
      },
    ]);
  });
});
