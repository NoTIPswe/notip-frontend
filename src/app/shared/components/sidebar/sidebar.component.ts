import { Component, input, output } from '@angular/core';
import { ImpersonationTagComponent } from '../impersonation-tag/impersonation-tag.component';
import { LogoutButtonComponent } from '../logout-button/logout-button.component';
import { ProfileSectionComponent } from '../profile-section/profile-section.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [ImpersonationTagComponent, ProfileSectionComponent, LogoutButtonComponent],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
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
