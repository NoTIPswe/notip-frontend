import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/enums';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    const role = this.auth.getRole();
    const allowed = (route.data['roles'] as UserRole[] | undefined) ?? [];

    if (allowed.length === 0 || allowed.includes(role)) {
      return true;
    }

    if (role === UserRole.system_admin) {
      return this.router.parseUrl('/admin/tenants');
    }

    return this.router.parseUrl('/dashboard');
  }
}

@Injectable({ providedIn: 'root' })
export class HomeRedirectGuard implements CanActivate {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  canActivate(): UrlTree {
    const role = this.auth.getRole();

    if (role === UserRole.system_admin) {
      return this.router.parseUrl('/admin/tenants');
    }

    return this.router.parseUrl('/dashboard');
  }
}
