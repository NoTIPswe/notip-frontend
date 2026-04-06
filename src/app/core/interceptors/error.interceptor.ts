import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      if (error.status === 401) {
        const currentUrl = router.url || '/';
        const isErrorRoute =
          currentUrl === '/error' ||
          currentUrl.startsWith('/error/') ||
          currentUrl.startsWith('/error?');
        if (!isErrorRoute) {
          const retryUrl = currentUrl.startsWith('/') ? currentUrl : '/';
          void router.navigateByUrl(
            `/error?reason=unauthorized&retryUrl=${encodeURIComponent(retryUrl)}`,
          );
        }
        return throwError(() => error);
      }

      if (error.status === 403) {
        void router.navigateByUrl('/error?reason=forbidden');
      }

      return throwError(() => error);
    }),
  );
};
