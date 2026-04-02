import { Component, input, output } from '@angular/core';

export type AlertFilterFormValue = {
  from: string;
  to: string;
  gatewayId: string;
};

@Component({
  selector: 'app-alert-filter-panel',
  standalone: true,
  templateUrl: './alert-filter-panel.component.html',
  styleUrl: './alert-filter-panel.component.css',
})
export class AlertFilterPanelComponent {
  readonly from = input<string>('');
  readonly to = input<string>('');
  readonly gatewayId = input<string>('');
  readonly isLoading = input<boolean>(false);

  readonly filterSubmitted = output<AlertFilterFormValue>();
  readonly resetRequested = output<void>();

  submit(event: Event, from: string, to: string, gatewayId: string): void {
    event.preventDefault();
    this.filterSubmitted.emit({
      from: from.trim(),
      to: to.trim(),
      gatewayId: gatewayId.trim(),
    });
  }

  reset(): void {
    this.resetRequested.emit();
  }
}
