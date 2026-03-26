import { Component } from '@angular/core';

@Component({
  selector: 'app-impersonation-tag',
  standalone: true,
  template: `
    <p class="tag">MODALITA OSCURATA - stai visualizzando la sessione di un altro utente.</p>
  `,
  styles: [
    `
      .tag {
        margin: 0;
        padding: 0.5rem 0.75rem;
        border: 1px solid #f59e0b;
        border-radius: 8px;
        background: #fffbeb;
        color: #92400e;
        font-size: 0.85rem;
      }
    `,
  ],
})
export class ImpersonationTagComponent {}
