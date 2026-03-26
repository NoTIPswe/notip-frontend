import { Component, input } from '@angular/core';

@Component({
  selector: 'app-profile-section',
  standalone: true,
  template: `
    <div class="profile">
      <p class="name">{{ username() }}</p>
      <p class="role">{{ role() }}</p>
      @if (showProfileLink()) {
        <a href="#" aria-label="Keycloak profile">Apri profilo</a>
      }
    </div>
  `,
  styles: [
    `
      .profile {
        display: grid;
        gap: 0.2rem;
      }

      .name {
        margin: 0;
        font-weight: 700;
      }

      .role {
        margin: 0;
        color: #4b5563;
        font-size: 0.9rem;
      }

      a {
        color: #0369a1;
        font-size: 0.9rem;
      }
    `,
  ],
})
export class ProfileSectionComponent {
  readonly username = input.required<string>();
  readonly role = input.required<string>();
  readonly showProfileLink = input<boolean>(true);
}
