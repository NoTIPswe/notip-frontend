import { Component, input, output } from '@angular/core';
import { ImpersonationTagComponent } from './impersonation-tag.component';
import { LogoutButtonComponent } from './logout-button.component';
import { ProfileSectionComponent } from './profile-section.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [ImpersonationTagComponent, ProfileSectionComponent, LogoutButtonComponent],
  template: `
    <aside class="sidebar">
      <header>
        <h1>NoTIP</h1>
      </header>

      <section class="account">
        @if (isImpersonating()) {
          <app-impersonation-tag />
        }

        <app-profile-section
          [username]="username()"
          [role]="role()"
          [showProfileLink]="!isImpersonating()"
        />

        <app-logout-button (clicked)="emitLogout()" />
      </section>
    </aside>
  `,
  styles: [
    `
      .sidebar {
        width: 280px;
        min-height: 100dvh;
        border-right: 1px solid #e5e7eb;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 1rem;
        background: #f9fafb;
      }

      h1 {
        margin: 0;
        color: #111827;
      }

      .account {
        display: grid;
        gap: 0.75rem;
      }
    `,
  ],
})
export class SidebarComponent {
  readonly isImpersonating = input<boolean>(false);
  readonly username = input<string>('Utente');
  readonly role = input<string>('tenant_user');
  readonly logoutRequested = output<void>();

  emitLogout(): void {
    this.logoutRequested.emit();
  }
}
