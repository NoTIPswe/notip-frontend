import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AlertConfigFormComponent,
  DefaultTimeoutPayload,
  GatewayTimeoutPayload,
} from '../../components/alert-config-form/alert-config-form.component';
import { AlertsConfig } from '../../../../core/models/alert';
import { AlertService } from '../../services/alert.service';
import { GatewayService } from '../../../gateways/services/gateway.service';
import { AuthService } from '../../../../core/services/auth.service';
import { UserRole } from '../../../../core/models/enums';

@Component({
  selector: 'app-alert-config-page',
  standalone: true,
  imports: [AlertConfigFormComponent, DatePipe],
  templateUrl: './alert-config.page.html',
  styleUrl: './alert-config.page.css',
})
export class AlertConfigPageComponent implements OnInit {
  private readonly alertService = inject(AlertService);
  private readonly gatewayService = inject(GatewayService);
  private readonly authService = inject(AuthService);

  readonly config = signal<AlertsConfig | null>(null);
  readonly availableGatewayIds = signal<string[]>([]);
  readonly showForm = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly infoMessage = signal<string | null>(null);
  readonly canEditConfig = this.authService.getRole() === UserRole.tenant_admin;

  ngOnInit(): void {
    this.loadConfig();
    this.loadAvailableGatewayIds();
  }

  toggleForm(): void {
    if (!this.canEditConfig) {
      return;
    }

    this.showForm.set(!this.showForm());
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  saveDefault(payload: DefaultTimeoutPayload): void {
    if (!this.canEditConfig) {
      return;
    }

    this.errorMessage.set(null);
    this.infoMessage.set(null);
    this.isSaving.set(true);

    this.alertService.setDefaultConfig(payload.timeoutMs).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.showForm.set(false);
        this.infoMessage.set('Timeout default aggiornato.');
        this.loadConfig();
      },
      error: () => {
        this.isSaving.set(false);
        this.errorMessage.set('Impossibile aggiornare il timeout default.');
      },
    });
  }

  saveGateway(payload: GatewayTimeoutPayload): void {
    if (!this.canEditConfig) {
      return;
    }

    this.errorMessage.set(null);
    this.infoMessage.set(null);
    this.isSaving.set(true);

    this.alertService.sendGatewayConfig(payload.gatewayId, payload.timeoutMs).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.showForm.set(false);
        this.infoMessage.set(`Override salvato per gateway ${payload.gatewayId}.`);
        this.loadConfig();
      },
      error: () => {
        this.isSaving.set(false);
        this.errorMessage.set('Impossibile salvare la configurazione gateway.');
      },
    });
  }

  deleteGateway(gatewayId: string): void {
    if (!this.canEditConfig) {
      return;
    }

    this.errorMessage.set(null);
    this.infoMessage.set(null);
    this.isSaving.set(true);

    this.alertService.deleteGatewayConfig(gatewayId).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.showForm.set(false);
        this.infoMessage.set(`Override eliminato per gateway ${gatewayId}.`);
        this.loadConfig();
      },
      error: () => {
        this.isSaving.set(false);
        this.errorMessage.set('Impossibile eliminare override gateway.');
      },
    });
  }

  private loadConfig(): void {
    this.errorMessage.set(null);
    this.isLoading.set(true);

    this.alertService.getAlertsConfig().subscribe({
      next: (cfg) => {
        this.isLoading.set(false);
        this.config.set(cfg);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Impossibile caricare la configurazione alert.');
      },
    });
  }

  private loadAvailableGatewayIds(): void {
    this.gatewayService.getGateways().subscribe({
      next: (rows) => {
        const ids = rows
          .map((row) => row.gatewayId)
          .filter((value): value is string => value.length > 0);

        this.availableGatewayIds.set(Array.from(new Set(ids)));
      },
      error: () => {
        this.availableGatewayIds.set([]);
      },
    });
  }
}
