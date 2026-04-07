import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, filter, map } from 'rxjs';
import { Tenant } from '../../../../core/models/tenant';
import { ObfuscatedUser } from '../../../../core/models/user';
import { TenantUserListComponent } from '../../components/tenant-user-list/tenant-user-list.component';
import { AdminUserService } from '../../services/admin-user.service';
import { TenantService } from '../../services/tenant.service';
import { RomeDateTimePipe } from '../../../../shared/pipes/rome-date-time.pipe';

@Component({
  selector: 'app-tenant-detail-page',
  standalone: true,
  imports: [TenantUserListComponent, RomeDateTimePipe, RouterLink],
  templateUrl: './tenant-detail.page.html',
  styleUrl: './tenant-detail.page.css',
})
export class TenantDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly adminUserService = inject(AdminUserService);
  private readonly tenantService = inject(TenantService);
  private readonly destroyRef = inject(DestroyRef);

  readonly tenantId = signal<string>('');
  readonly tenant = signal<Tenant | null>(null);
  readonly users = signal<ObfuscatedUser[]>([]);
  readonly isTenantLoading = signal<boolean>(false);
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly feedbackMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        map((params) => params.get('id') ?? ''),
        filter((id) => id.length > 0),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((id) => {
        this.tenantId.set(id);
        this.tenant.set(null);
        this.users.set([]);
        this.errorMessage.set(null);
        this.feedbackMessage.set(null);
        this.loadTenant(id);
        this.loadUsers(id);
      });
  }

  onImpersonationStarted(userId: string): void {
    this.feedbackMessage.set(`Impersonation started for user ${userId}.`);
    void this.router.navigateByUrl('/dashboard');
  }

  onImpersonationFailed(message: string): void {
    this.feedbackMessage.set(message);
  }

  private loadUsers(tenantId: string): void {
    this.isLoading.set(true);

    this.adminUserService.getUsers(tenantId).subscribe({
      next: (rows) => {
        this.isLoading.set(false);
        this.users.set(rows);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Unable to load tenant user list.');
      },
    });
  }

  private loadTenant(tenantId: string): void {
    this.isTenantLoading.set(true);

    this.tenantService
      .getTenants()
      .pipe(map((rows) => rows.find((row) => row.tenantId === tenantId) ?? null))
      .subscribe({
        next: (tenant) => {
          this.isTenantLoading.set(false);
          this.tenant.set(tenant);
          if (!tenant) {
            this.errorMessage.set('Unable to load tenant details.');
          }
        },
        error: () => {
          this.isTenantLoading.set(false);
          this.errorMessage.set('Unable to load tenant details.');
        },
      });
  }
}
