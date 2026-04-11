import { Component, effect, input, output, signal } from '@angular/core';
import { MultiSelectDropdownComponent } from '../../../../../shared/components/multi-select-dropdown/multi-select-dropdown.component';

export type AuditFilterFormValue = {
  from: string;
  to: string;
  userIds: string[];
  actions: string[];
};

@Component({
  selector: 'app-audit-filter-panel',
  standalone: true,
  imports: [MultiSelectDropdownComponent],
  templateUrl: './audit-filter-panel.component.html',
  styleUrl: './audit-filter-panel.component.css',
})
export class AuditFilterPanelComponent {
  readonly from = input<string>('');
  readonly to = input<string>('');
  readonly userIds = input<string[]>([]);
  readonly actions = input<string[]>([]);
  readonly userIdOptions = input<string[]>([]);
  readonly actionOptions = input<string[]>([]);
  readonly isLoading = input<boolean>(false);

  readonly filterSubmitted = output<AuditFilterFormValue>();
  readonly resetRequested = output<void>();

  readonly selectedUserIds = signal<string[]>([]);
  readonly selectedActions = signal<string[]>([]);

  constructor() {
    effect(() => {
      this.selectedUserIds.set(this.normalizeList(this.userIds()));
      this.selectedActions.set(this.normalizeList(this.actions()));
    });
  }

  submit(event: Event, from: string, to: string): void {
    event.preventDefault();

    this.filterSubmitted.emit({
      from: from.trim(),
      to: to.trim(),
      userIds: this.normalizeList(this.selectedUserIds()),
      actions: this.normalizeList(this.selectedActions()),
    });
  }

  onUserIdsChanged(userIds: string[]): void {
    this.selectedUserIds.set(this.normalizeList(userIds));
  }

  onActionsChanged(actions: string[]): void {
    this.selectedActions.set(this.normalizeList(actions));
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
