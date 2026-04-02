import { Component, inject, input, output, signal } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-impersonate-button',
  standalone: true,
  templateUrl: './impersonate-button.component.html',
  styleUrl: './impersonate-button.component.css',
})
export class ImpersonateButtonComponent {
  private readonly authService = inject(AuthService);

  readonly userId = input.required<string>();
  readonly disabled = input<boolean>(false);

  readonly started = output<string>();
  readonly failed = output<string>();

  readonly inProgress = signal<boolean>(false);

  requestImpersonation(): void {
    const targetUserId = this.userId().trim();
    if (!targetUserId || this.disabled() || this.inProgress()) {
      return;
    }

    this.inProgress.set(true);
    this.authService.startImpersonation(targetUserId).subscribe({
      next: (token) => {
        this.inProgress.set(false);
        if (!token) {
          this.failed.emit('Impersonazione non avviata: token mancante.');
          return;
        }

        this.started.emit(targetUserId);
      },
      error: () => {
        this.inProgress.set(false);
        this.failed.emit('Impersonazione non riuscita.');
      },
    });
  }
}
