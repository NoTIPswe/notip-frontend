import { Component, inject } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  template: `
    <section>
      <h2>Login</h2>
      <button type="button" (click)="login()">Accedi con Keycloak</button>
    </section>
  `,
})
export class LoginPageComponent {
  private readonly auth = inject(AuthService);

  login(): void {
    this.auth.login();
  }
}
