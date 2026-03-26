import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { IMPERSONATION_STATUS, ImpersonationStatus } from './core/auth/contracts';
import { UserRole } from './core/models/enums';
import { AuthService } from './core/services/auth.service';
import { SidebarComponent } from './shared/components/sidebar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly impersonationStatus = inject<ImpersonationStatus>(IMPERSONATION_STATUS);

  readonly username = signal('Utente');
  readonly role = signal<UserRole>(this.auth.getRole());
  readonly isImpersonating = computed(() => this.impersonationStatus.isImpersonating());

  ngOnInit(): void {
    void this.auth.getUsername().then((name) => {
      this.username.set(name || 'Utente');
    });
  }

  onLogout(): void {
    this.auth.logout();
  }
}
