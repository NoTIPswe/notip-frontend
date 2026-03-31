import { Component, input, output } from '@angular/core';
import { ViewUser } from '../../../../../core/models/user';

@Component({
  selector: 'app-user-table',
  standalone: true,
  templateUrl: './user-table.component.html',
  styleUrl: './user-table.component.css',
})
export class UserTableComponent {
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
}
