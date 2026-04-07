import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError, toArray } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CommandsService as CommandsApiService } from '../../../generated/openapi/notip-management-api-openapi';
import { CmdGatewayStatus, CommandStatus } from '../../../core/models/enums';
import { CommandService } from './command.service';

describe('CommandService', () => {
  let service: CommandService;

  const apiMock = {
    commandControllerSendConfig: vi.fn(),
    commandControllerSendFirmware: vi.fn(),
    commandControllerGetStatus: vi.fn(),
  };

  beforeEach(async () => {
    vi.useFakeTimers();

    apiMock.commandControllerSendConfig.mockReset();
    apiMock.commandControllerSendFirmware.mockReset();
    apiMock.commandControllerGetStatus.mockReset();

    await TestBed.configureTestingModule({
      providers: [CommandService, { provide: CommandsApiService, useValue: apiMock }],
    }).compileComponents();

    service = TestBed.inject(CommandService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends config with allowed status and then polls command status', async () => {
    apiMock.commandControllerSendConfig.mockReturnValue(
      of({ command_id: 'cmd-1', status: 'queued', issued_at: 't0' }),
    );

    const pollSpy = vi
      .spyOn(service, 'pollStatus')
      .mockReturnValue(of({ commandId: 'cmd-1', status: CommandStatus.ack, timestamp: 't1' }));

    await expect(
      firstValueFrom(
        service.sendConfig('gw-1', {
          send_frequency_ms: 1000,
          status: CmdGatewayStatus.online,
        }),
      ),
    ).resolves.toEqual({ commandId: 'cmd-1', status: CommandStatus.ack, timestamp: 't1' });

    expect(apiMock.commandControllerSendConfig).toHaveBeenCalledWith('gw-1', {
      send_frequency_ms: 1000,
      status: CmdGatewayStatus.online,
    });
    expect(pollSpy).toHaveBeenCalledWith('gw-1', 'cmd-1');
  });

  it('ignores disallowed gateway status in sendConfig payload', async () => {
    apiMock.commandControllerSendConfig.mockReturnValue(
      of({ command_id: 'cmd-2', status: 'queued', issued_at: 't0' }),
    );

    vi.spyOn(service, 'pollStatus').mockReturnValue(
      of({ commandId: 'cmd-2', status: CommandStatus.ack }),
    );

    await firstValueFrom(
      service.sendConfig('gw-2', {
        send_frequency_ms: 2000,
        status: 'offline' as CmdGatewayStatus,
      }),
    );

    expect(apiMock.commandControllerSendConfig).toHaveBeenCalledWith('gw-2', {
      send_frequency_ms: 2000,
    });
  });

  it('omits config payload fields when frequency is invalid and status is not a string', async () => {
    apiMock.commandControllerSendConfig.mockReturnValue(
      of({ command_id: 'cmd-empty', status: 'queued' }),
    );

    vi.spyOn(service, 'pollStatus').mockReturnValue(
      of({ commandId: 'cmd-empty', status: CommandStatus.ack }),
    );

    await firstValueFrom(
      service.sendConfig('gw-empty', {
        send_frequency_ms: Number.NaN,
        status: 123 as unknown as CmdGatewayStatus,
      }),
    );

    expect(apiMock.commandControllerSendConfig).toHaveBeenCalledWith('gw-empty', {});
  });

  it('sends firmware and then polls status', async () => {
    apiMock.commandControllerSendFirmware.mockReturnValue(
      of({ command_id: 'cmd-fw', status: 'queued', issued_at: 't0' }),
    );

    const pollSpy = vi
      .spyOn(service, 'pollStatus')
      .mockReturnValue(of({ commandId: 'cmd-fw', status: CommandStatus.nack }));

    await firstValueFrom(
      service.sendFirmware('gw-1', {
        firmware_version: '2.0.1',
        download_url: 'https://example.test/fw.bin',
      }),
    );

    expect(apiMock.commandControllerSendFirmware).toHaveBeenCalledWith('gw-1', {
      firmware_version: '2.0.1',
      download_url: 'https://example.test/fw.bin',
    });
    expect(pollSpy).toHaveBeenCalledWith('gw-1', 'cmd-fw');
  });

  it('maps 404 and 503 polling errors to timeout status', async () => {
    apiMock.commandControllerGetStatus.mockReturnValue(throwError(() => ({ status: 404 })));

    const timeoutUpdatePromise = firstValueFrom(service.pollStatus('gw-1', 'cmd-404', 100));
    vi.advanceTimersByTime(100);

    await expect(timeoutUpdatePromise).resolves.toEqual({
      commandId: 'cmd-404',
      status: CommandStatus.timeout,
    });

    apiMock.commandControllerGetStatus.mockReturnValue(throwError(() => ({ status: 503 })));

    const timeout503Promise = firstValueFrom(service.pollStatus('gw-1', 'cmd-503', 100));
    vi.advanceTimersByTime(100);

    await expect(timeout503Promise).resolves.toEqual({
      commandId: 'cmd-503',
      status: CommandStatus.timeout,
    });
  });

  it('rethrows polling errors that are not handled', async () => {
    const backendError = { status: 500, message: 'internal error' };
    apiMock.commandControllerGetStatus.mockReturnValue(throwError(() => backendError));

    const pollPromise = firstValueFrom(service.pollStatus('gw-1', 'cmd-500', 100));
    vi.advanceTimersByTime(100);

    await expect(pollPromise).rejects.toBe(backendError);
  });

  it('keeps last known status on 304 polling responses', async () => {
    apiMock.commandControllerGetStatus
      .mockReturnValueOnce(of({ command_id: 'cmd-304', status: 'queued', timestamp: 't1' }))
      .mockReturnValueOnce(throwError(() => ({ status: 304 })))
      .mockReturnValueOnce(of({ command_id: 'cmd-304', status: 'ack', timestamp: 't2' }));

    const updatesPromise = firstValueFrom(
      service.pollStatus('gw-1', 'cmd-304', 100).pipe(toArray()),
    );

    vi.advanceTimersByTime(350);

    await expect(updatesPromise).resolves.toEqual([
      { commandId: 'cmd-304', status: CommandStatus.queued, timestamp: 't1' },
      { commandId: 'cmd-304', status: CommandStatus.queued, timestamp: 't1' },
      { commandId: 'cmd-304', status: CommandStatus.ack, timestamp: 't2' },
    ]);
  });

  it('polls until terminal status and includes final emission', async () => {
    apiMock.commandControllerGetStatus
      .mockReturnValueOnce(of({ command_id: 'cmd-3', status: 'queued', timestamp: 't1' }))
      .mockReturnValueOnce(of({ command_id: 'cmd-3', status: 'ack', timestamp: 't2' }));

    const updatesPromise = firstValueFrom(service.pollStatus('gw-1', 'cmd-3', 100).pipe(toArray()));

    vi.advanceTimersByTime(250);

    await expect(updatesPromise).resolves.toEqual([
      { commandId: 'cmd-3', status: CommandStatus.queued, timestamp: 't1' },
      { commandId: 'cmd-3', status: CommandStatus.ack, timestamp: 't2' },
    ]);
  });

  it('maps terminal status values nack and expired', async () => {
    apiMock.commandControllerGetStatus
      .mockReturnValueOnce(of({ command_id: 'cmd-4', status: 'nack', timestamp: 't1' }))
      .mockReturnValueOnce(of({ command_id: 'cmd-5', status: 'expired', timestamp: 't2' }));

    const nackPromise = firstValueFrom(service.pollStatus('gw-1', 'cmd-4', 100));
    vi.advanceTimersByTime(100);
    await expect(nackPromise).resolves.toEqual({
      commandId: 'cmd-4',
      status: CommandStatus.nack,
      timestamp: 't1',
    });

    const expiredPromise = firstValueFrom(service.pollStatus('gw-1', 'cmd-5', 100));
    vi.advanceTimersByTime(100);
    await expect(expiredPromise).resolves.toEqual({
      commandId: 'cmd-5',
      status: CommandStatus.expired,
      timestamp: 't2',
    });
  });

  it('throws when command response does not include command id', async () => {
    apiMock.commandControllerSendFirmware.mockReturnValue(
      of({ commandId: 'missing_snake_case_id', status: 'queued' }),
    );

    await expect(
      firstValueFrom(
        service.sendFirmware('gw-7', {
          firmware_version: '2.1.0',
          download_url: 'https://example.test/fw-v2.bin',
        }),
      ),
    ).rejects.toThrowError('Invalid command response: missing command id');
  });
});
