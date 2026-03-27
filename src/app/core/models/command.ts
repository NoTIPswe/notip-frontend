import { CommandStatus, CmdGatewayStatus } from './enums';

export { CommandStatus, CmdGatewayStatus } from './enums';

export interface CommandStatusUpdate {
  commandId: string;
  status: CommandStatus;
  timestamp?: string;
}

export interface GatewayFirmware {
  firmware_version: string;
  download_url: string;
}

export interface GatewayConfig {
  send_frequency_ms?: number;
  status?: CmdGatewayStatus;
}
