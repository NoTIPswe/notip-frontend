import { CommandStatus } from './enums';

export { CommandStatus } from './enums';

export interface CommandStatusUpdate {
  commandId: string;
  status: CommandStatus;
  timestamp?: string;
}
