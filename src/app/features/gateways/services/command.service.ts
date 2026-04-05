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
import {
  CmdGatewayStatus,
  CommandStatus,
  CommandStatusUpdate,
  GatewayConfig,
  GatewayFirmware,
} from '../../../core/models/command';

const TERMINAL_STATUSES = new Set<CommandStatus>([
  CommandStatus.ack,
  CommandStatus.nack,
  CommandStatus.expired,
  CommandStatus.timeout,
]);

const ALLOWED_CMD_GATEWAY_STATUSES = new Set<CmdGatewayStatus>([
  CmdGatewayStatus.online,
  CmdGatewayStatus.paused,
]);

type CommandResponsePayload = {
  command_id?: string;
  commandId?: string;
  status?: string;
  issued_at?: string;
  issuedAt?: string;
};

type CommandStatusResponsePayload = {
  command_id?: string;
  commandId?: string;
  status?: string;
  timestamp?: string;
};

@Injectable({ providedIn: 'root' })
export class CommandService {
  private readonly commandsApi = inject(CommandsApiService);

  sendConfig(id: string, config: GatewayConfig): Observable<CommandStatusUpdate> {
    const body: SendConfigRequestDto = {};
    if (typeof config.send_frequency_ms === 'number') {
      body.send_frequency_ms = config.send_frequency_ms;
    }
    if (this.isCmdGatewayStatus(config.status)) {
      body.status = config.status;
    }

    return this.commandsApi.commandControllerSendConfig(id, body).pipe(
      map((res) => this.mapCommandResponse(res)),
      switchMap((first) => this.pollStatus(id, first.commandId)),
    );
  }

  sendFirmware(id: string, firmware: GatewayFirmware): Observable<CommandStatusUpdate> {
    const body: SendFirmwareRequestDto = {
      firmware_version: firmware.firmware_version,
      download_url: firmware.download_url,
    };

    return this.commandsApi.commandControllerSendFirmware(id, body).pipe(
      map((res) => this.mapCommandResponse(res)),
      switchMap((first) => this.pollStatus(id, first.commandId)),
    );
  }

  pollStatus(gwId: string, cmdId: string, intervalMs = 2000): Observable<CommandStatusUpdate> {
    let lastKnownUpdate: CommandStatusUpdate = {
      commandId: cmdId,
      status: CommandStatus.queued,
    };

    return interval(intervalMs).pipe(
      switchMap(() =>
        this.commandsApi.commandControllerGetStatus(gwId, cmdId).pipe(
          map((res) => {
            const update = this.mapCommandStatusResponse(res);
            lastKnownUpdate = update;
            return update;
          }),
          catchError((error: unknown) => {
            const status = (error as { status?: number }).status;
            if (status === 304) {
              return of(lastKnownUpdate);
            }

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

  private mapCommandResponse(response: unknown): CommandStatusUpdate {
    const res = response as CommandResponsePayload;
    const commandId = res.command_id;
    const timestamp = res.issued_at;

    if (!commandId) {
      throw new Error('Invalid command response: missing command id');
    }

    const update: CommandStatusUpdate = {
      commandId,
      status: this.toCommandStatus(res.status ?? ''),
    };

    if (timestamp) {
      update.timestamp = timestamp;
    }

    return update;
  }

  private mapCommandStatusResponse(response: unknown): CommandStatusUpdate {
    const res = response as CommandStatusResponsePayload;
    const commandId = res.command_id;
    const timestamp = res.timestamp;

    if (!commandId) {
      throw new Error('Invalid command status response: missing command id');
    }

    const update: CommandStatusUpdate = {
      commandId,
      status: this.toCommandStatus(res.status ?? ''),
    };

    if (timestamp) {
      update.timestamp = timestamp;
    }

    return update;
  }

  private isCmdGatewayStatus(status: unknown): status is CmdGatewayStatus {
    if (typeof status !== 'string') {
      return false;
    }

    return ALLOWED_CMD_GATEWAY_STATUSES.has(status as CmdGatewayStatus);
  }
}
