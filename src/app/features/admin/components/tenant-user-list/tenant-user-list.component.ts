import { Component, input, output } from '@angular/core';
import { ObfuscatedUser } from '../../../../core/models/user';
import { ImpersonateButtonComponent } from '../impersonate-button/impersonate-button.component';

@Component({
  selector: 'app-tenant-user-list',
  standalone: true,
  imports: [ImpersonateButtonComponent],
  templateUrl: './tenant-user-list.component.html',
  styleUrl: './tenant-user-list.component.css',
})
export class TenantUserListComponent {
  readonly users = input<ObfuscatedUser[]>([]);
  readonly isLoading = input<boolean>(false);

  readonly impersonationStarted = output<string>();
  readonly impersonationFailed = output<string>();

  onStarted(userId: string): void {
    this.impersonationStarted.emit(userId);
  }

  onFailed(message: string): void {
    this.impersonationFailed.emit(message);
  }
}
