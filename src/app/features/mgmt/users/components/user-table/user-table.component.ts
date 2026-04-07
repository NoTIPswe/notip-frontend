import { Component, input, output } from '@angular/core';
import { ViewUser } from '../../../../../core/models/user';

@Component({
  selector: 'app-user-table',
  standalone: true,
  templateUrl: './user-table.component.html',
  styleUrl: './user-table.component.css',
})
export class UserTableComponent {
  private static readonly GMT_PLUS_ONE_OFFSET_MS = 60 * 60 * 1000;

  readonly users = input<ViewUser[]>([]);
  readonly isLoading = input<boolean>(false);
  readonly selectedUserId = input<string | null>(null);

  readonly editRequested = output<string>();
  readonly deleteRequested = output<string>();

  requestEdit(userId: string): void {
    this.editRequested.emit(userId);
  }

  requestDelete(userId: string): void {
    this.deleteRequested.emit(userId);
  }

  formatLastAccess(timestamp: string | null): string {
    if (!timestamp) {
      return '-';
    }

    const parsed = new Date(timestamp);
    if (Number.isNaN(parsed.getTime())) {
      return timestamp;
    }

    const gmtPlusOne = new Date(parsed.getTime() + UserTableComponent.GMT_PLUS_ONE_OFFSET_MS);

    const day = String(gmtPlusOne.getUTCDate()).padStart(2, '0');
    const month = String(gmtPlusOne.getUTCMonth() + 1).padStart(2, '0');
    const year = String(gmtPlusOne.getUTCFullYear());
    const hours = String(gmtPlusOne.getUTCHours()).padStart(2, '0');
    const minutes = String(gmtPlusOne.getUTCMinutes()).padStart(2, '0');
    const seconds = String(gmtPlusOne.getUTCSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }
}
