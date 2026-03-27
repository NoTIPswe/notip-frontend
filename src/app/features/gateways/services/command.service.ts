import { Injectable, inject } from '@angular/core';
import {
  catchError,
  interval,
  map,
  Observable,
  of,
  switchMap,
  takeWhile,
  throwError,
  timeout,
} from 'rxjs';
import {
  CommandsService as CommandsApiService,
  SendConfigRequestDto,
  SendFirmwareRequestDto,
} from '../../../generated/openapi/notip-management-api-openapi';
import { CommandStatus, CommandStatusUpdate } from '../../../core/models/command';
import { GatewayConfig, GatewayFirmware } from '../../../core/models/command';

const TERMINAL_STATUSES = new Set<CommandStatus>([
  CommandStatus.ack,
  CommandStatus.nack,
  CommandStatus.expired,
  CommandStatus.timeout,
]);

@Injectable({ providedIn: 'root' })
export class CommandService {
  private readonly commandsApi = inject(CommandsApiService);

  sendConfig(id: string, config: GatewayConfig): Observable<CommandStatusUpdate> {
    const body: SendConfigRequestDto = {};
    if (typeof config.send_frequency_ms === 'number') {
      body.send_frequency_ms = config.send_frequency_ms;
    }
    if (typeof config.status === 'string') {
      body.status = config.status;
    }

    return this.commandsApi.commandControllerSendConfig(id, body).pipe(
      map((res) => ({
        commandId: res.command_id,
        status: this.toCommandStatus(res.status),
        timestamp: res.issued_at,
      })),
      switchMap((first) => this.pollStatus(id, first.commandId)),
    );
  }

  sendFirmware(id: string, firmware: GatewayFirmware): Observable<CommandStatusUpdate> {
    const body: SendFirmwareRequestDto = {
      firmware_version: firmware.firmware_version,
      download_url: firmware.download_url,
    };

    return this.commandsApi.commandControllerSendFirmware(id, body).pipe(
      map((res) => ({
        commandId: res.command_id,
        status: this.toCommandStatus(res.status),
        timestamp: res.issued_at,
      })),
      switchMap((first) => this.pollStatus(id, first.commandId)),
    );
  }

  pollStatus(gwId: string, cmdId: string, intervalMs = 2000): Observable<CommandStatusUpdate> {
    return interval(intervalMs).pipe(
      switchMap(() =>
        this.commandsApi.commandControllerGetStatus(gwId, cmdId).pipe(
          map((res) => ({
            commandId: res.command_id,
            status: this.toCommandStatus(res.status),
            timestamp: res.timestamp,
          })),
          catchError((error: unknown) => {
            const status = (error as { status?: number }).status;
            if (status === 404 || status === 503) {
              return of({ commandId: cmdId, status: CommandStatus.timeout });
            }

            return throwError(() => error);
          }),
        ),
      ),
      timeout({ first: 5 * 60 * 1000 }),
      takeWhile((update) => !TERMINAL_STATUSES.has(update.status), true),
    );
  }

  private toCommandStatus(status: string): CommandStatus {
    switch (status) {
      case 'ack':
        return CommandStatus.ack;
      case 'nack':
        return CommandStatus.nack;
      case 'expired':
        return CommandStatus.expired;
      case 'timeout':
        return CommandStatus.timeout;
      default:
        return CommandStatus.queued;
    }
  }
}
