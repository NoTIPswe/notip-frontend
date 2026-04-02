import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { UserRole } from './core/models/enums';
import { TenantManagerPageComponent } from './features/admin/pages/tenant-manager/tenant-manager.page';
import { TenantDetailPageComponent } from './features/admin/pages/tenant-detail/tenant-detail.page';
import { AdminGatewayListPageComponent } from './features/admin/pages/admin-gateway-list/admin-gateway-list.page';
import { AlertConfigPageComponent } from './features/alerts/pages/alert-config/alert-config.page';
import { AlertListPageComponent } from './features/alerts/pages/alert-list/alert-list.page';
import { DataDashboardPageComponent } from './features/dashboard/pages/data-dashboard/data-dashboard.page';
import { GatewayDetailPageComponent } from './features/gateways/pages/gateway-detail/gateway-detail.page';
import { GatewayListPageComponent } from './features/gateways/pages/gateway-list/gateway-list.page';
import { ApiClientListPageComponent } from './features/mgmt/api-clients/pages/api-client-list/api-client-list.page';
import { AuditLogPageComponent } from './features/mgmt/audit/pages/audit-log/audit-log.page';
import { CostDashboardPageComponent } from './features/mgmt/costs/pages/cost-dashboard/cost-dashboard.page';
import { ThresholdSettingsPageComponent } from './features/mgmt/thresholds/pages/threshold-settings/threshold-settings.page';
import { UserListPageComponent } from './features/mgmt/users/pages/user-list/user-list.page';
import { SensorDetailPageComponent } from './features/sensors/pages/sensor-detail/sensor-detail.page';
import { SensorListPageComponent } from './features/sensors/pages/sensor-list/sensor-list.page';
import { ErrorPageComponent } from './features/system/pages/error/error.page';
import { DashboardResolver } from './core/resolvers/dashboard.resolver';

export const routes: Routes = [
  {
    path: 'dashboard',
    component: DataDashboardPageComponent,
    canActivate: [AuthGuard, RoleGuard],
    resolve: { dataMode: DashboardResolver },
    data: { title: 'Dashboard', roles: [UserRole.tenant_user, UserRole.tenant_admin] },
  },
  {
    path: 'gateways',
    component: GatewayListPageComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { title: 'Gateways', roles: [UserRole.tenant_user, UserRole.tenant_admin] },
  },
  {
    path: 'gateways/:id',
    component: GatewayDetailPageComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { title: 'Gateway Detail', roles: [UserRole.tenant_user, UserRole.tenant_admin] },
  },
  {
    path: 'sensors',
    component: SensorListPageComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { title: 'Sensors', roles: [UserRole.tenant_user, UserRole.tenant_admin] },
  },
  {
    path: 'sensors/:id',
    component: SensorDetailPageComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { title: 'Sensor Detail', roles: [UserRole.tenant_user, UserRole.tenant_admin] },
  },
  {
    path: 'alerts',
    component: AlertListPageComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { title: 'Alerts', roles: [UserRole.tenant_admin] },
  },
  {
    path: 'alerts/config',
    component: AlertConfigPageComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { title: 'Alerts Config', roles: [UserRole.tenant_admin] },
  },
  {
    path: 'mgmt/users',
    component: UserListPageComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { title: 'Users Management', roles: [UserRole.tenant_admin] },
  },
  {
    path: 'mgmt/limits',
    component: ThresholdSettingsPageComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { title: 'Threshold Settings', roles: [UserRole.tenant_admin] },
  },
  {
    path: 'mgmt/api',
    component: ApiClientListPageComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { title: 'API Clients', roles: [UserRole.tenant_admin] },
  },
  {
    path: 'mgmt/logs',
    component: AuditLogPageComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { title: 'Audit Log', roles: [UserRole.tenant_admin] },
  },
  {
    path: 'mgmt/costs',
    component: CostDashboardPageComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { title: 'Costs', roles: [UserRole.tenant_admin] },
  },
  {
    path: 'admin/tenants',
    component: TenantManagerPageComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { title: 'Tenants', roles: [UserRole.system_admin] },
  },
  {
    path: 'admin/tenants/:id',
    component: TenantDetailPageComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { title: 'Tenant Detail', roles: [UserRole.system_admin] },
  },
  {
    path: 'admin/gateways',
    component: AdminGatewayListPageComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { title: 'Admin Gateways', roles: [UserRole.system_admin] },
  },
  { path: 'error', component: ErrorPageComponent },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'error?reason=not-found' },
];
