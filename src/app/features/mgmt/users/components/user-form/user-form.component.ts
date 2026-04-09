import { Component, input, output } from '@angular/core';
import { UserRole } from '../../../../../core/models/enums';
import { ViewUser } from '../../../../../core/models/user';

export type CreateUserPayload = {
  username: string;
  email: string;
  role: UserRole;
  password: string;
};

export type UpdateUserPayload = {
  userId: string;
  username: string;
  email: string;
  role: UserRole;
};

@Component({
  selector: 'app-user-form',
  standalone: true,
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.css',
})
export class UserFormComponent {
  readonly UserRole = UserRole;

  readonly editUser = input<ViewUser | null>(null);
  readonly isSaving = input<boolean>(false);
  readonly errorMessage = input<string | null>(null);

  readonly createRequested = output<CreateUserPayload>();
  readonly updateRequested = output<UpdateUserPayload>();
  readonly cancelRequested = output<void>();

  create(event: Event, username: string, email: string, role: string, password: string): void {
    event.preventDefault();
    this.createRequested.emit({
      username: this.normalizeUsername(username),
      email: email.trim(),
      role: this.toRole(role),
      password,
    });
  }

  update(event: Event, username: string, email: string, role: string): void {
    event.preventDefault();

    const target = this.editUser();
    if (!target) {
      return;
    }

    this.updateRequested.emit({
      userId: target.userId,
      username: this.normalizeUsername(username),
      email: email.trim(),
      role: this.toRole(role),
    });
  }

  cancel(): void {
    this.cancelRequested.emit();
  }

  private toRole(value: string): UserRole {
    if (value === 'tenant_admin') {
      return UserRole.tenant_admin;
    }

    return UserRole.tenant_user;
  }

  private normalizeUsername(value: string): string {
    const lowered = value.trim().toLowerCase();
    if (!lowered) {
      return '';
    }

    return `${lowered[0].toUpperCase()}${lowered.slice(1)}`;
  }
}
