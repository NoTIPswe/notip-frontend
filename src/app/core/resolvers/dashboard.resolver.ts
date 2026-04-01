import { Injectable, inject } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

export type DashboardDataMode = 'obfuscated' | 'clear';

@Injectable({ providedIn: 'root' })
export class DashboardResolver implements Resolve<DashboardDataMode> {
  private readonly auth = inject(AuthService);

  resolve(): Observable<DashboardDataMode> {
    return of(this.auth.isImpersonating() ? 'obfuscated' : 'clear');
  }
}
