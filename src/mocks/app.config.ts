import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideApi as provideMgmtApi } from '../app/generated/openapi/notip-management-api-openapi';
import { provideApi as provideDataApi } from '../app/generated/openapi/notip-data-api-openapi';
import { IMPERSONATION_STATUS, SESSION_LIFECYCLE } from '../app/core/auth/contracts';
import { AuthService } from '../app/core/services/auth.service';
import { errorInterceptor } from '../app/core/interceptors/error.interceptor';
import { routes } from '../app/app.routes';
import { DevAuthService } from './dev-auth.service';

export const appMockConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: AuthService, useClass: DevAuthService },
    { provide: SESSION_LIFECYCLE, useExisting: AuthService },
    { provide: IMPERSONATION_STATUS, useExisting: AuthService },
    provideHttpClient(withInterceptors([errorInterceptor])),
    provideRouter(routes),
    provideMgmtApi('/api/mgmt'),
    provideDataApi('/api/data'),
  ],
};
