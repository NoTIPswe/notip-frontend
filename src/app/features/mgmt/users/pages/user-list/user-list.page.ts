import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DeleteConfirmModalComponent } from '../../../../../shared/components/delete-confirm-modal/delete-confirm-modal.component';
import {
  CreateUserPayload,
  UpdateUserPayload,
  UserFormComponent,
} from '../../components/user-form/user-form.component';
import { UserTableComponent } from '../../components/user-table/user-table.component';
import { ViewUser } from '../../../../../core/models/user';
import { UserService } from '../../services/user.service';
import { ModalLayerComponent } from '../../../../../shared/components/modal-layer/modal-layer.component';

@Component({
  selector: 'app-user-list-page',
  standalone: true,
  imports: [
    UserTableComponent,
    UserFormComponent,
    DeleteConfirmModalComponent,
    ModalLayerComponent,
  ],
  templateUrl: './user-list.page.html',
  styleUrl: './user-list.page.css',
})
export class UserListPageComponent implements OnInit {
  private readonly userService = inject(UserService);

  readonly users = signal<ViewUser[]>([]);
  readonly showCreateForm = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly infoMessage = signal<string | null>(null);

  readonly editingUserId = signal<string | null>(null);
  readonly deletingUserId = signal<string | null>(null);

  readonly editingUser = computed(
    () => this.users().find((row) => row.userId === this.editingUserId()) ?? null,
  );

  ngOnInit(): void {
    this.loadUsers();
  }

  requestEdit(userId: string): void {
    this.showCreateForm.set(false);
    this.editingUserId.set(userId);
    this.infoMessage.set(null);
  }

  openCreateUserForm(): void {
    if (this.editingUser()) {
      this.editingUserId.set(null);
      this.showCreateForm.set(true);
      this.infoMessage.set(null);
      return;
    }

    this.showCreateForm.set(!this.showCreateForm());
    this.infoMessage.set(null);
  }

  requestDelete(userId: string): void {
    this.deletingUserId.set(userId);
    this.infoMessage.set(null);
  }

  cancelDelete(): void {
    this.deletingUserId.set(null);
  }

  confirmDelete(): void {
    const userId = this.deletingUserId();
    if (!userId) {
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.infoMessage.set(null);

    this.userService.deleteUsers([userId]).subscribe({
      next: (result) => {
        this.isSaving.set(false);
        this.deletingUserId.set(null);
        this.infoMessage.set(`Users deleted: ${result.deleted}.`);
        this.loadUsers();
      },
      error: () => {
        this.isSaving.set(false);
        this.errorMessage.set('Unable to delete the selected user.');
      },
    });
  }

  createUser(payload: CreateUserPayload): void {
    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.infoMessage.set(null);

    this.userService.createUser(payload).subscribe({
      next: (created) => {
        this.isSaving.set(false);
        this.showCreateForm.set(false);
        this.infoMessage.set(`User created: ${created.userId}.`);
        this.loadUsers();
      },
      error: () => {
        this.isSaving.set(false);
        this.errorMessage.set('Unable to create the new user.');
      },
    });
  }

  updateUser(payload: UpdateUserPayload): void {
    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.infoMessage.set(null);

    this.userService
      .updateUser(payload.userId, {
        username: payload.username,
        email: payload.email,
        role: payload.role,
      })
      .subscribe({
        next: (updated) => {
          this.isSaving.set(false);
          this.showCreateForm.set(false);
          this.editingUserId.set(null);
          this.infoMessage.set(`User updated: ${updated.userId}.`);
          this.loadUsers();
        },
        error: () => {
          this.isSaving.set(false);
          this.errorMessage.set('Unable to update user.');
        },
      });
  }

  cancelEdit(): void {
    this.editingUserId.set(null);
    this.showCreateForm.set(false);
  }

  private loadUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.userService.getUsers().subscribe({
      next: (rows) => {
        this.isLoading.set(false);
        this.users.set(rows);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Unable to load user list.');
      },
    });
  }
}
