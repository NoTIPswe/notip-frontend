import { Component, input, output } from '@angular/core';

export type AuditFilterFormValue = {
  from: string;
  to: string;
  userIds: string;
  actions: string;
};

@Component({
  selector: 'app-audit-filter-panel',
  standalone: true,
  templateUrl: './audit-filter-panel.component.html',
  styleUrl: './audit-filter-panel.component.css',
})
export class AuditFilterPanelComponent {
  readonly from = input<string>('');
  readonly to = input<string>('');
  readonly userIds = input<string>('');
  readonly actions = input<string>('');
  readonly isLoading = input<boolean>(false);

  readonly filterSubmitted = output<AuditFilterFormValue>();
  readonly resetRequested = output<void>();

  submit(event: Event, from: string, to: string, userIds: string, actions: string): void {
    event.preventDefault();

    this.filterSubmitted.emit({
      from: from.trim(),
      to: to.trim(),
      userIds: userIds.trim(),
      actions: actions.trim(),
    });
  }

  reset(): void {
    this.resetRequested.emit();
  }
}
