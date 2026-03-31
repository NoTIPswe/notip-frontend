import { Component, input, output } from '@angular/core';
import { UserRole } from '../../../../../core/models/enums';
import { ViewUser } from '../../../../../core/models/user';

export type CreateUserPayload = {
  name: string;
  email: string;
  role: UserRole;
  password: string;
};

export type UpdateUserPayload = {
  userId: string;
  name: string;
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

  readonly createRequested = output<CreateUserPayload>();
  readonly updateRequested = output<UpdateUserPayload>();
  readonly cancelRequested = output<void>();

  create(event: Event, name: string, email: string, role: string, password: string): void {
    event.preventDefault();
    this.createRequested.emit({
      name: name.trim(),
      email: email.trim(),
      role: this.toRole(role),
      password,
    });
  }

  update(event: Event, name: string, email: string, role: string): void {
    event.preventDefault();

    const target = this.editUser();
    if (!target) {
      return;
    }

    this.updateRequested.emit({
      userId: target.userId,
      name: name.trim(),
      email: email.trim(),
      role: this.toRole(role),
    });
  }

  cancel(): void {
    this.cancelRequested.emit();
  }

  private toRole(value: string): UserRole {
    if (value === 'system_admin') {
      return UserRole.system_admin;
    }

    if (value === 'tenant_admin') {
      return UserRole.tenant_admin;
    }

    return UserRole.tenant_user;
  }
}
