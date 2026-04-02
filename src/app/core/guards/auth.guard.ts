import { Injectable, inject } from '@angular/core';
import { CanActivate } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private readonly auth = inject(AuthService);

  async canActivate(): Promise<boolean> {
    const initialized = await this.auth.init();
    if (!initialized) {
      this.auth.login();
      return false;
    }

    const token = await this.auth.getToken();
    if (!token) {
      this.auth.login();
      return false;
    }

    return true;
  }
}
