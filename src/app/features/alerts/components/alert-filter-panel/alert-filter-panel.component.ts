import { Component, effect, input, output, signal } from '@angular/core';
import { MultiSelectDropdownComponent } from '../../../../shared/components/multi-select-dropdown/multi-select-dropdown.component';

export type AlertFilterFormValue = {
  from: string;
  to: string;
  gatewayIds: string[];
};

@Component({
  selector: 'app-alert-filter-panel',
  standalone: true,
  imports: [MultiSelectDropdownComponent],
  templateUrl: './alert-filter-panel.component.html',
  styleUrl: './alert-filter-panel.component.css',
})
export class AlertFilterPanelComponent {
  readonly from = input<string>('');
  readonly to = input<string>('');
  readonly gatewayIds = input<string[]>([]);
  readonly gatewayOptions = input<string[]>([]);
  readonly isLoading = input<boolean>(false);

  readonly filterSubmitted = output<AlertFilterFormValue>();
  readonly resetRequested = output<void>();

  readonly selectedGatewayIds = signal<string[]>([]);

  constructor() {
    effect(() => {
      this.selectedGatewayIds.set(this.normalizeList(this.gatewayIds()));
    });
  }

  submit(event: Event, from: string, to: string): void {
    event.preventDefault();

    this.filterSubmitted.emit({
      from: from.trim(),
      to: to.trim(),
      gatewayIds: this.normalizeList(this.selectedGatewayIds()),
    });
  }

  onGatewaySelectionChanged(gatewayIds: string[]): void {
    this.selectedGatewayIds.set(this.normalizeList(gatewayIds));
  }

  reset(): void {
    this.resetRequested.emit();
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
}
