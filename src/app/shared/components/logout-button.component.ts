import { Component, output } from '@angular/core';

@Component({
  selector: 'app-logout-button',
  standalone: true,
  template: `<button type="button" class="logout-btn" (click)="onClick()">Logout</button>`,
  styles: [
    `
      .logout-btn {
        width: 100%;
        border: 0;
        border-radius: 8px;
        background: #111827;
        color: #ffffff;
        padding: 0.6rem 0.8rem;
        cursor: pointer;
      }
    `,
  ],
})
export class LogoutButtonComponent {
  readonly clicked = output<void>();

  onClick(): void {
    this.clicked.emit();
  }
}
