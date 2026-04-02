import { Component, output } from '@angular/core';

@Component({
  selector: 'app-logout-button',
  standalone: true,
  templateUrl: './logout-button.component.html',
  styleUrl: './logout-button.component.css',
})
export class LogoutButtonComponent {
  readonly clicked = output<void>();

  onClick(): void {
    this.clicked.emit();
  }
}
