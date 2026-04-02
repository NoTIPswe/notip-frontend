export * from './admin-gateways.service';
import { AdminGatewaysService } from './admin-gateways.service';
export * from './admin-tenants.service';
import { AdminTenantsService } from './admin-tenants.service';
export * from './alerts.service';
import { AlertsService } from './alerts.service';
export * from './api-client.service';
import { ApiClientService } from './api-client.service';
export * from './app.service';
import { AppService } from './app.service';
export * from './audit-log.service';
import { AuditLogService } from './audit-log.service';
export * from './auth.service';
import { AuthService } from './auth.service';
export * from './commands.service';
import { CommandsService } from './commands.service';
export * from './costs.service';
import { CostsService } from './costs.service';
export * from './gateways.service';
import { GatewaysService } from './gateways.service';
export * from './keys.service';
import { KeysService } from './keys.service';
export * from './thresholds.service';
import { ThresholdsService } from './thresholds.service';
export * from './users.service';
import { UsersService } from './users.service';
export const APIS = [
  AdminGatewaysService,
  AdminTenantsService,
  AlertsService,
  ApiClientService,
  AppService,
  AuditLogService,
  AuthService,
  CommandsService,
  CostsService,
  GatewaysService,
  KeysService,
  ThresholdsService,
  UsersService,
];
