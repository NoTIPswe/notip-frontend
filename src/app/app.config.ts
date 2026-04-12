import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import {
  AutoRefreshTokenService,
  UserActivityService,
  provideKeycloak,
  withAutoRefreshToken,
} from 'keycloak-angular';
import { provideApi as provideMgmtApi } from './generated/openapi/notip-management-api-openapi';
import { provideApi as provideDataApi } from './generated/openapi/notip-data-api-openapi';
import { IMPERSONATION_STATUS, SESSION_LIFECYCLE } from './core/auth/contracts';
import { AuthService } from './core/services/auth.service';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

import { routes } from './app.routes';

const keycloakConfig = {
  url: '/auth',
  realm: 'notip',
  clientId: 'notip-frontend',
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideKeycloak({
      config: keycloakConfig,
      initOptions: {
        onLoad: 'login-required',
        pkceMethod: 'S256',
        checkLoginIframe: false,
      },
      features: [
        withAutoRefreshToken({
          onInactivityTimeout: 'logout',
          sessionTimeout: 10 * 60 * 1000,
        }),
      ],
      providers: [AutoRefreshTokenService, UserActivityService],
    }),
    provideHttpClient(withInterceptors([authInterceptor, errorInterceptor])),
    provideRouter(routes),
    provideMgmtApi('/api/mgmt'),
    provideDataApi('/api/data'),
    { provide: SESSION_LIFECYCLE, useExisting: AuthService },
    { provide: IMPERSONATION_STATUS, useExisting: AuthService },
  ],
};
