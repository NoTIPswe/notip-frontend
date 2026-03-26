import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideApi } from './generated/openapi/notip-management-api-openapi';
import { IMPERSONATION_STATUS, SESSION_LIFECYCLE } from './core/auth/contracts';
import { AuthService } from './core/services/auth.service';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideRouter(routes),
    provideApi('/api/mgmt'),
    { provide: SESSION_LIFECYCLE, useExisting: AuthService },
    { provide: IMPERSONATION_STATUS, useExisting: AuthService },
  ],
};
