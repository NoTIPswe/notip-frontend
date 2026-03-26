import { InjectionToken, Signal } from '@angular/core';
import { Observable } from 'rxjs';

export interface SessionLifeCycle {
  readonly logout$: Observable<void>;
  logout(): void;
}

export interface ImpersonationStatus {
  readonly isImpersonating: Signal<boolean>;
}

export const SESSION_LIFECYCLE = new InjectionToken<SessionLifeCycle>('SESSION_LIFECYCLE');
export const IMPERSONATION_STATUS = new InjectionToken<ImpersonationStatus>('IMPERSONATION_STATUS');
