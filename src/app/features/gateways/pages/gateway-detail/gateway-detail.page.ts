import { Component, DestroyRef, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription, distinctUntilChanged, filter, map, tap } from 'rxjs';
import { Sensor } from '../../../../core/models/sensor';
import { Gateway } from '../../../../core/models/gateway';
import { CheckedEnvelope, ObfuscatedEnvelope } from '../../../../core/models/measure';
import {
  CmdGatewayStatus,
  CommandStatus,
  CommandStatusUpdate,
  GatewayConfig,
  GatewayFirmware,
} from '../../../../core/models/command';
import { GatewayStatus, UserRole } from '../../../../core/models/enums';
import { AuthService } from '../../../../core/services/auth.service';
import { SensorService } from '../../../sensors/services/sensor.service';
import { TelemetryTableComponent } from '../../../dashboard/components/telemetry-table/telemetry-table.component';
import { ObfuscatedMeasureService } from '../../../dashboard/services/obfuscated-measure.service';
import { ValidatedMeasureFacadeService } from '../../../dashboard/services/validated-measure-facade.service';
import {
  CommandModalComponent,
  CommandModalMode,
} from '../../components/command-modal/command-modal.component';
import { GatewayActionsComponent } from '../../components/gateway-actions/gateway-actions.component';
import { DeleteConfirmModalComponent } from '../../../../shared/components/delete-confirm-modal/delete-confirm-modal.component';
import { GatewayService } from '../../services/gateway.service';
import { CommandService } from '../../services/command.service';

@Component({
  selector: 'app-gateway-detail-page',
  standalone: true,
  imports: [
    GatewayActionsComponent,
    CommandModalComponent,
    DeleteConfirmModalComponent,
    TelemetryTableComponent,
    RouterLink,
  ],
  templateUrl: './gateway-detail.page.html',
  styleUrl: './gateway-detail.page.css',
})
export class GatewayDetailPageComponent implements OnInit, OnDestroy {
  private static readonly STREAM_PAGE_SIZE = 20;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly gatewayService = inject(GatewayService);
  private readonly commandService = inject(CommandService);
  private readonly sensorService = inject(SensorService);
  private readonly obfuscatedMeasureService = inject(ObfuscatedMeasureService);
  private readonly validatedMeasureFacadeService = inject(ValidatedMeasureFacadeService);
  private readonly destroyRef = inject(DestroyRef);

  private streamSubscription: Subscription | null = null;

  readonly gatewayId = signal<string>('');
  readonly gateway = signal<Gateway | null>(null);
  readonly sensors = signal<Sensor[]>([]);
  readonly errorMessage = signal<string | null>(null);
  readonly infoMessage = signal<string | null>(null);
  readonly commandStatus = signal<CommandStatusUpdate | null>(null);

  readonly commandModalOpen = signal<boolean>(false);
  readonly commandModalMode = signal<CommandModalMode>(null);
  readonly deleteModalOpen = signal<boolean>(false);
  readonly isBusy = signal<boolean>(false);

