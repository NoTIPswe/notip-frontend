import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { IMPERSONATION_STATUS, ImpersonationStatus } from './core/auth/contracts';
import { UserRole } from './core/models/enums';
import { AuthService } from './core/services/auth.service';
import { SidebarComponent } from './shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly impersonationStatus = inject<ImpersonationStatus>(IMPERSONATION_STATUS);

  readonly username = signal('User');
  readonly role = signal<UserRole>(this.auth.getRole());
  readonly isImpersonating = computed(() => this.impersonationStatus.isImpersonating());

  constructor() {
    effect(() => {
      this.isImpersonating();
      this.refreshIdentity();
    });
  }

  private refreshIdentity(): void {
    void this.auth
      .getToken()
      .then(() => {
        this.role.set(this.auth.getRole());
        return this.auth.getUsername();
      })
      .then((name) => {
        this.username.set(name || 'User');
      })
      .catch(() => {
        this.role.set(this.auth.getRole());
        this.username.set('User');
      });
  }

  onLogout(): void {
    this.auth.logout();
  }

  onProfileOpen(): void {
    this.auth.openProfile();
  }

  onPasswordChange(): void {
    this.auth.openPasswordChange();
  }

  onImpersonationStopRequested(): void {
    this.auth.stopImpersonation();
    void this.router.navigate(['/admin/tenants']);
  }
}
