import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { UserRole } from './core/models/enums';
import { LoginPageComponent } from './features/auth/pages/login.page';
import { ErrorPageComponent } from './features/system/pages/error.page';
import { PlaceholderPageComponent } from './shared/components/placeholder-page.component';
import { DashboardResolver } from './core/resolvers/dashboard.resolver';

export const routes: Routes = [
  { path: 'login', component: LoginPageComponent },
  {
    path: 'dashboard',
    component: PlaceholderPageComponent,
    canActivate: [AuthGuard, RoleGuard],
    resolve: { ready: DashboardResolver },
    data: { title: 'Dashboard', roles: [UserRole.tenant_user, UserRole.tenant_admin] },
  },
  {
    path: 'gateways',
    component: PlaceholderPageComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { title: 'Gateways', roles: [UserRole.tenant_user, UserRole.tenant_admin] },
  },
  {
    path: 'gateways/:id',
    component: PlaceholderPageComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { title: 'Gateway Detail', roles: [UserRole.tenant_user, UserRole.tenant_admin] },
  },
  {
    path: 'sensors',
    component: PlaceholderPageComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { title: 'Sensors', roles: [UserRole.tenant_user, UserRole.tenant_admin] },
  },
  {
    path: 'sensors/:id',
    component: PlaceholderPageComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { title: 'Sensor Detail', roles: [UserRole.tenant_user, UserRole.tenant_admin] },
  },
  {
    path: 'alerts',
    component: PlaceholderPageComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { title: 'Alerts', roles: [UserRole.tenant_admin] },
  },
  {
    path: 'alerts/config',
    component: PlaceholderPageComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { title: 'Alerts Config', roles: [UserRole.tenant_admin] },
  },
  {
    path: 'mgmt/users',
    component: PlaceholderPageComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { title: 'Users Management', roles: [UserRole.tenant_admin] },
  },
  {
    path: 'mgmt/limits',
    component: PlaceholderPageComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { title: 'Threshold Settings', roles: [UserRole.tenant_admin] },
  },
  {
    path: 'mgmt/api',
    component: PlaceholderPageComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { title: 'API Clients', roles: [UserRole.tenant_admin] },
  },
  {
    path: 'mgmt/logs',
    component: PlaceholderPageComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { title: 'Audit Log', roles: [UserRole.tenant_admin] },
  },
  {
    path: 'mgmt/costs',
    component: PlaceholderPageComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { title: 'Costs', roles: [UserRole.tenant_admin] },
  },
  {
    path: 'admin/tenants',
    component: PlaceholderPageComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { title: 'Tenants', roles: [UserRole.system_admin] },
  },
  {
    path: 'admin/tenants/:id',
    component: PlaceholderPageComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { title: 'Tenant Detail', roles: [UserRole.system_admin] },
  },
  {
    path: 'admin/gateways',
    component: PlaceholderPageComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { title: 'Admin Gateways', roles: [UserRole.system_admin] },
  },
  { path: 'error', component: ErrorPageComponent },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'error?reason=not-found' },
];
