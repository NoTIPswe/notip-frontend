import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UserRole } from '../../../core/models/enums';
import { ImpersonationTagComponent } from '../impersonation-tag/impersonation-tag.component';
import { LogoutButtonComponent } from '../logout-button/logout-button.component';
import { ProfileSectionComponent } from '../profile-section/profile-section.component';

interface MenuItem {
  label: string;
  path: string;
  exact?: boolean;
}

const TENANT_USER_MENU: ReadonlyArray<MenuItem> = [
  { label: 'Dashboard', path: '/dashboard', exact: true },
  { label: 'Gateways', path: '/gateways' },
  { label: 'Sensors', path: '/sensors' },
  { label: 'Alerts', path: '/alerts' },
  { label: 'Threshold Settings', path: '/mgmt/limits' },
];

const TENANT_ADMIN_EXTRA_MENU: ReadonlyArray<MenuItem> = [
  { label: 'Users Management', path: '/mgmt/users' },
  { label: 'API Clients', path: '/mgmt/api' },
  { label: 'Audit Log', path: '/mgmt/logs' },
  { label: 'Costs', path: '/mgmt/costs' },
];

const SYSTEM_ADMIN_MENU: ReadonlyArray<MenuItem> = [
  { label: 'Tenants', path: '/admin/tenants', exact: true },
  { label: 'Gateways', path: '/admin/gateways' },
];

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    ImpersonationTagComponent,
    ProfileSectionComponent,
    LogoutButtonComponent,
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css',
})
export class SidebarComponent {
  readonly isImpersonating = input<boolean>(false);
  readonly username = input<string>('User');
  readonly role = input<UserRole>(UserRole.tenant_user);
  readonly logoutRequested = output<void>();
  readonly impersonationStopRequested = output<void>();
  readonly profileRequested = output<void>();
  readonly passwordChangeRequested = output<void>();

  menuItems(): ReadonlyArray<MenuItem> {
    const role = this.currentRole();

    if (role === UserRole.system_admin) {
      return SYSTEM_ADMIN_MENU;
    }

    if (role === UserRole.tenant_admin) {
      return [...TENANT_USER_MENU, ...TENANT_ADMIN_EXTRA_MENU];
    }

    return TENANT_USER_MENU;
  }

  private currentRole(): UserRole {
    return this.role();
  }

  emitLogout(): void {
    this.logoutRequested.emit();
  }

  emitImpersonationStopRequested(): void {
    this.impersonationStopRequested.emit();
  }

  emitProfileRequested(): void {
    this.profileRequested.emit();
  }

  emitPasswordChangeRequested(): void {
    this.passwordChangeRequested.emit();
  }
}
