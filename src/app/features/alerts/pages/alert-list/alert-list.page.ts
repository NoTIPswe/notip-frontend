import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AlertFilterFormValue,
  AlertFilterPanelComponent,
} from '../../components/alert-filter-panel/alert-filter-panel.component';
import { Alerts } from '../../../../core/models/alert';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-alert-list-page',
  standalone: true,
  imports: [AlertFilterPanelComponent],
  templateUrl: './alert-list.page.html',
  styleUrl: './alert-list.page.css',
})
export class AlertListPageComponent implements OnInit {
  private readonly alertService = inject(AlertService);

  readonly alerts = signal<Alerts[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

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
        this.errorMessage.set('Impossibile caricare gli alert.');
      },
    });
  }

  private toIsoOrNow(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return new Date().toISOString();
    }
    return parsed.toISOString();
  }

  private toDatetimeLocal(value: Date): string {
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    const h = String(value.getHours()).padStart(2, '0');
    const min = String(value.getMinutes()).padStart(2, '0');
    return `${y}-${m}-${d}T${h}:${min}`;
  }
}
