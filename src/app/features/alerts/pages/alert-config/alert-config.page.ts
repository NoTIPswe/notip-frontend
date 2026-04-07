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
import { RomeDateTimePipe } from '../../../../shared/pipes/rome-date-time.pipe';
import { ModalLayerComponent } from '../../../../shared/components/modal-layer/modal-layer.component';

@Component({
  selector: 'app-alert-config-page',
  standalone: true,
  imports: [AlertConfigFormComponent, RomeDateTimePipe, ModalLayerComponent],
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
        this.infoMessage.set('Default timeout updated.');
        this.loadConfig();
      },
      error: () => {
        this.isSaving.set(false);
        this.errorMessage.set('Unable to update default timeout.');
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
        this.infoMessage.set(`Override saved for gateway ${payload.gatewayId}.`);
        this.loadConfig();
      },
      error: () => {
        this.isSaving.set(false);
        this.errorMessage.set('Unable to save gateway configuration.');
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
        this.infoMessage.set(`Override removed for gateway ${gatewayId}.`);
        this.loadConfig();
      },
      error: () => {
        this.isSaving.set(false);
        this.errorMessage.set('Unable to delete gateway override.');
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
        this.errorMessage.set('Unable to load alert configuration.');
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
