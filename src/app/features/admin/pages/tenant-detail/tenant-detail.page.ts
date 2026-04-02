import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, filter, map } from 'rxjs';
import { ObfuscatedUser } from '../../../../core/models/user';
import { TenantUserListComponent } from '../../components/tenant-user-list/tenant-user-list.component';
import { AdminUserService } from '../../services/admin-user.service';

@Component({
  selector: 'app-tenant-detail-page',
  standalone: true,
  imports: [TenantUserListComponent],
  templateUrl: './tenant-detail.page.html',
  styleUrl: './tenant-detail.page.css',
})
export class TenantDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly adminUserService = inject(AdminUserService);

  readonly tenantId = signal<string>('');
  readonly users = signal<ObfuscatedUser[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly feedbackMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('id') ?? ''),
        filter((id) => id.length > 0),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((id) => {
        this.tenantId.set(id);
        this.feedbackMessage.set(null);
        this.loadUsers(id);
      });
  }

  onImpersonationStarted(userId: string): void {
    this.feedbackMessage.set(`Impersonazione avviata per utente ${userId}.`);
  }

  onImpersonationFailed(message: string): void {
    this.feedbackMessage.set(message);
  }

  private loadUsers(tenantId: string): void {
    this.errorMessage.set(null);
    this.isLoading.set(true);

    this.adminUserService.getUsers(tenantId).subscribe({
      next: (rows) => {
        this.isLoading.set(false);
        this.users.set(rows);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Impossibile caricare la lista utenti del tenant.');
      },
    });
  }
}
