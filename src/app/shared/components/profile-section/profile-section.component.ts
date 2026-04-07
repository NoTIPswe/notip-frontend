import { Component, input, output } from '@angular/core';

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
  readonly profileRequested = output<void>();
  readonly passwordChangeRequested = output<void>();

  emitProfileRequested(event: Event): void {
    event.preventDefault();
    this.profileRequested.emit();
  }

  emitPasswordChangeRequested(event: Event): void {
    event.preventDefault();
    this.passwordChangeRequested.emit();
  }
}
