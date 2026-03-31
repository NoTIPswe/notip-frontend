import { TestBed } from '@angular/core/testing';
import { lastValueFrom, Subject, toArray } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SESSION_LIFECYCLE } from '../auth/contracts';
import { TelemetryEnvelope } from '../models/measure';
import { CryptoKeyService } from './crypto-key.service';
import { WorkerOrchestratorService } from './worker-orchestrator.service';

describe('WorkerOrchestratorService', () => {
  let service: WorkerOrchestratorService;
  let sessionLogout$: Subject<void>;

  const cryptoKeyServiceMock = {
    isImpersonating: vi.fn(),
  };

  const envelope: TelemetryEnvelope = {
    gatewayId: 'gw-1',
    sensorId: 's-1',
    sensorType: 'temperature',
    timestamp: '2026-03-31T10:00:00.000Z',
    keyVersion: 1,
    encryptedData: 'enc',
    iv: 'iv',
    authTag: 'tag',
    unit: 'C',
  };

  beforeEach(async () => {
    sessionLogout$ = new Subject<void>();
    cryptoKeyServiceMock.isImpersonating.mockReset();
    cryptoKeyServiceMock.isImpersonating.mockReturnValue(false);

    await TestBed.configureTestingModule({
      providers: [
        WorkerOrchestratorService,
        { provide: CryptoKeyService, useValue: cryptoKeyServiceMock },
        { provide: SESSION_LIFECYCLE, useValue: { logout$: sessionLogout$, logout: vi.fn() } },
      ],
    }).compileComponents();

    service = TestBed.inject(WorkerOrchestratorService);
  });

  it('marks orchestrator as ready on create and spawn', async () => {
    expect(service.isReady()()).toBe(false);

    await expect(service.createOrchestrator()).resolves.toBeUndefined();
    expect(service.isReady()()).toBe(true);

    service.spawnWorker();
    expect(service.isReady()()).toBe(true);
  });

  it('tracks key initialization state based on payload', async () => {
    await expect(lastValueFrom(service.initializeKeys({}))).resolves.toBeUndefined();
    expect(service.keysInitialized()()).toBe(false);

    await expect(lastValueFrom(service.initializeKeys({ 'gw-1': 'k' }))).resolves.toBeUndefined();
    expect(service.keysInitialized()()).toBe(true);
  });

  it('rejects decryption and emits worker error during impersonation', async () => {
    cryptoKeyServiceMock.isImpersonating.mockReturnValue(true);
    const errors: string[] = [];
    const sub = service.workerError$.subscribe((err) => errors.push(err.code));

    await expect(service.decryptEnvelope(envelope)).rejects.toThrow('IMPERSONATION_ACTIVE');
    expect(errors).toEqual(['WORKER_NOT_READY']);

    sub.unsubscribe();
  });

  it('rejects decryption when keys are not initialized', async () => {
    cryptoKeyServiceMock.isImpersonating.mockReturnValue(false);

    await expect(service.decryptEnvelope(envelope)).rejects.toThrow('WORKER_NOT_READY');
  });

  it('decrypts envelope with placeholder data when keys are initialized', async () => {
    await lastValueFrom(service.initializeKeys({ 'gw-1': 'k' }));

    await expect(service.decryptEnvelope(envelope)).resolves.toMatchObject({
      gatewayId: 'gw-1',
      sensorId: 's-1',
      value: Number.NaN,
      unit: 'C',
    });
  });

  it('decryptBatch reports full failures while impersonating', async () => {
    cryptoKeyServiceMock.isImpersonating.mockReturnValue(true);

    await expect(lastValueFrom(service.decryptBatch([envelope]))).resolves.toEqual({
      total: 1,
      completed: 1,
      failed: 1,
    });
  });

  it('decryptBatch reports full failures when keys are not initialized', async () => {
    cryptoKeyServiceMock.isImpersonating.mockReturnValue(false);

    await expect(lastValueFrom(service.decryptBatch([envelope, envelope]))).resolves.toEqual({
      total: 2,
      completed: 2,
      failed: 2,
    });
  });

  it('decryptBatch emits progressive results when initialized', async () => {
    await lastValueFrom(service.initializeKeys({ 'gw-1': 'k' }));

    const updates = await lastValueFrom(service.decryptBatch([envelope, envelope]).pipe(toArray()));

    expect(updates).toHaveLength(2);
    expect(updates[0]).toMatchObject({ total: 2, completed: 1, failed: 0 });
    expect(updates[1]).toMatchObject({ total: 2, completed: 2, failed: 0 });
    expect(updates[1].lastDecrypted?.gatewayId).toBe('gw-1');
  });

  it('ping reflects ready state', async () => {
    await expect(service.ping()).resolves.toBe(false);

    service.spawnWorker();

    await expect(service.ping()).resolves.toBe(true);
  });

  it('resets readiness flags on session logout', async () => {
    service.spawnWorker();
    await lastValueFrom(service.initializeKeys({ 'gw-1': 'k' }));

    expect(service.isReady()()).toBe(true);
    expect(service.keysInitialized()()).toBe(true);

    sessionLogout$.next();

    expect(service.isReady()()).toBe(false);
    expect(service.keysInitialized()()).toBe(false);
  });
});