  readonly canManage = this.authService.getRole() === UserRole.tenant_admin;
  readonly isImpersonating = this.authService.isImpersonating;
  readonly isLoading = this.gatewayService.isLoading();
  readonly commandModalInitialSendFrequencyMs = computed<number | null>(
    () => this.gateway()?.sendFrequencyMs ?? null,
  );
  readonly commandModalInitialStatus = computed<CmdGatewayStatus | null>(() => {
    const status = this.gateway()?.status;

    if (status === GatewayStatus.online) {
      return CmdGatewayStatus.online;
    }

    if (status === GatewayStatus.paused) {
      return CmdGatewayStatus.paused;
    }

    return null;
  });
  readonly isTelemetryLoading = signal(false);
  readonly telemetry = signal<Array<CheckedEnvelope | ObfuscatedEnvelope>>([]);

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('id') ?? ''),
        filter((id) => id.length > 0),
        distinctUntilChanged(),
        tap(() => {
          this.errorMessage.set(null);
          this.infoMessage.set(null);
          this.commandStatus.set(null);
          this.stopTelemetryStream();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((gatewayId) => {
        this.gatewayId.set(gatewayId);
        this.loadGateway(gatewayId);
        this.loadSensors(gatewayId);
        this.startTelemetryStream(gatewayId);
      });
  }

  ngOnDestroy(): void {
    this.stopTelemetryStream();
  }

  requestRename(): void {
    const current = this.gateway();
    if (!current || !this.canManage || this.isBusy() || this.isImpersonating()) {
      return;
    }

    const nextName = globalThis.prompt('New gateway name', current.name)?.trim();
    if (!nextName || nextName === current.name) {
      return;
    }

    this.isBusy.set(true);
    this.gatewayService
      .updateGatewayName(current.gatewayId, nextName)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.isBusy.set(false);
          this.gateway.set({ ...current, name: result.name, status: result.status });
          this.infoMessage.set('Gateway name updated.');
        },
        error: () => {
          this.isBusy.set(false);
          this.errorMessage.set('Unable to update gateway name.');
        },
      });
  }

  openConfigModal(): void {
    this.commandModalMode.set('config');
    this.commandModalOpen.set(true);
  }

  openFirmwareModal(): void {
    this.commandModalMode.set('firmware');
    this.commandModalOpen.set(true);
  }

  closeCommandModal(): void {
    this.commandModalOpen.set(false);
    this.commandModalMode.set(null);
  }

  submitConfigCommand(config: GatewayConfig): void {
    const gatewayId = this.gatewayId();
    if (!gatewayId) {
      return;
    }

    this.isBusy.set(true);
    this.commandService
      .sendConfig(gatewayId, config)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (update) => this.handleCommandUpdate(gatewayId, update),
        error: () => {
          this.isBusy.set(false);
          this.errorMessage.set('Failed to send configuration command.');
        },
      });
  }

  submitFirmwareCommand(firmware: GatewayFirmware): void {
    const gatewayId = this.gatewayId();
    if (!gatewayId) {
      return;
    }

    this.isBusy.set(true);
    this.commandService
      .sendFirmware(gatewayId, firmware)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (update) => this.handleCommandUpdate(gatewayId, update),
        error: () => {
          this.isBusy.set(false);
          this.errorMessage.set('Failed to send firmware command.');
        },
      });
  }

  private handleCommandUpdate(gatewayId: string, update: CommandStatusUpdate): void {
    this.commandStatus.set(update);

    if (!this.isTerminalCommandStatus(update.status)) {
      return;
    }

    this.isBusy.set(false);
    this.closeCommandModal();

    if (update.status === CommandStatus.ack) {
      this.loadGateway(gatewayId);
    }
  }

  private isTerminalCommandStatus(status: CommandStatus): boolean {
    return (
      status === CommandStatus.ack ||
      status === CommandStatus.nack ||
      status === CommandStatus.expired ||
      status === CommandStatus.timeout
    );
  }

  openDeleteModal(): void {
    this.deleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    this.deleteModalOpen.set(false);
  }

  confirmDeleteGateway(): void {
    const gatewayId = this.gatewayId();
    if (!gatewayId) {
      return;
    }

    this.isBusy.set(true);
    this.gatewayService
      .deleteGateway(gatewayId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.isBusy.set(false);
          this.stopTelemetryStream();
          void this.router.navigate(['/gateways']);
        },
        error: () => {
          this.isBusy.set(false);
          this.errorMessage.set('Gateway deletion failed.');
        },
      });
  }

  private loadGateway(gatewayId: string): void {
    this.gatewayService
      .getGatewayDetail(gatewayId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (row) => {
          this.gateway.set(row);
        },
        error: () => {
          this.errorMessage.set('Unable to load gateway details.');
        },
      });
  }

  private loadSensors(gatewayId: string): void {
    this.sensorService
      .getGatewaySensors(gatewayId, 0)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (rows) => {
          this.sensors.set(rows);
        },
        error: () => {
          this.errorMessage.set('Unable to load gateway sensors.');
        },
      });
  }

  private startTelemetryStream(gatewayId: string): void {
    this.stopTelemetryStream();
    this.telemetry.set([]);
    this.isTelemetryLoading.set(true);

    const filters = { gatewayIds: [gatewayId], sensorIds: [], sensorTypes: [] };

    if (this.authService.isImpersonating()) {
      this.streamSubscription = this.obfuscatedMeasureService.openStream(filters).subscribe({
        next: (batch) => {
          this.telemetry.update((rows) => this.takeLastRows([...rows, ...batch]));
          this.isTelemetryLoading.set(false);
        },
        error: () => {
          this.isTelemetryLoading.set(false);
          this.errorMessage.set('Unable to receive telemetry stream.');
        },
      });
      return;
    }

    this.streamSubscription = this.validatedMeasureFacadeService.openStream(filters).subscribe({
      next: (row) => {
        this.telemetry.update((rows) => this.takeLastRows([...rows, row]));
        this.isTelemetryLoading.set(false);
      },
      error: () => {
        this.isTelemetryLoading.set(false);
        this.errorMessage.set('Unable to receive telemetry stream.');
      },
    });
  }

  private takeLastRows(
    rows: Array<CheckedEnvelope | ObfuscatedEnvelope>,
  ): Array<CheckedEnvelope | ObfuscatedEnvelope> {
    if (rows.length <= GatewayDetailPageComponent.STREAM_PAGE_SIZE) {
      return rows;
    }

    return rows.slice(-GatewayDetailPageComponent.STREAM_PAGE_SIZE);
  }

  private stopTelemetryStream(): void {
    if (this.streamSubscription) {
      this.streamSubscription.unsubscribe();
      this.streamSubscription = null;
    }

    this.obfuscatedMeasureService.closeStream();
    this.validatedMeasureFacadeService.closeStream();
    this.isTelemetryLoading.set(false);
  }
}
