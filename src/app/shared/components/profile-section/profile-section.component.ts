import { Component, input } from '@angular/core';

@Component({
  selector: 'app-profile-section',
  standalone: true,
  templateUrl: './profile-section.component.html',
  styleUrl: './profile-section.component.css',
})
export class ProfileSectionComponent {
  readonly username = input.required<string>();
  readonly role = input.required<string>();
  readonly showProfileLink = input<boolean>(true);
}
