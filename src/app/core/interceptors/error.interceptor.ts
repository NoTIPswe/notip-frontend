import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      if (error.status === 401) {
        const currentUrl = router.url || '/';
        if (!currentUrl.startsWith('/error')) {
          const retryUrl = currentUrl.startsWith('/') ? currentUrl : '/';
          void router.navigateByUrl(
            `/error?reason=unauthorized&retryUrl=${encodeURIComponent(retryUrl)}`,
          );
        }
        return throwError(() => error);
      }

      if (error.status === 403 && req.url.includes('/api/mgmt/keys')) {
        auth.setImpersonating(true);
        return throwError(() => error);
      }

      if (error.status === 403) {
        void router.navigateByUrl('/error?reason=forbidden');
      }

      return throwError(() => error);
    }),
  );
};
