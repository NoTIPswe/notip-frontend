import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AlertFilterFormValue,
  AlertFilterPanelComponent,
} from '../../components/alert-filter-panel/alert-filter-panel.component';
import { Alerts } from '../../../../core/models/alert';
import { AlertService } from '../../services/alert.service';
import { GatewayService } from '../../../gateways/services/gateway.service';
import { AuthService } from '../../../../core/services/auth.service';
import { UserRole } from '../../../../core/models/enums';
import { RomeDateTimePipe } from '../../../../shared/pipes/rome-date-time.pipe';
import {
  fromRomeDateTimeInputToIso,
  toRomeDateTimeInput,
} from '../../../../shared/utils/rome-timezone.util';

@Component({
  selector: 'app-alert-list-page',
  standalone: true,
  imports: [AlertFilterPanelComponent, RouterLink, RomeDateTimePipe],
  templateUrl: './alert-list.page.html',
  styleUrl: './alert-list.page.css',
})
export class AlertListPageComponent implements OnInit {
  private readonly alertService = inject(AlertService);
  private readonly gatewayService = inject(GatewayService);
  private readonly authService = inject(AuthService);

  readonly alerts = signal<Alerts[]>([]);
  readonly gatewayOptions = signal<string[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly canEditAlertsConfig = this.authService.getRole() === UserRole.tenant_admin;

  readonly from = signal<string>(this.toDatetimeLocal(new Date(Date.now() - 24 * 60 * 60 * 1000)));
  readonly to = signal<string>(this.toDatetimeLocal(new Date()));
  readonly gatewayIds = signal<string[]>([]);

  ngOnInit(): void {
    this.loadGatewayOptions();
    this.loadAlerts();
  }

  applyFilter(form: AlertFilterFormValue): void {
    this.from.set(form.from);
    this.to.set(form.to);
    this.gatewayIds.set(this.normalizeList(form.gatewayIds));
    this.loadAlerts();
  }

  resetFilter(): void {
    this.from.set(this.toDatetimeLocal(new Date(Date.now() - 24 * 60 * 60 * 1000)));
    this.to.set(this.toDatetimeLocal(new Date()));
    this.gatewayIds.set([]);
    this.loadAlerts();
  }

  private loadAlerts(): void {
    this.errorMessage.set(null);
    this.isLoading.set(true);

    const gateways = this.normalizeList(this.gatewayIds());
    const filter = {
      from: this.toIsoOrNow(this.from()),
      to: this.toIsoOrNow(this.to()),
      ...(gateways.length > 0 ? { gatewayId: gateways } : {}),
    };

    this.alertService.getAlerts(filter).subscribe({
      next: (rows) => {
        this.isLoading.set(false);
        this.alerts.set(rows);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Unable to load alerts.');
      },
    });
  }

  private loadGatewayOptions(): void {
    this.gatewayService.getGateways().subscribe({
      next: (rows) => {
        const gatewayIds = Array.from(
          new Set(rows.map((row) => row.gatewayId).filter((gatewayId) => gatewayId.length > 0)),
        ).sort((a, b) => a.localeCompare(b));

        this.gatewayOptions.set(gatewayIds);
        this.gatewayIds.update((selected) =>
          selected.filter((gatewayId) => gatewayIds.includes(gatewayId)),
        );
      },
      error: () => {
        this.gatewayOptions.set([]);
      },
    });
  }

  private normalizeList(values: string[]): string[] {
    const unique = new Set<string>();

    for (const value of values) {
      const normalized = value.trim();
      if (normalized.length === 0) {
        continue;
      }

      unique.add(normalized);
    }

    return Array.from(unique);
  }

  private toIsoOrNow(value: string): string {
    return fromRomeDateTimeInputToIso(value) ?? new Date().toISOString();
  }

  private toDatetimeLocal(value: Date): string {
    return toRomeDateTimeInput(value);
  }
}
