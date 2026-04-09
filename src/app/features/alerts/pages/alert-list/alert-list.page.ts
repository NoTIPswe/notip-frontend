import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AlertFilterFormValue,
  AlertFilterPanelComponent,
} from '../../components/alert-filter-panel/alert-filter-panel.component';
import { Alerts } from '../../../../core/models/alert';
import { AlertService } from '../../services/alert.service';
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
  private readonly authService = inject(AuthService);

  readonly alerts = signal<Alerts[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly canEditAlertsConfig = this.authService.getRole() === UserRole.tenant_admin;

  readonly from = signal<string>(this.toDatetimeLocal(new Date(Date.now() - 24 * 60 * 60 * 1000)));
  readonly to = signal<string>(this.toDatetimeLocal(new Date()));
  readonly gatewayId = signal<string>('');

  ngOnInit(): void {
    this.loadAlerts();
  }

  applyFilter(form: AlertFilterFormValue): void {
    this.from.set(form.from);
    this.to.set(form.to);
    this.gatewayId.set(form.gatewayId);
    this.loadAlerts();
  }

  resetFilter(): void {
    this.from.set(this.toDatetimeLocal(new Date(Date.now() - 24 * 60 * 60 * 1000)));
    this.to.set(this.toDatetimeLocal(new Date()));
    this.gatewayId.set('');
    this.loadAlerts();
  }

  private loadAlerts(): void {
    this.errorMessage.set(null);
    this.isLoading.set(true);

    const gateway = this.gatewayId().trim();
    const filter = {
      from: this.toIsoOrNow(this.from()),
      to: this.toIsoOrNow(this.to()),
      ...(gateway ? { gatewayId: [gateway] } : {}),
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

  private toIsoOrNow(value: string): string {
    return fromRomeDateTimeInputToIso(value) ?? new Date().toISOString();
  }

  private toDatetimeLocal(value: Date): string {
    return toRomeDateTimeInput(value);
  }
}
